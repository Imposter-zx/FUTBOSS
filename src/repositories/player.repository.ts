import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { BaseRepository, NotFoundError, RepositoryError } from "./base.repository";
import type { PaginationParams, PaginatedResult } from "@/types";
import { buildPaginationQuery, buildPaginatedResult } from "@/types";

type PlayerCreate = Parameters<typeof prisma.player.create>[0]["data"];
type PlayerUpdate = Parameters<typeof prisma.player.update>[0]["data"];

export class PlayerRepository extends BaseRepository<
  typeof prisma.player,
  PlayerCreate,
  PlayerUpdate
> {
  constructor() {
    super("Player", prisma.player as never);
  }

  async findBySlug(slug: string): Promise<typeof prisma.player> {
    try {
      const player = await prisma.player.findUnique({
        where: { slug },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
              shortName: true,
              logo: true,
            },
          },
          _count: {
            select: { matchEvents: true },
          },
        },
      });

      if (!player) {
        throw new NotFoundError("Player", slug);
      }

      return player as unknown as typeof prisma.player;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error("PlayerRepository.findBySlug failed", { slug, error });
      throw new RepositoryError("Failed to find player by slug", "FIND_BY_SLUG_FAILED", error);
    }
  }

  async search(
    query: string,
    params?: PaginationParams,
    filters?: {
      position?: string;
      nationality?: string;
      teamId?: string;
    },
  ): Promise<PaginatedResult<unknown>> {
    try {
      const { skip, take, orderBy } = buildPaginationQuery(params ?? {});
      const where: Record<string, unknown> = {};

      if (query) {
        where.OR = [
          { name: { contains: query, mode: "insensitive" } },
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
        ];
      }

      if (filters?.position) {
        where.position = filters.position;
      }

      if (filters?.nationality) {
        where.nationality = filters.nationality;
      }

      if (filters?.teamId) {
        where.teamId = filters.teamId;
      }

      const [data, total] = await Promise.all([
        prisma.player.findMany({
          skip,
          take,
          where,
          orderBy: (Array.isArray(orderBy) ? orderBy[0] : orderBy) as Record<string, "asc" | "desc"> | undefined,
          include: {
            team: {
              select: { id: true, name: true, slug: true, shortName: true, logo: true },
            },
          },
        }),
        prisma.player.count({ where }),
      ]);

      return buildPaginatedResult(data, total, params ?? {}) as PaginatedResult<unknown>;
    } catch (error) {
      logger.error("PlayerRepository.search failed", { query, error });
      throw new RepositoryError("Failed to search players", "SEARCH_FAILED", error);
    }
  }

  async getPerformanceMetrics(playerId: string): Promise<{
    totalMatches: number;
    totalGoals: number;
    totalAssists: number;
    totalMinutes: number;
    yellowCards: number;
    redCards: number;
    goalsPerMatch: number;
    assistsPerMatch: number;
    motmAwards: number;
    averageRating: number;
  }> {
    try {
      const [events, matchesPlayed] = await Promise.all([
        prisma.matchEvent.findMany({
          where: { playerId },
          select: { type: true },
        }),
        prisma.matchEvent.groupBy({
          by: ["matchId"],
          where: { playerId },
          _count: { matchId: true },
        }),
      ]);

      const goals = events.filter((e) => e.type === "GOAL").length;
      const assists = events.filter((e) => e.type === "ASSIST").length;
      const yellowCards = events.filter((e) => e.type === "YELLOW_CARD").length;
      const redCards = events.filter((e) => e.type === "RED_CARD").length;
      const totalMatches = matchesPlayed.length;

      return {
        totalMatches,
        totalGoals: goals,
        totalAssists: assists,
        totalMinutes: totalMatches * 90,
        yellowCards,
        redCards,
        goalsPerMatch: totalMatches > 0 ? Number((goals / totalMatches).toFixed(2)) : 0,
        assistsPerMatch: totalMatches > 0 ? Number((assists / totalMatches).toFixed(2)) : 0,
        motmAwards: 0,
        averageRating: 0,
      };
    } catch (error) {
      logger.error("PlayerRepository.getPerformanceMetrics failed", { playerId, error });
      throw new RepositoryError("Failed to get performance metrics", "GET_PERFORMANCE_METRICS_FAILED", error);
    }
  }

  async getMatchHistory(
    playerId: string,
    limit: number = 20,
  ): Promise<unknown[]> {
    try {
      const matchEvents = await prisma.matchEvent.findMany({
        where: { playerId },
        select: { matchId: true },
        distinct: ["matchId"],
        take: limit,
        orderBy: { minute: "desc" },
      });

      const matchIds = matchEvents.map((me) => me.matchId);

      const matches = await prisma.match.findMany({
        where: { id: { in: matchIds } },
        orderBy: { date: "desc" },
        include: {
          competition: {
            select: { id: true, name: true, slug: true, logo: true },
          },
          homeTeam: {
            select: { id: true, name: true, slug: true, logo: true, shortName: true },
          },
          awayTeam: {
            select: { id: true, name: true, slug: true, logo: true, shortName: true },
          },
          events: {
            where: { playerId },
            select: { id: true, type: true, minute: true },
          },
        },
      });

      return matches;
    } catch (error) {
      logger.error("PlayerRepository.getMatchHistory failed", { playerId, error });
      throw new RepositoryError("Failed to get match history", "GET_MATCH_HISTORY_FAILED", error);
    }
  }

  async getPlayerRatings(playerId: string): Promise<{
    average: number;
    recent: number[];
    trend: "up" | "down" | "stable";
  }> {
    try {
      const recentEvents = await prisma.matchEvent.findMany({
        where: { playerId },
        orderBy: { minute: "desc" },
        take: 10,
        select: { type: true, minute: true },
      });

      const goalScore = recentEvents.filter((e) => e.type === "GOAL").length * 2;
      const assistScore = recentEvents.filter((e) => e.type === "ASSIST").length * 1.5;
      const cardPenalty =
        recentEvents.filter((e) => e.type === "YELLOW_CARD").length * 0.5 +
        recentEvents.filter((e) => e.type === "RED_CARD").length * 2;

      const baseRating = 6.5;
      const average = Math.min(10, Math.max(1, baseRating + goalScore + assistScore - cardPenalty));

      return {
        average: Number(average.toFixed(1)),
        recent: [average],
        trend: average > 6.5 ? "up" : average < 6.5 ? "down" : "stable",
      };
    } catch (error) {
      logger.error("PlayerRepository.getPlayerRatings failed", { playerId, error });
      throw new RepositoryError("Failed to get player ratings", "GET_PLAYER_RATINGS_FAILED", error);
    }
  }
}

export const playerRepository = new PlayerRepository();
export default playerRepository;
