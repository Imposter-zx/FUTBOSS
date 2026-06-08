"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WSClient } from "../../websocket/client";

type ConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting";

interface UseWebSocketOptions {
  url?: string;
  token?: string;
  autoConnect?: boolean;
  channels?: string[];
  onMessage?: (type: string, data: Record<string, unknown>) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  connectionState: ConnectionState;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  lastMessage: { type: string; data: Record<string, unknown> } | null;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL ?? `ws://${typeof window !== "undefined" ? window.location.host : "localhost:3000"}/ws`,
    token,
    autoConnect = true,
    channels = [],
    onMessage,
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [lastMessage, setLastMessage] = useState<{ type: string; data: Record<string, unknown> } | null>(null);
  const clientRef = useRef<WSClient | null>(null);
  const cleanupsRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    const client = new WSClient({
      url,
      token,
      autoReconnect: true,
      maxReconnectAttempts: 10,
      onOpen: () => setConnectionState("connected"),
      onClose: () => setConnectionState("disconnected"),
      onReconnect: () => setConnectionState("reconnecting"),
      onError: () => setConnectionState("disconnected"),
    });

    clientRef.current = client;

    const cleanup1 = client.on("*", (data, message) => {
      setLastMessage({ type: message.type, data });
      onMessage?.(message.type, data);
    });

    cleanupsRef.current.push(cleanup1);

    if (autoConnect) {
      setConnectionState("connecting");
      client.connect();
    }

    return () => {
      cleanupsRef.current.forEach((fn) => fn());
      cleanupsRef.current = [];
      client.disconnect();
      clientRef.current = null;
    };
  }, [url, token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    for (const channel of channels) {
      client.subscribe(channel);
    }

    return () => {
      for (const channel of channels) {
        client?.unsubscribe(channel);
      }
    };
  }, [channels]);

  const subscribe = useCallback((channel: string) => {
    clientRef.current?.subscribe(channel);
  }, []);

  const unsubscribe = useCallback((channel: string) => {
    clientRef.current?.unsubscribe(channel);
  }, []);

  const connect = useCallback(() => {
    setConnectionState("connecting");
    clientRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    setConnectionState("disconnected");
  }, []);

  return {
    isConnected: connectionState === "connected",
    connectionState,
    subscribe,
    unsubscribe,
    lastMessage,
    connect,
    disconnect,
  };
}

export default useWebSocket;
