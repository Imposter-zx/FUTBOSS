import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.WEBSOCKET_JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? "fallback-secret";
const HEARTBEAT_INTERVAL = 25000;
const HEARTBEAT_TIMEOUT = 35000;
const MAX_MESSAGE_SIZE = 1024 * 50;
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW = 60000;
const MAX_SUBSCRIPTIONS = 50;
const MAX_CONNECTIONS_PER_IP = 10;

interface AuthenticatedClient {
  ws: WebSocket;
  userId?: string;
  role?: string;
  subscriptions: Set<string>;
  isAlive: boolean;
  ip: string;
  connectedAt: number;
  messageCount: number;
  rateLimitStart: number;
  lastPing: number;
}

interface WSMessage {
  type: string;
  channel?: string;
  payload?: Record<string, unknown>;
  token?: string;
}

type EventHandler = (data: Record<string, unknown>, client: AuthenticatedClient) => void;

export class FutbossWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, AuthenticatedClient> = new Map();
  private channels: Map<string, Set<string>> = new Map();
  private handlers: Map<string, EventHandler[]> = new Map();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private ipConnections: Map<string, Set<string>> = new Map();

  constructor() {
    this.setupDefaultHandlers();
  }

  private setupDefaultHandlers(): void {
    this.on("subscribe", (data, client) => {
      const channel = data.channel as string;
      if (!channel) return;

      if (client.subscriptions.size >= MAX_SUBSCRIPTIONS) {
        this.sendToClient(client, {
          type: "error",
          payload: { message: "Maximum subscriptions reached" },
        });
        return;
      }

      client.subscriptions.add(channel);

      if (!this.channels.has(channel)) {
        this.channels.set(channel, new Set());
      }
      this.channels.get(channel)!.add(this.getClientId(client));

      this.sendToClient(client, {
        type: "subscribed",
        channel,
        payload: { channel },
      });
    });

    this.on("unsubscribe", (data, client) => {
      const channel = data.channel as string;
      if (!channel) return;

      client.subscriptions.delete(channel);
      this.channels.get(channel)?.delete(this.getClientId(client));

      this.sendToClient(client, {
        type: "unsubscribed",
        channel,
        payload: { channel },
      });
    });

    this.on("authenticate", async (data, client) => {
      const token = data.token as string;
      if (!token) {
        this.sendToClient(client, {
          type: "error",
          payload: { message: "Token required" },
        });
        return;
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
        client.userId = decoded.id;
        client.role = decoded.role;

        this.sendToClient(client, {
          type: "authenticated",
          payload: { userId: decoded.id, role: decoded.role },
        });
      } catch {
        this.sendToClient(client, {
          type: "error",
          payload: { message: "Invalid token" },
        });
      }
    });

    this.on("ping", (_data, client) => {
      client.lastPing = Date.now();
      this.sendToClient(client, { type: "pong", payload: { timestamp: Date.now() } });
    });

    this.on("pong", (_data, client) => {
      client.isAlive = true;
    });
  }

  initialize(server: Server): void {
    if (this.wss) return;

    this.wss = new WebSocketServer({
      server,
      path: "/ws",
      maxPayload: MAX_MESSAGE_SIZE,
    });

    this.wss.on("connection", (ws: WebSocket, req) => {
      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
        ?? req.socket.remoteAddress
        ?? "unknown";

      if (this.checkRateLimit(ip)) {
        ws.close(4001, "Rate limited");
        return;
      }

      const clientId = this.generateId();
      const client: AuthenticatedClient = {
        ws,
        subscriptions: new Set(),
        isAlive: true,
        ip,
        connectedAt: Date.now(),
        messageCount: 0,
        rateLimitStart: Date.now(),
        lastPing: Date.now(),
      };

      this.clients.set(clientId, client);

      if (!this.ipConnections.has(ip)) {
        this.ipConnections.set(ip, new Set());
      }
      this.ipConnections.get(ip)!.add(clientId);

      this.sendToClient(client, {
        type: "connected",
        payload: { clientId, timestamp: new Date().toISOString() },
      });

      ws.on("message", (raw: Buffer) => {
        if (Buffer.byteLength(raw, "utf8") > MAX_MESSAGE_SIZE) {
          ws.close(4002, "Message too large");
          return;
        }

        client.messageCount++;
        const elapsed = Date.now() - client.rateLimitStart;
        if (elapsed > RATE_LIMIT_WINDOW) {
          client.messageCount = 1;
          client.rateLimitStart = Date.now();
        } else if (client.messageCount > RATE_LIMIT_MAX) {
          this.sendToClient(client, {
            type: "error",
            payload: { message: "Rate limit exceeded" },
          });
          return;
        }

        try {
          const message: WSMessage = JSON.parse(raw.toString());
          this.handleMessage(clientId, client, message);
        } catch {
          this.sendToClient(client, {
            type: "error",
            payload: { message: "Invalid message format" },
          });
        }
      });

      ws.on("pong", () => {
        client.isAlive = true;
        client.lastPing = Date.now();
      });

      ws.on("close", () => {
        this.handleDisconnect(clientId, client);
      });

      ws.on("error", () => {
        this.handleDisconnect(clientId, client);
      });
    });

    this.wss.on("error", (error) => {
      console.error("[WebSocket] Server error:", error.message);
    });

    this.startHeartbeat();

    console.log("[WebSocket] Server initialized on /ws");
  }

  private handleDisconnect(clientId: string, client: AuthenticatedClient): void {
    for (const channel of client.subscriptions) {
      this.channels.get(channel)?.delete(clientId);
    }

    this.ipConnections.get(client.ip)?.delete(clientId);
    if (this.ipConnections.get(client.ip)?.size === 0) {
      this.ipConnections.delete(client.ip);
    }

    this.clients.delete(clientId);
  }

  private checkRateLimit(ip: string): boolean {
    const connections = this.ipConnections.get(ip);
    if (connections && connections.size >= MAX_CONNECTIONS_PER_IP) {
      return true;
    }
    return false;
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();

      for (const [clientId, client] of this.clients.entries()) {
        if (!client.isAlive) {
          if (now - client.lastPing > HEARTBEAT_TIMEOUT) {
            client.ws.terminate();
            this.handleDisconnect(clientId, client);
            continue;
          }
        }

        client.isAlive = false;
        try {
          client.ws.ping();
        } catch {
          this.handleDisconnect(clientId, client);
        }
      }
    }, HEARTBEAT_INTERVAL);
  }

  private generateId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private getClientId(client: AuthenticatedClient): string {
    for (const [id, c] of this.clients.entries()) {
      if (c === client) return id;
    }
    return "";
  }

  private handleMessage(clientId: string, client: AuthenticatedClient, message: WSMessage): void {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(message.payload ?? {}, client);
        } catch (error) {
          console.error(`[WebSocket] Handler error for ${message.type}:`, error);
        }
      }
    } else {
      this.sendToClient(client, {
        type: "error",
        payload: { message: `Unknown message type: ${message.type}` },
      });
    }
  }

  private sendToClient(client: AuthenticatedClient, message: Record<string, unknown>): void {
    if (client.ws.readyState !== WebSocket.OPEN) return;
    try {
      client.ws.send(JSON.stringify(message));
    } catch {
      // ignore
    }
  }

  on(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event) ?? [];
    handlers.push(handler);
    this.handlers.set(event, handlers);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      this.handlers.set(
        event,
        handlers.filter((h) => h !== handler),
      );
    }
  }

  broadcastToChannel(channel: string, type: string, payload: Record<string, unknown>): number {
    const subscribers = this.channels.get(channel);
    if (!subscribers || subscribers.size === 0) return 0;

    const message = JSON.stringify({ type, channel, payload, timestamp: new Date().toISOString() });
    let sent = 0;

    for (const clientId of subscribers) {
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(message);
          sent++;
        } catch {
          // ignore
        }
      }
    }

    return sent;
  }

  broadcastToUser(userId: string, type: string, payload: Record<string, unknown>): number {
    const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
    let sent = 0;

    for (const [, client] of this.clients) {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(message);
          sent++;
        } catch {
          // ignore
        }
      }
    }

    return sent;
  }

  broadcastAll(type: string, payload: Record<string, unknown>): number {
    const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
    let sent = 0;

    for (const [, client] of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(message);
          sent++;
        } catch {
          // ignore
        }
      }
    }

    return sent;
  }

  sendMatchEvent(
    matchId: string,
    eventType: "goal" | "card" | "substitution" | "match_start" | "half_time" | "full_time" | "penalty" | "var",
    data: Record<string, unknown>,
  ): number {
    return this.broadcastToChannel(`match:${matchId}`, `match:${eventType}`, {
      matchId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  sendNotification(userId: string, notification: Record<string, unknown>): number {
    return this.broadcastToUser(userId, "notification", notification);
  }

  sendFavoriteUpdate(userId: string, data: Record<string, unknown>): number {
    return this.broadcastToUser(userId, "favorite_update", data);
  }

  getChannelSubscriberCount(channel: string): number {
    return this.channels.get(channel)?.size ?? 0;
  }

  getConnectedCount(): number {
    return this.clients.size;
  }

  getChannelList(): string[] {
    return Array.from(this.channels.keys());
  }

  getConnectionInfo(): { total: number; channels: number; ips: number } {
    return {
      total: this.clients.size,
      channels: this.channels.size,
      ips: this.ipConnections.size,
    };
  }

  shutdown(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    for (const [, client] of this.clients) {
      try {
        client.ws.close(1001, "Server shutting down");
      } catch {
        // ignore
      }
    }

    this.clients.clear();
    this.channels.clear();
    this.ipConnections.clear();

    this.wss?.close(() => {
      console.log("[WebSocket] Server shut down");
    });
  }
}

export const futbossWsServer = new FutbossWebSocketServer();
export default futbossWsServer;
