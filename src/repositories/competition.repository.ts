import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { BaseRepository, NotFoundError, RepositoryError } from "./base.repository";
import { buildPaginationQuery, buildPaginatedResult, type PaginationParams, type PaginatedResult } from "@/types";

type CompetitionCreate = Parameters<typeof prisma.competition.create>[0]["data"];
type CompetitionUpdate = Parameters<typeof prisma.competition.update>[0]["data"];

export class CompetitionRepository extends BaseRepository<
  typeof prisma.competition,
  CompetitionCreate,
  CompetitionUpdate
> {
  constructor() {
    super("Competition", prisma.competition as never);
  }

  async findBySlug(slug: string): Promise<typeof prisma.competition> {
    try {
      const competition = await prisma.competition.findUnique({
        where: { slug },
        include: {
          _count: { select: { matches: true, standings: true } },
        },
      });

      if (!competition) {
        throw new NotFoundError("Competition", slug);
      }

      return competition as unknown as typeof prisma.competition;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error("CompetitionRepository.findBySlug failed", { slug, error });
      throw new RepositoryError("Failed to find competition by slug", "FIND_BY_SLUG_FAILED", error);
    }
  }

  async findActive(season?: string): Promise<typeof prisma.competition[]> {
    try {
      const competitions = await prisma.competition.findMany({
        where: {
          isActive: true,
          ...(season ? { season } : {}),
        },
        include: {
          _count: { select: { matches: true, standings: true } },
        },
      });

      return competitions as unknown as typeof prisma.competition[];
    } catch (error) {
      logger.error("CompetitionRepository.findActive failed", { error });
      throw new RepositoryError("Failed to find active competitions", "FIND_ACTIVE_FAILED", error);
    }
  }

  async getStandings(
    competitionId: string,
  ): Promise<{
    id: string;
    position: number;
    playedGames: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    form: unknown;
    team: { id: string; name: string; slug: string; logo: string | null };
  }[]> {
    try {
      const standings = await prisma.standing.findMany({
        where: { competitionId },
        orderBy: { position: "asc" },
        include: {
          team: {
            select: { id: true, name: true, slug: true, logo: true },
          },
        },
      });

      return standings;
    } catch (error) {
      logger.error("CompetitionRepository.getStandings failed", { competitionId, error });
      throw new RepositoryError("Failed to get standings", "GET_STANDINGS_FAILED", error);
    }
  }

  async getTopScorers(
    competitionId: string,
    limit: number = 20,
  ): Promise<{
    playerId: string;
    playerName: string;
    teamName: string;
    goals: number;
    assists: number;
    appearances: number;
  }[]> {
    try {
      const matches = await prisma.match.findMany({
        where: { competitionId, status: "FINISHED" },
        select: { id: true },
      });

      const matchIds = matches.map((m) => m.id);

      type GroupByCount = { id: number };

      const goalEvents = await prisma.matchEvent.groupBy({
        by: ["playerId"],
        where: {
          matchId: { in: matchIds },
          type: "GOAL",
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: limit,
      });

      const assistEvents = await prisma.matchEvent.groupBy({
        by: ["playerId"],
        where: {
          matchId: { in: matchIds },
          type: "ASSIST",
        },
        _count: { id: true },
      });

      const assistMap = new Map(
        assistEvents.map((a) => [a.playerId, (a._count as GroupByCount).id]),
      );

      const players = await prisma.player.findMany({
        where: {
          id: { in: goalEvents.map((g) => g.playerId) },
        },
        select: {
          id: true,
          name: true,
          team: { select: { name: true } },
        },
      });

      const playerMap = new Map(players.map((p) => [p.id, p]));

      return goalEvents.map((g) => {
        const player = playerMap.get(g.playerId);
        return {
          playerId: g.playerId,
          playerName: player?.name ?? "Unknown",
          teamName: player?.team?.name ?? "Unknown",
          goals: (g._count as GroupByCount).id,
          assists: assistMap.get(g.playerId) ?? 0,
          appearances: 0,
        };
      });
    } catch (error) {
      logger.error("CompetitionRepository.getTopScorers failed", { competitionId, error });
      throw new RepositoryError("Failed to get top scorers", "GET_TOP_SCORERS_FAILED", error);
    }
  }

  async getFixtures(
    competitionId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResult<unknown>> {
    try {
      const query = buildPaginationQuery(params ?? {});
      const now = new Date();

      const [data, total] = await Promise.all([
        prisma.match.findMany({
          skip: query.skip,
          take: query.take,
          where: {
            competitionId,
            date: { gte: now },
            status: { in: ["SCHEDULED", "LIVE"] },
          },
          orderBy: { date: "asc" },
          include: {
            homeTeam: {
              select: { id: true, name: true, slug: true, logo: true, shortName: true },
            },
            awayTeam: {
              select: { id: true, name: true, slug: true, logo: true, shortName: true },
            },
            competition: {
              select: { id: true, name: true, slug: true, logo: true },
            },
          },
        }),
        prisma.match.count({
          where: {
            competitionId,
            date: { gte: now },
            status: { in: ["SCHEDULED", "LIVE"] },
          },
        }),
      ]);

      return buildPaginatedResult(data, total, params ?? {});
    } catch (error) {
      logger.error("CompetitionRepository.getFixtures failed", { competitionId, error });
      throw new RepositoryError("Failed to get fixtures", "GET_FIXTURES_FAILED", error);
    }
  }

  async getResults(
    competitionId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResult<unknown>> {
    try {
      const query = buildPaginationQuery(params ?? {});

      const [data, total] = await Promise.all([
        prisma.match.findMany({
          skip: query.skip,
          take: query.take,
          where: {
            competitionId,
            status: "FINISHED",
          },
          orderBy: { date: "desc" },
          include: {
            homeTeam: {
              select: { id: true, name: true, slug: true, logo: true, shortName: true },
            },
            awayTeam: {
              select: { id: true, name: true, slug: true, logo: true, shortName: true },
            },
            competition: {
              select: { id: true, name: true, slug: true, logo: true },
            },
          },
        }),
        prisma.match.count({
          where: {
            competitionId,
            status: "FINISHED",
          },
        }),
      ]);

      return buildPaginatedResult(data, total, params ?? {});
    } catch (error) {
      logger.error("CompetitionRepository.getResults failed", { competitionId, error });
      throw new RepositoryError("Failed to get results", "GET_RESULTS_FAILED", error);
    }
  }

  async getCompetitionStats(competitionId: string): Promise<{
    totalMatches: number;
    totalGoals: number;
    averageGoals: number;
    totalTeams: number;
    finishedMatches: number;
    totalYellowCards: number;
    totalRedCards: number;
  }> {
    try {
      const [matches, teams, cards] = await Promise.all([
        prisma.match.findMany({
          where: { competitionId },
          select: { homeScore: true, awayScore: true, status: true },
        }),
        prisma.standing.count({
          where: { competitionId },
        }),
        prisma.matchEvent.findMany({
          where: {
            match: { competitionId },
            type: { in: ["YELLOW_CARD", "RED_CARD"] },
          },
          select: { type: true },
        }),
      ]);

      const finishedMatches = matches.filter((m) => m.status === "FINISHED");
      const totalGoals = finishedMatches.reduce(
        (sum, m) => sum + (m.homeScore ?? 0) + (m.awayScore ?? 0),
        0,
      );

      return {
        totalMatches: matches.length,
        totalGoals,
        averageGoals: finishedMatches.length > 0
          ? Number((totalGoals / finishedMatches.length).toFixed(2))
          : 0,
        totalTeams: teams,
        finishedMatches: finishedMatches.length,
        totalYellowCards: cards.filter((c) => c.type === "YELLOW_CARD").length,
        totalRedCards: cards.filter((c) => c.type === "RED_CARD").length,
      };
    } catch (error) {
      logger.error("CompetitionRepository.getCompetitionStats failed", { competitionId, error });
      throw new RepositoryError("Failed to get competition stats", "GET_STATS_FAILED", error);
    }
  }

  async getMatchHistory(
    competitionId: string,
    teamId: string,
    limit: number = 10,
  ): Promise<unknown[]> {
    try {
      const matches = await prisma.match.findMany({
        where: {
          competitionId,
          OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
          status: "FINISHED",
        },
        orderBy: { date: "desc" },
        take: limit,
        include: {
          homeTeam: {
            select: { id: true, name: true, slug: true, logo: true, shortName: true },
          },
          awayTeam: {
            select: { id: true, name: true, slug: true, logo: true, shortName: true },
          },
          competition: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      return matches;
    } catch (error) {
      logger.error("CompetitionRepository.getMatchHistory failed", { competitionId, teamId, error });
      throw new RepositoryError("Failed to get match history", "GET_MATCH_HISTORY_FAILED", error);
    }
  }

  async getTeams(competitionId: string): Promise<unknown[]> {
    try {
      const standings = await prisma.standing.findMany({
        where: { competitionId },
        orderBy: { position: "asc" },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
              shortName: true,
              logo: true,
              venue: true,
              country: true,
            },
          },
        },
      });

      return standings.map((s) => ({
        ...s.team,
        standing: {
          position: s.position,
          points: s.points,
          playedGames: s.playedGames,
          won: s.won,
          drawn: s.drawn,
          lost: s.lost,
          goalsFor: s.goalsFor,
          goalsAgainst: s.goalsAgainst,
          goalDifference: s.goalDifference,
          form: s.form,
        },
      }));
    } catch (error) {
      logger.error("CompetitionRepository.getTeams failed", { competitionId, error });
      throw new RepositoryError("Failed to get teams", "GET_TEAMS_FAILED", error);
    }
  }
}

export const competitionRepository = new CompetitionRepository();
export default competitionRepository;
