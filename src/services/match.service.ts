import { BaseService, NotFoundServiceError } from "./base.service";
import matchRepository from "@/repositories/match.repository";
import competitionRepository from "@/repositories/competition.repository";
import cacheService from "./cache.service";
import webSocketService from "./websocket.service";
import type { PaginationParams, PaginatedResult, LiveMatchUpdate, ServiceResult } from "@/types";

export class MatchService extends BaseService {
  constructor() {
    super("MatchService");
  }

  async findById(id: string): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("match", id);

      return cacheService.getOrSet(
        cacheKey,
        () => matchRepository.findById(id),
        30,
      );
    });
  }

  async getLiveMatches(): Promise<ServiceResult<unknown[]>> {
    return this.wrapResult(async () => {
      const cacheKey = "matches:live";

      return cacheService.getOrSet(
        cacheKey,
        () => matchRepository.getLiveMatches(),
        10,
      );
    });
  }

  async getUpcomingMatches(
    params?: PaginationParams,
    competitionId?: string,
  ): Promise<ServiceResult<PaginatedResult<unknown>>> {
    return this.wrapResult(async () => {
      return matchRepository.getUpcomingMatches(params, competitionId);
    });
  }

  async getFinishedMatches(
    params?: PaginationParams,
    competitionId?: string,
  ): Promise<ServiceResult<PaginatedResult<unknown>>> {
    return this.wrapResult(async () => {
      return matchRepository.getFinishedMatches(params, competitionId);
    });
  }

  async getMatchTimeline(matchId: string): Promise<ServiceResult<unknown[]>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("match", matchId, "timeline");

      return cacheService.getOrSet(
        cacheKey,
        () => matchRepository.getMatchTimeline(matchId),
        30,
      );
    });
  }

  async getTeamStats(matchId: string): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      return matchRepository.getTeamStats(matchId);
    });
  }

  async getHeadToHead(
    team1Id: string,
    team2Id: string,
    limit?: number,
  ): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey(
        "h2h",
        team1Id,
        team2Id,
      );

      return cacheService.getOrSet(
        cacheKey,
        () => matchRepository.getHeadToHead(team1Id, team2Id, limit),
        300,
      );
    });
  }

  async getMatchesByDate(
    date: Date,
    params?: PaginationParams,
  ): Promise<ServiceResult<PaginatedResult<unknown>>> {
    return this.wrapResult(async () => {
      return matchRepository.getMatchesByDate(date, params);
    });
  }

  async getMatchesByCompetition(
    competitionId: string,
    params?: PaginationParams,
  ): Promise<ServiceResult<PaginatedResult<unknown>>> {
    return this.wrapResult(async () => {
      return matchRepository.getMatchesByCompetition(competitionId, params);
    });
  }

  async processLiveMatchUpdate(update: LiveMatchUpdate): Promise<ServiceResult<void>> {
    return this.wrapResult(async () => {
      const { matchId, homeScore, awayScore, minute, addedTime, status, event } = update;

      const match = await matchRepository.findById(matchId).catch(() => null);
      if (!match) {
        throw new NotFoundServiceError("Match", matchId);
      }

      const updateData: Record<string, unknown> = {};
      if (homeScore !== undefined) updateData.homeScore = homeScore;
      if (awayScore !== undefined) updateData.awayScore = awayScore;
      if (minute !== undefined) updateData.minute = minute;
      if (status !== undefined) updateData.status = status;

      if (Object.keys(updateData).length > 0) {
        await matchRepository.update(matchId, updateData as never);
      }

      if (event) {
        const prisma = (await import("@/lib/prisma")).default;
        await prisma.matchEvent.create({
          data: {
            matchId,
            type: event.type as never,
            playerId: event.playerId,
            teamId: event.teamId,
            minute: event.minute,
          },
        });
      }

      await cacheService.invalidateMatch(matchId);

      webSocketService.broadcast(
        `match:${matchId}`,
        "match_update",
        update as unknown as Record<string, unknown>,
      );

      if (event?.type === "GOAL") {
        webSocketService.broadcast("live_goals", "goal", {
          matchId,
          ...event,
        });
      }

      this.logInfo("Live match update processed", { matchId, status });
    });
  }

  async getMatchEventStats(matchId: string): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("match", matchId, "eventstats");

      return cacheService.getOrSet(
        cacheKey,
        async () => {
          const timeline = await matchRepository.getMatchTimeline(matchId);
          const stats = {
            totalEvents: 0,
            byType: {} as Record<string, number>,
            byMinute: {
              "0-15": 0,
              "16-30": 0,
              "31-45": 0,
              "46-60": 0,
              "61-75": 0,
              "76-90": 0,
              "90+": 0,
            },
          };

          for (const event of timeline as Array<{ type: string; minute: number }>) {
            stats.totalEvents++;
            stats.byType[event.type] = (stats.byType[event.type] ?? 0) + 1;

            if (event.minute <= 15) stats.byMinute["0-15"]++;
            else if (event.minute <= 30) stats.byMinute["16-30"]++;
            else if (event.minute <= 45) stats.byMinute["31-45"]++;
            else if (event.minute <= 60) stats.byMinute["46-60"]++;
            else if (event.minute <= 75) stats.byMinute["61-75"]++;
            else if (event.minute <= 90) stats.byMinute["76-90"]++;
            else stats.byMinute["90+"]++;
          }

          return stats;
        },
        60,
      );
    });
  }
}

export const matchService = new MatchService();
export default matchService;
