import { BaseService, NotFoundServiceError, ValidationServiceError } from "./base.service";
import competitionRepository from "@/repositories/competition.repository";
import standingRepository from "@/repositories/standing.repository";
import cacheService from "./cache.service";
import type { PaginationParams, PaginatedResult, ServiceResult } from "@/types";

type StandingUpdate = {
  teamId: string;
  position: number;
  playedGames: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: string[];
};

export class CompetitionService extends BaseService {
  constructor() {
    super("CompetitionService");
  }

  async findBySlug(slug: string): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("competition", slug);

      return cacheService.getOrSet(
        cacheKey,
        async () => {
          const competition = await competitionRepository.findBySlug(slug);
          return competition;
        },
        300,
      );
    });
  }

  async findActive(season?: string): Promise<ServiceResult<unknown[]>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("competitions", "active", season ?? "current");

      return cacheService.getOrSet(
        cacheKey,
        () => competitionRepository.findActive(season),
        120,
      );
    });
  }

  async getStandings(competitionId: string): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("competition", competitionId, "standings");

      return cacheService.getOrSet(
        cacheKey,
        () => competitionRepository.getStandings(competitionId),
        60,
      );
    });
  }

  async getTopScorers(
    competitionId: string,
    limit?: number,
  ): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey(
        "competition",
        competitionId,
        "topscorers",
        String(limit ?? 20),
      );

      return cacheService.getOrSet(
        cacheKey,
        () => competitionRepository.getTopScorers(competitionId, limit),
        120,
      );
    });
  }

  async getFixtures(
    competitionId: string,
    params?: PaginationParams,
  ): Promise<ServiceResult<PaginatedResult<unknown>>> {
    return this.wrapResult(async () => {
      return competitionRepository.getFixtures(competitionId, params);
    });
  }

  async getResults(
    competitionId: string,
    params?: PaginationParams,
  ): Promise<ServiceResult<PaginatedResult<unknown>>> {
    return this.wrapResult(async () => {
      return competitionRepository.getResults(competitionId, params);
    });
  }

  async getCompetitionStats(competitionId: string): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("competition", competitionId, "stats");

      return cacheService.getOrSet(
        cacheKey,
        () => competitionRepository.getCompetitionStats(competitionId),
        300,
      );
    });
  }

  async getMatchHistory(
    competitionId: string,
    teamId: string,
    limit?: number,
  ): Promise<ServiceResult<unknown[]>> {
    return this.wrapResult(async () => {
      return competitionRepository.getMatchHistory(competitionId, teamId, limit);
    });
  }

  async getTeams(competitionId: string): Promise<ServiceResult<unknown[]>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("competition", competitionId, "teams");

      return cacheService.getOrSet(
        cacheKey,
        () => competitionRepository.getTeams(competitionId),
        120,
      );
    });
  }

  async updateStandings(
    competitionId: string,
    standings: StandingUpdate[],
  ): Promise<ServiceResult<void>> {
    return this.wrapResult(async () => {
      if (!standings.length) {
        throw new ValidationServiceError("Standings data cannot be empty");
      }

      await standingRepository.updateStandings(competitionId, standings);
      await cacheService.invalidateCompetition(competitionId);

      this.logInfo("Standings updated", { competitionId, teams: standings.length });
    });
  }
}

export const competitionService = new CompetitionService();
export default competitionService;
