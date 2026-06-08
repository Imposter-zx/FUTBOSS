import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { BaseRepository, NotFoundError, RepositoryError } from "./base.repository";
import type { PaginationParams, PaginatedResult } from "@/types";
import { buildPaginationQuery, buildPaginatedResult } from "@/types";
import type { Match } from "@prisma/client";

type MatchCreate = Parameters<typeof prisma.match.create>[0]["data"];
type MatchUpdate = Parameters<typeof prisma.match.update>[0]["data"];

const matchInclude = {
  competition: {
    select: { id: true, name: true, slug: true, logo: true },
  },
  homeTeam: {
    select: { id: true, name: true, slug: true, logo: true, shortName: true },
  },
  awayTeam: {
    select: { id: true, name: true, slug: true, logo: true, shortName: true },
  },
} as const;

export class MatchRepository extends BaseRepository<
  typeof prisma.match,
  MatchCreate,
  MatchUpdate
> {
  constructor() {
    super("Match", prisma.match as never);
  }

  async findById(id: string): Promise<any> {
    try {
      const match = await prisma.match.findUnique({
        where: { id },
        include: {
          ...matchInclude,
          events: {
            orderBy: { minute: "asc" as const },
            include: {
              player: {
                select: { id: true, name: true, slug: true, photo: true, position: true },
              },
              team: {
                select: { id: true, name: true, slug: true, logo: true, shortName: true },
              },
            },
          },
        },
      });

      if (!match) {
        throw new NotFoundError("Match", id);
      }

      return match;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error("MatchRepository.findById failed", { id, error });
      throw new RepositoryError("Failed to find match by id", "FIND_BY_ID_FAILED", error);
    }
  }

  async getLiveMatches(): Promise<Match[]> {
    try {
      const matches = await prisma.match.findMany({
        where: { status: "LIVE" },
        orderBy: { date: "desc" },
        include: matchInclude,
      });

      return matches as unknown as Match[];
    } catch (error) {
      logger.error("MatchRepository.getLiveMatches failed", { error });
      throw new RepositoryError("Failed to get live matches", "GET_LIVE_MATCHES_FAILED", error);
    }
  }

  async getUpcomingMatches(
    params?: PaginationParams,
    competitionId?: string,
  ): Promise<PaginatedResult<Match>> {
    try {
      const query = buildPaginationQuery(params ?? {});
      const now = new Date();
      const where: Record<string, unknown> = {
        date: { gte: now },
        status: { in: ["SCHEDULED"] },
      };

      if (competitionId) {
        where.competitionId = competitionId;
      }

      const [data, total] = await Promise.all([
        prisma.match.findMany({
          skip: query.skip,
          take: query.take,
          where,
          orderBy: { date: "asc" },
          include: matchInclude,
        }),
        prisma.match.count({ where }),
      ]);

      return buildPaginatedResult(data as Match[], total, params ?? {});
    } catch (error) {
      logger.error("MatchRepository.getUpcomingMatches failed", { error });
      throw new RepositoryError("Failed to get upcoming matches", "GET_UPCOMING_FAILED", error);
    }
  }

  async getFinishedMatches(
    params?: PaginationParams,
    competitionId?: string,
  ): Promise<PaginatedResult<Match>> {
    try {
      const query = buildPaginationQuery(params ?? {});
      const where: Record<string, unknown> = { status: "FINISHED" };

      if (competitionId) {
        where.competitionId = competitionId;
      }

      const [data, total] = await Promise.all([
        prisma.match.findMany({
          skip: query.skip,
          take: query.take,
          where,
          orderBy: { date: "desc" },
          include: matchInclude,
        }),
        prisma.match.count({ where }),
      ]);

      return buildPaginatedResult(data as Match[], total, params ?? {});
    } catch (error) {
      logger.error("MatchRepository.getFinishedMatches failed", { error });
      throw new RepositoryError("Failed to get finished matches", "GET_FINISHED_FAILED", error);
    }
  }

  async getMatchTimeline(matchId: string): Promise<unknown[]> {
    try {
      const events = await prisma.matchEvent.findMany({
        where: { matchId },
        orderBy: [{ minute: "asc" }, { addedTime: "asc" }],
        include: {
          player: {
            select: { id: true, name: true, slug: true, photo: true, position: true },
          },
          team: {
            select: { id: true, name: true, slug: true, logo: true, shortName: true },
          },
        },
      });

      return events;
    } catch (error) {
      logger.error("MatchRepository.getMatchTimeline failed", { matchId, error });
      throw new RepositoryError("Failed to get match timeline", "GET_TIMELINE_FAILED", error);
    }
  }

  async getTeamStats(matchId: string): Promise<{
    homeTeam: Record<string, unknown>;
    awayTeam: Record<string, unknown>;
  }> {
    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: { id: true, homeTeamId: true, awayTeamId: true },
      });

      if (!match) {
        throw new NotFoundError("Match", matchId);
      }

      const events = await prisma.matchEvent.findMany({
        where: { matchId },
        select: { teamId: true, type: true },
      });

      const homeEvents = events.filter((e) => e.teamId === match.homeTeamId);
      const awayEvents = events.filter((e) => e.teamId === match.awayTeamId);

      const calculateStats = (teamEvents: typeof events) => ({
        goals: teamEvents.filter((e) => e.type === "GOAL").length,
        yellowCards: teamEvents.filter((e) => e.type === "YELLOW_CARD").length,
        redCards: teamEvents.filter((e) => e.type === "RED_CARD").length,
        substitutions: teamEvents.filter((e) => e.type === "SUBSTITUTION").length,
      });

      return {
        homeTeam: calculateStats(homeEvents),
        awayTeam: calculateStats(awayEvents),
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error("MatchRepository.getTeamStats failed", { matchId, error });
      throw new RepositoryError("Failed to get match team stats", "GET_TEAM_STATS_FAILED", error);
    }
  }

  async getHeadToHead(
    team1Id: string,
    team2Id: string,
    limit: number = 10,
  ): Promise<{
    matches: unknown[];
    totalMatches: number;
    team1Wins: number;
    team2Wins: number;
    draws: number;
    team1Goals: number;
    team2Goals: number;
  }> {
    try {
      const matches = await prisma.match.findMany({
        where: {
          OR: [
            { homeTeamId: team1Id, awayTeamId: team2Id },
            { homeTeamId: team2Id, awayTeamId: team1Id },
          ],
          status: "FINISHED",
        },
        orderBy: { date: "desc" },
        take: limit,
        include: matchInclude,
      });

      let team1Wins = 0;
      let team2Wins = 0;
      let draws = 0;
      let team1Goals = 0;
      let team2Goals = 0;

      for (const match of matches) {
        const isTeam1Home = match.homeTeamId === team1Id;
        const t1Score = isTeam1Home ? match.homeScore : match.awayScore;
        const t2Score = isTeam1Home ? match.awayScore : match.homeScore;

        team1Goals += t1Score ?? 0;
        team2Goals += t2Score ?? 0;

        if ((t1Score ?? 0) > (t2Score ?? 0)) team1Wins++;
        else if ((t1Score ?? 0) < (t2Score ?? 0)) team2Wins++;
        else draws++;
      }

      return {
        matches,
        totalMatches: matches.length,
        team1Wins,
        team2Wins,
        draws,
        team1Goals,
        team2Goals,
      };
    } catch (error) {
      logger.error("MatchRepository.getHeadToHead failed", { team1Id, team2Id, error });
      throw new RepositoryError("Failed to get head to head", "GET_H2H_FAILED", error);
    }
  }

  async getMatchesByDate(
    date: Date,
    params?: PaginationParams,
  ): Promise<PaginatedResult<Match>> {
    try {
      const query = buildPaginationQuery(params ?? {});
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const where = {
        date: { gte: startOfDay, lte: endOfDay },
      };

      const [data, total] = await Promise.all([
        prisma.match.findMany({
          skip: query.skip,
          take: query.take,
          where,
          orderBy: { date: "asc" },
          include: matchInclude,
        }),
        prisma.match.count({ where }),
      ]);

      return buildPaginatedResult(data as Match[], total, params ?? {});
    } catch (error) {
      logger.error("MatchRepository.getMatchesByDate failed", { date, error });
      throw new RepositoryError("Failed to get matches by date", "GET_BY_DATE_FAILED", error);
    }
  }

  async getMatchesByCompetition(
    competitionId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResult<Match>> {
    try {
      const query = buildPaginationQuery(params ?? {});
      const where = { competitionId };

      const [data, total] = await Promise.all([
        prisma.match.findMany({
          skip: query.skip,
          take: query.take,
          where,
          orderBy: { date: "desc" },
          include: matchInclude,
        }),
        prisma.match.count({ where }),
      ]);

      return buildPaginatedResult(data as Match[], total, params ?? {});
    } catch (error) {
      logger.error("MatchRepository.getMatchesByCompetition failed", { competitionId, error });
      throw new RepositoryError("Failed to get matches by competition", "GET_BY_COMPETITION_FAILED", error);
    }
  }
}

export const matchRepository = new MatchRepository();
export default matchRepository;
