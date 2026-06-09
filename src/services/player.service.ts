import { BaseService } from "./base.service";
import playerRepository from "@/repositories/player.repository";
import cacheService from "./cache.service";
import { successResult, type PaginationParams, type PaginatedResult, type ServiceResult } from "@/types";

export class PlayerService extends BaseService {
  constructor() {
    super("PlayerService");
  }

  async findBySlug(slug: string): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("player", slug);

      return cacheService.getOrSet(
        cacheKey,
        () => playerRepository.findBySlug(slug),
        300,
      );
    });
  }

  async search(
    query: string,
    params?: PaginationParams,
    filters?: {
      position?: string;
      nationality?: string;
      teamId?: string;
    },
  ): Promise<ServiceResult<PaginatedResult<unknown>>> {
    return this.wrapResult(async () => {
      return playerRepository.search(query, params, filters);
    });
  }

  async getPerformanceMetrics(playerId: string): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("player", playerId, "metrics");

      return cacheService.getOrSet(
        cacheKey,
        () => playerRepository.getPerformanceMetrics(playerId),
        120,
      );
    });
  }

  async getMatchHistory(
    playerId: string,
    limit?: number,
  ): Promise<ServiceResult<unknown[]>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("player", playerId, "matches");

      return cacheService.getOrSet(
        cacheKey,
        () => playerRepository.getMatchHistory(playerId, limit),
        120,
      );
    });
  }

  async getPlayerRatings(playerId: string): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("player", playerId, "ratings");

      return cacheService.getOrSet(
        cacheKey,
        () => playerRepository.getPlayerRatings(playerId),
        60,
      );
    });
  }
}

export const playerService = new PlayerService();
export default playerService;
