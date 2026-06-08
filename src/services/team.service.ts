import { BaseService, NotFoundServiceError } from "./base.service";
import teamRepository from "@/repositories/team.repository";
import cacheService from "./cache.service";
import type { ServiceResult } from "@/types";
import { successResult } from "@/types";

export class TeamService extends BaseService {
  constructor() {
    super("TeamService");
  }

  async findBySlug(slug: string): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("team", slug);

      return cacheService.getOrSet(
        cacheKey,
        () => teamRepository.findBySlug(slug),
        300,
      );
    });
  }

  async getSquad(teamId: string): Promise<ServiceResult<unknown[]>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("team", teamId, "squad");

      return cacheService.getOrSet(
        cacheKey,
        () => teamRepository.getSquad(teamId),
        120,
      );
    });
  }

  async getRecentMatches(
    teamId: string,
    limit?: number,
  ): Promise<ServiceResult<unknown[]>> {
    return this.wrapResult(async () => {
      return teamRepository.getRecentMatches(teamId, limit);
    });
  }

  async getUpcomingMatches(
    teamId: string,
    limit?: number,
  ): Promise<ServiceResult<unknown[]>> {
    return this.wrapResult(async () => {
      return teamRepository.getUpcomingMatches(teamId, limit);
    });
  }

  async getTeamStats(teamId: string): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("team", teamId, "stats");

      return cacheService.getOrSet(
        cacheKey,
        () => teamRepository.getTeamStats(teamId),
        60,
      );
    });
  }

  async getTopScorers(
    teamId: string,
    limit?: number,
  ): Promise<ServiceResult<unknown[]>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("team", teamId, "topscorers");

      return cacheService.getOrSet(
        cacheKey,
        () => teamRepository.getTopScorers(teamId, limit),
        120,
      );
    });
  }

  async getLeaguePosition(teamId: string): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("team", teamId, "position");

      return cacheService.getOrSet(
        cacheKey,
        () => teamRepository.getLeaguePosition(teamId),
        60,
      );
    });
  }
}

export const teamService = new TeamService();
export default teamService;
