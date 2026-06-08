type ConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting";

type WSMessage = {
  type: string;
  channel?: string;
  payload?: Record<string, unknown>;
  timestamp?: string;
};

type EventListener = (data: Record<string, unknown>, message: WSMessage) => void;

type WSClientOptions = {
  url: string;
  token?: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectBaseDelay?: number;
  reconnectMaxDelay?: number;
  heartbeatInterval?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onReconnect?: (attempt: number) => void;
};

export class WSClient {
  private ws: WebSocket | null = null;
  private options: Required<WSClientOptions>;
  private state: ConnectionState = "disconnected";
  private listeners: Map<string, Set<EventListener>> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private intentionalClose = false;
  private messageQueue: WSMessage[] = [];

  constructor(options: WSClientOptions) {
    this.options = {
      url: options.url,
      token: options.token ?? "",
      autoReconnect: options.autoReconnect ?? true,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 10,
      reconnectBaseDelay: options.reconnectBaseDelay ?? 1000,
      reconnectMaxDelay: options.reconnectMaxDelay ?? 30000,
      heartbeatInterval: options.heartbeatInterval ?? 25000,
      onOpen: options.onOpen ?? (() => {}),
      onClose: options.onClose ?? (() => {}),
      onError: options.onError ?? (() => {}),
      onReconnect: options.onReconnect ?? (() => {}),
    };
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.intentionalClose = false;
    this.state = "connecting";

    try {
      this.ws = new WebSocket(this.options.url);

      this.ws.onopen = () => {
        this.state = "connected";
        this.reconnectAttempts = 0;
        this.options.onOpen();

        if (this.options.token) {
          this.send({ type: "authenticate", payload: { token: this.options.token } });
        }

        this.flushQueue();
        this.startHeartbeat();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message: WSMessage = JSON.parse(event.data as string);
          this.dispatch(message.type, message.payload ?? {}, message);

          if (message.type === "pong") {
            this.handlePong();
          }

          if (message.type === "authenticated" && message.payload?.userId) {
            this.emit("authenticated", message.payload ?? {});
          }
        } catch {
          // invalid JSON, ignore
        }
      };

      this.ws.onclose = () => {
        this.state = "disconnected";
        this.stopHeartbeat();
        this.options.onClose();

        if (!this.intentionalClose && this.options.autoReconnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error: Event) => {
        this.options.onError(error);
      };

      (this.ws as any).on("ping", () => {
        this.ws?.send(JSON.stringify({ type: "pong", payload: {} }));
      });
    } catch {
      this.state = "disconnected";
      if (this.options.autoReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.state = "disconnected";
    this.reconnectAttempts = 0;
  }

  subscribe(channel: string): void {
    this.send({ type: "subscribe", channel });
  }

  unsubscribe(channel: string): void {
    this.send({ type: "unsubscribe", channel });
  }

  on(event: string, listener: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  off(event: string, listener: EventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, data: Record<string, unknown>): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const message: WSMessage = { type: event, payload: data };
      for (const listener of listeners) {
        try {
          listener(data, message);
        } catch {
          // ignore
        }
      }
    }
  }

  getState(): ConnectionState {
    return this.state;
  }

  isConnected(): boolean {
    return this.state === "connected";
  }

  private send(message: WSMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else if (this.state === "connecting" || this.state === "reconnecting") {
      this.messageQueue.push(message);
    }
  }

  private flushQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  private dispatch(type: string, data: Record<string, unknown>, message: WSMessage): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data, message);
        } catch {
          // ignore
        }
      }
    }

    const wildcardListeners = this.listeners.get("*");
    if (wildcardListeners) {
      for (const listener of wildcardListeners) {
        try {
          listener(data, message);
        } catch {
          // ignore
        }
      }
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: "ping", payload: { timestamp: Date.now() } });
      }
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private handlePong(): void {
    // heartbeat acknowledged
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.state = "disconnected";
      this.emit("reconnect_failed", {
        attempts: this.reconnectAttempts,
        maxAttempts: this.options.maxReconnectAttempts,
      });
      return;
    }

    this.state = "reconnecting";
    this.reconnectAttempts++;
    this.options.onReconnect(this.reconnectAttempts);

    const delay = Math.min(
      this.options.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts - 1) + Math.random() * 1000,
      this.options.reconnectMaxDelay,
    );

    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  updateToken(token: string): void {
    this.options.token = token;
    if (this.isConnected()) {
      this.send({ type: "authenticate", payload: { token } });
    }
  }
}

export default WSClient;
