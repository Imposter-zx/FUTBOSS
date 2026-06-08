import { WebSocketServer, WebSocket } from "ws";
import { createServer, IncomingMessage } from "http";
import { parse } from "url";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { eventEmitter } from "@/lib/event-emitter";

interface Client {
  ws: WebSocket;
  id: string;
  subscriptions: Set<string>;
  userId?: string;
  joinedAt: Date;
}

interface WSMessage {
  type: string;
  payload: Record<string, unknown>;
}

const clients = new Map<string, Client>();
const HEARTBEAT_INTERVAL = 30000;
const MAX_CLIENTS_PER_IP = 50;
const ipConnections = new Map<string, number>();

let wss: WebSocketServer | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

function generateClientId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]!.trim();
  }
  return req.socket.remoteAddress ?? "unknown";
}

function sendToClient(client: Client, message: WSMessage): void {
  if (client.ws.readyState === WebSocket.OPEN) {
    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      logger.error("Failed to send message to client", {
        clientId: client.id,
        error: error instanceof Error ? error.message : "Unknown",
      });
    }
  }
}

function sendToSubscribers(
  channel: string,
  message: WSMessage,
  excludeClientId?: string
): void {
  let sent = 0;
  clients.forEach((client) => {
    if (
      client.subscriptions.has(channel) &&
      client.ws.readyState === WebSocket.OPEN &&
      client.id !== excludeClientId
    ) {
      sendToClient(client, message);
      sent++;
    }
  });

  if (sent > 0) {
    redis.publish(
      `ws:${channel}`,
      JSON.stringify(message)
    ).catch(() => {});
  }
}

function broadcastToAll(message: WSMessage): void {
  let sent = 0;
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      sendToClient(client, message);
      sent++;
    }
  });
  logger.debug(`Broadcast message "${message.type}" to ${sent} clients`);
}

function handleMessage(client: Client, rawData: Buffer | ArrayBuffer | Buffer[]): void {
  try {
    const message: WSMessage = JSON.parse(rawData.toString());
    const { type, payload } = message;

    switch (type) {
      case "SUBSCRIBE": {
        const channel = payload.channel as string;
        if (channel) {
          client.subscriptions.add(channel);
          sendToClient(client, {
            type: "SUBSCRIBED",
            payload: { channel },
          });
          logger.debug(`Client ${client.id} subscribed to ${channel}`);
        }
        break;
      }

      case "UNSUBSCRIBE": {
        const channel = payload.channel as string;
        if (channel) {
          client.subscriptions.delete(channel);
          sendToClient(client, {
            type: "UNSUBSCRIBED",
            payload: { channel },
          });
        }
        break;
      }

      case "PONG": {
        // Heartbeat response - client is alive
        break;
      }

      case "MATCH_EVENT":
      case "MATCH_UPDATE": {
        const matchId = payload.matchId as string;
        if (matchId) {
          const ch = `match:${matchId}`;
          sendToSubscribers(ch, message, client.id);
        } else {
          broadcastToAll(message);
        }
        break;
      }

      default: {
        sendToClient(client, {
          type: "ERROR",
          payload: { message: `Unknown message type: ${type}` },
        });
      }
    }
  } catch (error) {
    logger.error("Failed to parse WebSocket message", {
      clientId: client.id,
      error: error instanceof Error ? error.message : "Unknown",
    });
    sendToClient(client, {
      type: "ERROR",
      payload: { message: "Invalid message format" },
    });
  }
}

function handleConnection(ws: WebSocket, req: IncomingMessage): void {
  const clientIp = getClientIp(req);
  const currentCount = ipConnections.get(clientIp) ?? 0;

  if (currentCount >= MAX_CLIENTS_PER_IP) {
    ws.close(1013, "Too many connections");
    logger.warn(`Connection limit reached for IP: ${clientIp}`);
    return;
  }

  ipConnections.set(clientIp, currentCount + 1);

  const client: Client = {
    ws,
    id: generateClientId(),
    subscriptions: new Set(),
    joinedAt: new Date(),
  };

  const query = parse(req.url ?? "", true).query;
  if (typeof query.userId === "string") {
    client.userId = query.userId;
    client.subscriptions.add(`user:${query.userId}`);
  }

  clients.set(client.id, client);

  sendToClient(client, {
    type: "CONNECTION_ACK",
    payload: {
      clientId: client.id,
      timestamp: new Date().toISOString(),
    },
  });

  ws.on("message", (data: Buffer | ArrayBuffer | Buffer[]) => {
    handleMessage(client, data);
  });

  ws.on("close", () => {
    const ipCount = ipConnections.get(clientIp) ?? 1;
    ipConnections.set(clientIp, Math.max(0, ipCount - 1));
    clients.delete(client.id);
    logger.info(`Client ${client.id} disconnected`);
  });

  ws.on("error", (error) => {
    logger.error(`WebSocket error for client ${client.id}`, {
      error: error.message,
    });
    clients.delete(client.id);
  });

  logger.info(`Client ${client.id} connected from ${clientIp}`);
}

function heartbeatCheck(): void {
  const now = Date.now();
  clients.forEach((client, id) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      sendToClient(client, { type: "PING", payload: {} });

      setTimeout(() => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
          setTimeout(() => {
            if (client.ws.readyState === WebSocket.OPEN) {
              client.ws.terminate();
              clients.delete(id);
            }
          }, 5000);
        }
      }, 10000);
    } else {
      clients.delete(id);
    }
  });
}

function setupRedisPubSub(): void {
  const subscriber = redis.duplicate();

  subscriber.on("message", (channel: string, message: string) => {
    try {
      const wsChannel = channel.replace("ws:", "");
      const parsed: WSMessage = JSON.parse(message);
      sendToSubscribers(wsChannel, parsed);
    } catch (error) {
      logger.error("Failed to handle Redis pub/sub message", {
        channel,
        error: error instanceof Error ? error.message : "Unknown",
      });
    }
  });

  subscriber.psubscribe("ws:*").catch((error) => {
    logger.error("Failed to subscribe to Redis channels", {
      error: error instanceof Error ? error.message : "Unknown",
    });
  });

  logger.info("Redis pub/sub listener started");
}

export function startWebSocketServer(port: number = 3001): WebSocketServer {
  if (wss) {
    logger.warn("WebSocket server already running");
    return wss;
  }

  const server = createServer();
  wss = new WebSocketServer({ server });

  wss.on("connection", handleConnection);

  wss.on("error", (error) => {
    logger.error("WebSocket server error", {
      error: error.message,
    });
  });

  server.listen(port, () => {
    logger.info(`WebSocket server listening on port ${port}`);
  });

  heartbeatTimer = setInterval(heartbeatCheck, HEARTBEAT_INTERVAL);

  setupRedisPubSub();

  eventEmitter.on("match:update", (...args: unknown[]) => {
    const [matchId, data] = args as [string, unknown];
    const channel = `match:${matchId}`;
    sendToSubscribers(channel, {
      type: "MATCH_UPDATE",
      payload: { matchId, ...(data as Record<string, unknown>) },
    });
  });

  eventEmitter.on("match:event", (...args: unknown[]) => {
    const [matchId, eventData] = args as [string, unknown];
    const channel = `match:${matchId}`;
    sendToSubscribers(channel, {
      type: "MATCH_EVENT",
      payload: { matchId, event: eventData },
    });
  });

  eventEmitter.on("notification", (...args: unknown[]) => {
    const [userId, notification] = args as [string, unknown];
    const channel = `user:${userId}`;
    sendToSubscribers(channel, {
      type: "NOTIFICATION",
      payload: { notification },
    });
  });

  return wss;
}

export function stopWebSocketServer(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  clients.forEach((client) => {
    try {
      client.ws.close(1001, "Server shutting down");
    } catch {
      // Ignore close errors
    }
  });
  clients.clear();
  ipConnections.clear();

  if (wss) {
    wss.close(() => {
      logger.info("WebSocket server stopped");
      wss = null;
    });
  }
}

export function getConnectedClients(): {
  total: number;
  users: number;
  subscriptions: Map<string, number>;
} {
  const subscriptions = new Map<string, number>();

  clients.forEach((client) => {
    client.subscriptions.forEach((channel) => {
      subscriptions.set(channel, (subscriptions.get(channel) ?? 0) + 1);
    });
  });

  return {
    total: clients.size,
    users: Array.from(clients.values()).filter((c) => c.userId).length,
    subscriptions,
  };
}

export function broadcastMatchUpdate(matchId: string, data: Record<string, unknown>): void {
  eventEmitter.emit("match:update", matchId, data);
}

export function broadcastMatchEvent(matchId: string, eventData: Record<string, unknown>): void {
  eventEmitter.emit("match:event", matchId, eventData);
}

export function sendNotification(userId: string, notification: Record<string, unknown>): void {
  eventEmitter.emit("notification", userId, notification);
}

export default { startWebSocketServer, stopWebSocketServer, getConnectedClients };
