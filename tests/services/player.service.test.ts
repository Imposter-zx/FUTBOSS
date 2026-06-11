import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlayerService } from "@/services/player.service";

const mockPlayer = {
  id: "player-1",
  name: "Lionel Messi",
  slug: "lionel-messi",
  position: "FW",
  nationality: "Argentina",
  shirtNumber: 10,
  teamId: "team-1",
  team: { id: "team-1", name: "FC Barcelona", slug: "fc-barcelona", shortName: "BAR", logo: null },
};

vi.mock("@/repositories/player.repository", () => ({
  default: {
    findBySlug: vi.fn(),
    search: vi.fn(),
    getPerformanceMetrics: vi.fn(),
    getMatchHistory: vi.fn(),
    getPlayerRatings: vi.fn(),
  },
}));

import playerRepository from "@/repositories/player.repository";

describe("PlayerService", () => {
  let service: PlayerService;

  beforeEach(() => {
    service = new PlayerService();
    vi.clearAllMocks();
  });

  describe("findBySlug", () => {
    it("returns player data for a valid slug", async () => {
      vi.mocked(playerRepository.findBySlug).mockResolvedValue(mockPlayer);

      const result = await service.findBySlug("lionel-messi");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockPlayer);
      }
      expect(playerRepository.findBySlug).toHaveBeenCalledWith("lionel-messi");
    });

    it("returns error result when repository throws", async () => {
      vi.mocked(playerRepository.findBySlug).mockRejectedValue(new Error("Player not found"));

      const result = await service.findBySlug("unknown-player");

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe("search", () => {
    it("returns paginated results", async () => {
      const paginatedResult = {
        data: [mockPlayer],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      };
      vi.mocked(playerRepository.search).mockResolvedValue(paginatedResult);

      const result = await service.search("messi", { page: 1, pageSize: 20 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(paginatedResult);
      }
      expect(playerRepository.search).toHaveBeenCalledWith("messi", { page: 1, pageSize: 20 }, undefined);
    });

    it("passes filters to repository", async () => {
      vi.mocked(playerRepository.search).mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 });

      const filters = { position: "FW", nationality: "Argentina" };
      await service.search("messi", { page: 1, pageSize: 20 }, filters);

      expect(playerRepository.search).toHaveBeenCalledWith("messi", { page: 1, pageSize: 20 }, filters);
    });
  });

  describe("getPerformanceMetrics", () => {
    it("returns metrics for a valid player", async () => {
      const metrics = {
        totalMatches: 10,
        totalGoals: 5,
        totalAssists: 3,
        totalMinutes: 900,
        yellowCards: 1,
        redCards: 0,
        goalsPerMatch: 0.5,
        assistsPerMatch: 0.3,
        motmAwards: 2,
        averageRating: 8.2,
      };
      vi.mocked(playerRepository.getPerformanceMetrics).mockResolvedValue(metrics);

      const result = await service.getPerformanceMetrics("player-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(metrics);
      }
    });
  });

  describe("getMatchHistory", () => {
    it("returns match history", async () => {
      const matches = [{ id: "match-1", date: new Date().toISOString() }];
      vi.mocked(playerRepository.getMatchHistory).mockResolvedValue(matches);

      const result = await service.getMatchHistory("player-1", 5);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(matches);
      }
      expect(playerRepository.getMatchHistory).toHaveBeenCalledWith("player-1", 5);
    });
  });

  describe("getPlayerRatings", () => {
    it("returns ratings data", async () => {
      const ratings = { average: 7.5, recent: [7.5, 8.0, 6.5], trend: "up" as const };
      vi.mocked(playerRepository.getPlayerRatings).mockResolvedValue(ratings);

      const result = await service.getPlayerRatings("player-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(ratings);
      }
    });
  });
});
