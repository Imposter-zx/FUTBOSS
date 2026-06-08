type EventName =
  | "page_view"
  | "match_view"
  | "team_view"
  | "player_view"
  | "competition_view"
  | "search"
  | "login"
  | "register"
  | "favorite_add"
  | "favorite_remove"
  | "notification_click"
  | "share"
  | "live_match_click"
  | "navigation_click";

interface AnalyticsEvent {
  name: EventName;
  properties?: Record<string, string | number | boolean | undefined>;
  timestamp?: string;
}

type AnalyticsProvider = {
  track: (event: AnalyticsEvent) => void;
  pageView: (path: string, title?: string) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
};

class Analytics {
  private enabled: boolean;
  private providers: AnalyticsProvider[] = [];
  private queue: AnalyticsEvent[] = [];
  private userId: string | null = null;

  constructor() {
    this.enabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";
  }

  private shouldTrack(): boolean {
    return this.enabled && typeof window !== "undefined";
  }

  registerProvider(provider: AnalyticsProvider): void {
    this.providers.push(provider);
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    this.userId = userId;
    if (!this.shouldTrack()) return;

    this.providers.forEach((p) => {
      try {
        p.identify(userId, traits);
      } catch {
        // provider error, silently fail
      }
    });
  }

  track(event: AnalyticsEvent): void {
    if (!this.shouldTrack()) return;

    const enriched: AnalyticsEvent = {
      ...event,
      timestamp: event.timestamp ?? new Date().toISOString(),
      properties: {
        ...event.properties,
        ...(this.userId ? { userId: this.userId } : {}),
      },
    };

    this.providers.forEach((p) => {
      try {
        p.track(enriched);
      } catch {
        // provider error, silently fail
      }
    });
  }

  pageView(path: string, title?: string): void {
    if (!this.shouldTrack()) return;

    this.providers.forEach((p) => {
      try {
        p.pageView(path, title);
      } catch {
        // provider error, silently fail
      }
    });

    this.track({
      name: "page_view",
      properties: { path, title },
    });
  }

  trackMatchView(matchId: string, homeTeam: string, awayTeam: string): void {
    this.track({
      name: "match_view",
      properties: { matchId, homeTeam, awayTeam },
    });
  }

  trackTeamView(teamId: string, teamName: string): void {
    this.track({
      name: "team_view",
      properties: { teamId, teamName },
    });
  }

  trackPlayerView(playerId: string, playerName: string): void {
    this.track({
      name: "player_view",
      properties: { playerId, playerName },
    });
  }

  trackSearch(query: string, resultCount: number): void {
    this.track({
      name: "search",
      properties: { query, resultCount },
    });
  }

  trackFavorite(entityType: string, entityId: string, action: "add" | "remove"): void {
    this.track({
      name: action === "add" ? "favorite_add" : "favorite_remove",
      properties: { entityType, entityId },
    });
  }

  trackShare(contentType: string, contentId: string): void {
    this.track({
      name: "share",
      properties: { contentType, contentId },
    });
  }

  trackNotificationClick(notificationId: string, type: string): void {
    this.track({
      name: "notification_click",
      properties: { notificationId, type },
    });
  }

  trackNavigationClick(target: string): void {
    this.track({
      name: "navigation_click",
      properties: { target },
    });
  }
}

export const analytics = new Analytics();
export default analytics;
