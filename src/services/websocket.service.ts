import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";
import { logger } from "@/lib/logger";
import { BaseService } from "./base.service";

type Client = {
  ws: WebSocket;
  userId?: string;
  subscriptions: Set<string>;
  isAlive: boolean;
};

type WsMessage = {
  type: string;
  channel?: string;
  payload: Record<string, unknown>;
};

type EventHandler = (data: Record<string, unknown>) => void;

export class WebSocketService extends BaseService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Client> = new Map();
  private handlers: Map<string, EventHandler[]> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super("WebSocketService");
  }

  initialize(server: Server): void {
    if (this.wss) {
      this.logWarn("WebSocket server already initialized");
      return;
    }

    try {
      this.wss = new WebSocketServer({
        server,
        path: "/ws",
        maxPayload: 1024 * 100,
      });

      this.wss.on("connection", (ws: WebSocket, req) => {
        const clientId = this.generateClientId();
        const client: Client = {
          ws,
          subscriptions: new Set(),
          isAlive: true,
        };

        this.clients.set(clientId, client);
        this.logInfo("Client connected", { clientId, ip: req.socket.remoteAddress });

        ws.on("message", (raw) => {
          try {
            const message: WsMessage = JSON.parse(raw.toString());
            this.handleMessage(clientId, message);
          } catch {
            this.sendTo(clientId, {
              type: "error",
              payload: { message: "Invalid message format" },
            });
          }
        });

        ws.on("pong", () => {
          client.isAlive = true;
        });

        ws.on("close", () => {
          this.clients.delete(clientId);
          this.logInfo("Client disconnected", { clientId });
        });

        ws.on("error", (error) => {
          this.logError("WebSocket client error", { clientId, error: error.message });
          this.clients.delete(clientId);
        });

        this.sendTo(clientId, {
          type: "connected",
          payload: { clientId },
        });
      });

      this.wss.on("error", (error) => {
        this.logError("WebSocket server error", { error: error.message });
      });

      this.heartbeatInterval = setInterval(() => {
        this.wss?.clients.forEach((ws) => {
          const client = Array.from(this.clients.values()).find(
            (c) => c.ws === ws,
          );
          if (client && !client.isAlive) {
            this.clients.delete(
              Array.from(this.clients.entries()).find(
                ([, c]) => c === client,
              )?.[0] ?? "",
            );
            return ws.terminate();
          }
          if (client) {
            client.isAlive = false;
            ws.ping();
          }
        });
      }, 30000);

      this.logInfo("WebSocket server initialized");
    } catch (error) {
      this.logError("Failed to initialize WebSocket server", {
        error: (error as Error).message,
      });
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private handleMessage(clientId: string, message: WsMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case "subscribe":
        if (message.channel) {
          client.subscriptions.add(message.channel);
          this.sendTo(clientId, {
            type: "subscribed",
            payload: { channel: message.channel },
          });
        }
        break;

      case "unsubscribe":
        if (message.channel) {
          client.subscriptions.delete(message.channel);
          this.sendTo(clientId, {
            type: "unsubscribed",
            payload: { channel: message.channel },
          });
        }
        break;

      case "authenticate":
        if (message.payload?.userId) {
          client.userId = message.payload.userId as string;
          this.sendTo(clientId, {
            type: "authenticated",
            payload: { userId: message.payload.userId },
          });
        }
        break;

      default:
        this.sendTo(clientId, {
          type: "error",
          payload: { message: `Unknown message type: ${message.type}` },
        });
    }
  }

  private sendTo(clientId: string, message: WsMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      this.logError("Failed to send message", {
        clientId,
        error: (error as Error).message,
      });
    }
  }

  broadcast(channel: string, type: string, payload: Record<string, unknown>): void {
    const message: WsMessage = { type, channel, payload };
    const data = JSON.stringify(message);

    let sentCount = 0;

    this.clients.forEach((client, clientId) => {
      if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(data);
          sentCount++;
        } catch (error) {
          this.logWarn("Broadcast failed to client", {
            clientId,
            error: (error as Error).message,
          });
        }
      }
    });

    if (sentCount > 0) {
      this.logInfo(`Broadcast to ${sentCount} clients`, { channel, type });
    }
  }

  broadcastToUser(userId: string, type: string, payload: Record<string, unknown>): void {
    const message: WsMessage = { type, payload };
    const data = JSON.stringify(message);

    this.clients.forEach((client) => {
      if (
        client.userId === userId &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        try {
          client.ws.send(data);
        } catch (error) {
          this.logWarn("User broadcast failed", {
            userId,
            error: (error as Error).message,
          });
        }
      }
    });
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

  emit(event: string, data: Record<string, unknown>): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          this.logError("Event handler failed", {
            event,
            error: (error as Error).message,
          });
        }
      });
    }
  }

  getConnectedClients(): number {
    return this.clients.size;
  }

  getChannelSubscribers(channel: string): number {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.subscriptions.has(channel)) count++;
    });
    return count;
  }

  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.clients.forEach((client, clientId) => {
      try {
        client.ws.close(1001, "Server shutting down");
      } catch {
        // ignore
      }
    });
    this.clients.clear();

    this.wss?.close(() => {
      this.logInfo("WebSocket server shut down");
    });
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;
