"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useWebSocket } from "./useWebSocket";

interface LiveMatchState {
  matchId: string;
  homeScore: number;
  awayScore: number;
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
  minute: number;
  status: string;
  period: string | null;
  events: MatchEvent[];
}

interface MatchEvent {
  id: string;
  type: string;
  minute: number;
  extraMinute: number | null;
  playerId: string | null;
  playerName: string | null;
  teamId: string;
  detail: string | null;
  scoreHome: number | null;
  scoreAway: number | null;
  timestamp: string;
}

interface UseLiveMatchOptions {
  matchId: string;
  initialData?: Partial<LiveMatchState>;
}

interface UseLiveMatchReturn {
  matchState: LiveMatchState | null;
  isLive: boolean;
  latestEvent: MatchEvent | null;
  events: MatchEvent[];
}

export function useLiveMatch({ matchId, initialData }: UseLiveMatchOptions): UseLiveMatchReturn {
  const [matchState, setMatchState] = useState<LiveMatchState | null>(() => {
    if (initialData) {
      return {
        matchId,
        homeScore: initialData.homeScore ?? 0,
        awayScore: initialData.awayScore ?? 0,
        homePenaltyScore: initialData.homePenaltyScore ?? null,
        awayPenaltyScore: initialData.awayPenaltyScore ?? null,
        minute: initialData.minute ?? 0,
        status: initialData.status ?? "SCHEDULED",
        period: initialData.period ?? null,
        events: [],
      };
    }
    return null;
  });

  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<MatchEvent | null>(null);
  const eventsRef = useRef<MatchEvent[]>([]);

  const handleMessage = useCallback((type: string, data: Record<string, unknown>) => {
    if (type === `match:score`) {
      setMatchState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          homeScore: (data.homeScore as number) ?? prev.homeScore,
          awayScore: (data.awayScore as number) ?? prev.awayScore,
          minute: (data.minute as number) ?? prev.minute,
          status: (data.status as string) ?? prev.status,
          period: (data.period as string | null) ?? prev.period,
        };
      });
      return;
    }

    const matchEventTypes = ["match:goal", "match:card", "match:substitution", "match:penalty", "match:var"];
    if (matchEventTypes.includes(type)) {
      const event: MatchEvent = {
        id: (data.id as string) ?? `evt_${Date.now()}`,
        type: type.replace("match:", ""),
        minute: (data.minute as number) ?? 0,
        extraMinute: (data.extraMinute as number | null) ?? null,
        playerId: (data.playerId as string | null) ?? null,
        playerName: (data.playerName as string | null) ?? null,
        teamId: (data.teamId as string) ?? "",
        detail: (data.detail as string | null) ?? null,
        scoreHome: (data.scoreHome as number | null) ?? null,
        scoreAway: (data.scoreAway as number | null) ?? null,
        timestamp: new Date().toISOString(),
      };

      eventsRef.current = [...eventsRef.current, event];
      setEvents(eventsRef.current);
      setLatestEvent(event);

      if (type === "match:goal" && data.scoreHome !== undefined && data.scoreAway !== undefined) {
        setMatchState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            homeScore: (data.scoreHome as number) ?? prev.homeScore,
            awayScore: (data.scoreAway as number) ?? prev.awayScore,
            minute: (data.minute as number) ?? prev.minute,
          };
        });
      }
    }

    if (type === "match:match_start") {
      setMatchState((prev) => {
        if (!prev) return prev;
        return { ...prev, status: "LIVE", minute: 0, period: "FIRST_HALF" };
      });
    }

    if (type === "match:half_time") {
      setMatchState((prev) => {
        if (!prev) return prev;
        return { ...prev, status: "HALF_TIME", period: "HALF_TIME" };
      });
    }

    if (type === "match:full_time") {
      setMatchState((prev) => {
        if (!prev) return prev;
        return { ...prev, status: "FINISHED", minute: 90, period: null };
      });
    }
  }, []);

  const { isConnected, subscribe, unsubscribe } = useWebSocket({
    channels: [`match:${matchId}`],
    onMessage: handleMessage,
  });

  useEffect(() => {
    return () => {
      eventsRef.current = [];
    };
  }, [matchId]);

  useEffect(() => {
    subscribe(`match:${matchId}`);
    return () => {
      unsubscribe(`match:${matchId}`);
    };
  }, [matchId, subscribe, unsubscribe]);

  const isLive = matchState?.status === "LIVE"
    || matchState?.status === "HALF_TIME"
    || matchState?.status === "EXTRA_TIME"
    || matchState?.status === "PENALTIES";

  return {
    matchState,
    isLive,
    latestEvent,
    events,
  };
}

export default useLiveMatch;
