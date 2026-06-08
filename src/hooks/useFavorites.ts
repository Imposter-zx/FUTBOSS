"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useWebSocket } from "./useWebSocket";

interface FavoriteItem {
  id: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

interface UseFavoritesReturn {
  favorites: FavoriteItem[];
  isFavorited: (entityType: string, entityId: string) => boolean;
  addFavorite: (entityType: string, entityId: string) => Promise<boolean>;
  removeFavorite: (entityType: string, entityId: string) => Promise<boolean>;
  checkFavorite: (entityType: string, entityId: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export function useFavorites(): UseFavoritesReturn {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { subscribe, unsubscribe, lastMessage } = useWebSocket({
    autoConnect: !!session?.user?.id,
  });

  useEffect(() => {
    if (!session?.user?.id) {
      setFavorites([]);
      return;
    }

    const fetchFavorites = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/favorites");
        if (!response.ok) throw new Error("Failed to fetch favorites");
        const data = await response.json();
        setFavorites(data.data ?? []);
        setError(null);
      } catch {
        setError("Failed to load favorites");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = "favorite_update";
    subscribe(channel);

    return () => {
      unsubscribe(channel);
    };
  }, [session?.user?.id, subscribe, unsubscribe]);

  useEffect(() => {
    if (!lastMessage || lastMessage.type !== "favorite_update") return;
    const data = lastMessage.data;
    if (data.type === "added") {
      setFavorites((prev) => [
        ...prev,
        {
          id: data.id as string,
          entityType: data.entityType as string,
          entityId: data.entityId as string,
          createdAt: data.createdAt as string,
        },
      ]);
    } else if (data.type === "removed") {
      setFavorites((prev) =>
        prev.filter(
          (f) => !(f.entityType === data.entityType && f.entityId === data.entityId),
        ),
      );
    }
  }, [lastMessage]);

  const isFavorited = useCallback(
    (entityType: string, entityId: string) => {
      return favorites.some(
        (f) => f.entityType === entityType && f.entityId === entityId,
      );
    },
    [favorites],
  );

  const addFavorite = useCallback(async (entityType: string, entityId: string) => {
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId }),
      });

      if (!response.ok) throw new Error("Failed to add favorite");
      const data = await response.json();

      if (data.data) {
        setFavorites((prev) => {
          const exists = prev.some(
            (f) => f.entityType === entityType && f.entityId === entityId,
          );
          if (exists) return prev;
          return [...prev, data.data];
        });
      }

      return true;
    } catch {
      setError("Failed to add favorite");
      return false;
    }
  }, []);

  const removeFavorite = useCallback(async (entityType: string, entityId: string) => {
    try {
      const response = await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId }),
      });

      if (!response.ok) throw new Error("Failed to remove favorite");

      setFavorites((prev) =>
        prev.filter(
          (f) => !(f.entityType === entityType && f.entityId === entityId),
        ),
      );

      return true;
    } catch {
      setError("Failed to remove favorite");
      return false;
    }
  }, []);

  const checkFavorite = useCallback(async (entityType: string, entityId: string) => {
    try {
      const response = await fetch(
        `/api/favorites/check?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`,
      );
      if (!response.ok) return false;
      const data = await response.json();
      return data.data?.isFavorited ?? false;
    } catch {
      return false;
    }
  }, []);

  return {
    favorites,
    isFavorited,
    addFavorite,
    removeFavorite,
    checkFavorite,
    isLoading,
    error,
  };
}

export default useFavorites;
