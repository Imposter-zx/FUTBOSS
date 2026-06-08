"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useWebSocket } from "./useWebSocket";

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  fetchNotifications: (page?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  hasMore: boolean;
}

export function useNotifications(): UseNotificationsReturn {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { isConnected } = useWebSocket({
    autoConnect: !!session?.user?.id,
    onMessage: (type, data) => {
      if (type === "notification") {
        const notification = data as unknown as Notification;
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    },
  });

  const fetchNotifications = useCallback(async (pageNum?: number) => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const p = pageNum ?? page;
      const response = await fetch(`/api/notifications?page=${p}&pageSize=20`);
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const result = await response.json();

      if (p === 1) {
        setNotifications(result.data ?? []);
      } else {
        setNotifications((prev) => [...prev, ...(result.data ?? [])]);
      }

      setPage(p + 1);
      setHasMore(result.pagination?.hasNext ?? false);
      setError(null);
    } catch {
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, page]);

  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch("/api/notifications/unread-count");
      if (!response.ok) return;
      const result = await response.json();
      setUnreadCount(result.data?.unreadCount ?? 0);
    } catch {
      // silently fail
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications(1);
      fetchUnreadCount();
    }
  }, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.user?.id) {
        fetchUnreadCount();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [session?.user?.id, fetchUnreadCount]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });

      if (!response.ok) throw new Error("Failed to mark as read");

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      return true;
    } catch {
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      if (!response.ok) throw new Error("Failed to mark all as read");

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() })),
      );
      setUnreadCount(0);

      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    fetchUnreadCount,
    hasMore,
  };
}

export default useNotifications;
