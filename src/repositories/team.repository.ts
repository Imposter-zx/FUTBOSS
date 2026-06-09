import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { BaseRepository, NotFoundError, RepositoryError } from "./base.repository";

type TeamCreate = Parameters<typeof prisma.team.create>[0]["data"];
type TeamUpdate = Parameters<typeof prisma.team.update>[0]["data"];

export class TeamRepository extends BaseRepository<
  typeof prisma.team,
  TeamCreate,
  TeamUpdate
> {
  constructor() {
    super("Team", prisma.team as never);
  }

  async findBySlug(slug: string): Promise<typeof prisma.team> {
    try {
      const team = await prisma.team.findUnique({
        where: { slug },
        include: {
          _count: {
            select: {
              players: true,
              homeMatches: true,
              awayMatches: true,
            },
          },
        },
      });

      if (!team) {
        throw new NotFoundError("Team", slug);
      }

      return team as unknown as typeof prisma.team;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error("TeamRepository.findBySlug failed", { slug, error });
      throw new RepositoryError("Failed to find team by slug", "FIND_BY_SLUG_FAILED", error);
    }
  }

  async getSquad(teamId: string): Promise<unknown[]> {
    try {
      const players = await prisma.player.findMany({
        where: { teamId },
        orderBy: [{ position: "asc" }, { shirtNumber: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          firstName: true,
          lastName: true,
          nationality: true,
          position: true,
          shirtNumber: true,
          height: true,
          weight: true,
          photo: true,
          marketValue: true,
          contractUntil: true,
        },
      });

      return players;
    } catch (error) {
      logger.error("TeamRepository.getSquad failed", { teamId, error });
      throw new RepositoryError("Failed to get squad", "GET_SQUAD_FAILED", error);
    }
  }

  async getRecentMatches(
    teamId: string,
    limit: number = 10,
  ): Promise<unknown[]> {
    try {
      const matches = await prisma.match.findMany({
        where: {
          OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
          status: "FINISHED",
        },
        orderBy: { date: "desc" },
        take: limit,
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
        },
      });

      return matches;
    } catch (error) {
      logger.error("TeamRepository.getRecentMatches failed", { teamId, error });
      throw new RepositoryError("Failed to get recent matches", "GET_RECENT_MATCHES_FAILED", error);
    }
  }

  async getUpcomingMatches(
    teamId: string,
    limit: number = 10,
  ): Promise<unknown[]> {
    try {
      const now = new Date();
      const matches = await prisma.match.findMany({
        where: {
          OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
          date: { gte: now },
          status: { in: ["SCHEDULED", "LIVE"] },
        },
        orderBy: { date: "asc" },
        take: limit,
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
        },
      });

      return matches;
    } catch (error) {
      logger.error("TeamRepository.getUpcomingMatches failed", { teamId, error });
      throw new RepositoryError("Failed to get upcoming matches", "GET_UPCOMING_MATCHES_FAILED", error);
    }
  }

  async getTeamStats(teamId: string): Promise<{
    totalMatches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    cleanSheets: number;
    averagePossession: number;
    currentForm: string;
    homeRecord: { wins: number; draws: number; losses: number };
    awayRecord: { wins: number; draws: number; losses: number };
  }> {
    try {
      const finishedMatches = await prisma.match.findMany({
        where: {
          OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
          status: "FINISHED",
        },
        select: {
          homeTeamId: true,
          awayTeamId: true,
          homeScore: true,
          awayScore: true,
        },
      });

      let wins = 0;
      let draws = 0;
      let losses = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;
      let cleanSheets = 0;
      let homeWins = 0;
      let homeDraws = 0;
      let homeLosses = 0;
      let awayWins = 0;
      let awayDraws = 0;
      let awayLosses = 0;

      for (const match of finishedMatches) {
        const isHome = match.homeTeamId === teamId;
        const teamScore = isHome ? match.homeScore : match.awayScore;
        const opponentScore = isHome ? match.awayScore : match.homeScore;

        goalsFor += teamScore ?? 0;
        goalsAgainst += opponentScore ?? 0;

        if (opponentScore === 0) cleanSheets++;

        if ((teamScore ?? 0) > (opponentScore ?? 0)) {
          wins++;
          if (isHome) homeWins++;
          else awayWins++;
        } else if (teamScore === opponentScore) {
          draws++;
          if (isHome) homeDraws++;
          else awayDraws++;
        } else {
          losses++;
          if (isHome) homeLosses++;
          else awayLosses++;
        }
      }

      const recentMatches = finishedMatches.slice(-5);
      const form = recentMatches
        .map((m) => {
          const isHome = m.homeTeamId === teamId;
          const teamScore = isHome ? m.homeScore : m.awayScore;
          const opponentScore = isHome ? m.awayScore : m.homeScore;
          if ((teamScore ?? 0) > (opponentScore ?? 0)) return "W";
          if (teamScore === opponentScore) return "D";
          return "L";
        })
        .join("");

      return {
        totalMatches: finishedMatches.length,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        cleanSheets,
        averagePossession: 50,
        currentForm: form || "",
        homeRecord: { wins: homeWins, draws: homeDraws, losses: homeLosses },
        awayRecord: { wins: awayWins, draws: awayDraws, losses: awayLosses },
      };
    } catch (error) {
      logger.error("TeamRepository.getTeamStats failed", { teamId, error });
      throw new RepositoryError("Failed to get team stats", "GET_TEAM_STATS_FAILED", error);
    }
  }

  async getTopScorers(
    teamId: string,
    limit: number = 10,
  ): Promise<{
    playerId: string;
    playerName: string;
    goals: number;
    assists: number;
    appearances: number;
  }[]> {
    try {
      const finishedMatches = await prisma.match.findMany({
        where: {
          OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
          status: "FINISHED",
        },
        select: { id: true },
      });

      const matchIds = finishedMatches.map((m) => m.id);

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

      const playerIds = goalEvents
        .map((g) => g.playerId)
        .filter(Boolean) as string[];

      const players = await prisma.player.findMany({
        where: { id: { in: playerIds } },
        select: { id: true, name: true },
      });

      const playerMap = new Map(players.map((p) => [p.id, p]));

      return goalEvents.map((g) => ({
        playerId: g.playerId ?? "",
        playerName: playerMap.get(g.playerId ?? "")?.name ?? "Unknown",
        goals: g._count!.id,
        assists: 0,
        appearances: 0,
      }));
    } catch (error) {
      logger.error("TeamRepository.getTopScorers failed", { teamId, error });
      throw new RepositoryError("Failed to get top scorers", "GET_TOP_SCORERS_FAILED", error);
    }
  }

  async getLeaguePosition(teamId: string): Promise<{
    competitionId: string;
    competitionName: string;
    position: number;
    totalTeams: number;
    points: number;
  } | null> {
    try {
      const standing = await prisma.standing.findFirst({
        where: { teamId },
        include: {
          competition: { select: { id: true, name: true } },
        },
      });

      if (!standing) { return null; }

      const totalTeams = await prisma.standing.count({
        where: { competitionId: standing.competitionId },
      });

      return {
        competitionId: standing.competitionId,
        competitionName: standing.competition.name,
        position: standing.position,
        totalTeams,
        points: standing.points,
      };
    } catch (error) {
      logger.error("TeamRepository.getLeaguePosition failed", { teamId, error });
      throw new RepositoryError("Failed to get league position", "GET_LEAGUE_POSITION_FAILED", error);
    }
  }
}

export const teamRepository = new TeamRepository();
export default teamRepository;
