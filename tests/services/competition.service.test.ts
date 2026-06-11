import { describe, it, expect, vi, beforeEach } from "vitest";
import { CompetitionService } from "@/services/competition.service";

vi.mock("@/repositories/competition.repository", () => ({
  default: {
    findBySlug: vi.fn(),
    findActive: vi.fn(),
    getStandings: vi.fn(),
    getTopScorers: vi.fn(),
    getFixtures: vi.fn(),
    getResults: vi.fn(),
    getCompetitionStats: vi.fn(),
    getMatchHistory: vi.fn(),
    getTeams: vi.fn(),
  },
}));

vi.mock("@/repositories/standing.repository", () => ({
  default: {
    updateStandings: vi.fn(),
  },
}));

import competitionRepository from "@/repositories/competition.repository";
import standingRepository from "@/repositories/standing.repository";

describe("CompetitionService", () => {
  let service: CompetitionService;

  beforeEach(() => {
    service = new CompetitionService();
    vi.clearAllMocks();
  });

  describe("findBySlug", () => {
    it("returns competition data for a valid slug", async () => {
      const mockCompetition = { id: "c1", name: "Premier League", slug: "premier-league" };
      vi.mocked(competitionRepository.findBySlug).mockResolvedValue(mockCompetition as never);

      const result = await service.findBySlug("premier-league");

      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toEqual(mockCompetition);
      expect(competitionRepository.findBySlug).toHaveBeenCalledWith("premier-league");
    });

    it("returns error when repository throws", async () => {
      vi.mocked(competitionRepository.findBySlug).mockRejectedValue(new Error("Competition not found"));

      const result = await service.findBySlug("unknown");

      expect(result.success).toBe(false);
    });
  });

  describe("findActive", () => {
    it("returns active competitions", async () => {
      const competitions = [{ id: "c1", name: "Premier League", isActive: true }];
      vi.mocked(competitionRepository.findActive).mockResolvedValue(competitions as never);

      const result = await service.findActive("20242025");

      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toEqual(competitions);
      expect(competitionRepository.findActive).toHaveBeenCalledWith("20242025");
    });

    it("works without season filter", async () => {
      vi.mocked(competitionRepository.findActive).mockResolvedValue([] as never);

      const result = await service.findActive();

      expect(result.success).toBe(true);
      expect(competitionRepository.findActive).toHaveBeenCalledWith(undefined);
    });
  });

  describe("getStandings", () => {
    it("returns standings for a competition", async () => {
      const standings = [{ position: 1, team: { name: "Team A" }, points: 45 }];
      vi.mocked(competitionRepository.getStandings).mockResolvedValue(standings as never);

      const result = await service.getStandings("c1");

      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toEqual(standings);
      expect(competitionRepository.getStandings).toHaveBeenCalledWith("c1");
    });
  });

  describe("getTopScorers", () => {
    it("returns top scorers", async () => {
      const scorers = [{ playerId: "p1", playerName: "Player 1", goals: 15, assists: 5 }];
      vi.mocked(competitionRepository.getTopScorers).mockResolvedValue(scorers as never);

      const result = await service.getTopScorers("c1", 10);

      expect(result.success).toBe(true);
      expect(competitionRepository.getTopScorers).toHaveBeenCalledWith("c1", 10);
    });
  });

  describe("getFixtures", () => {
    it("returns paginated fixtures", async () => {
      const fixtures = {
        items: [{ id: "m1", status: "SCHEDULED" }],
        pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1, hasNext: false, hasPrevious: false },
      };
      vi.mocked(competitionRepository.getFixtures).mockResolvedValue(fixtures as never);

      const result = await service.getFixtures("c1", { page: 1, pageSize: 20 });

      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toEqual(fixtures);
      expect(competitionRepository.getFixtures).toHaveBeenCalledWith("c1", { page: 1, pageSize: 20 });
    });
  });

  describe("getResults", () => {
    it("returns paginated results", async () => {
      const results = {
        items: [{ id: "m2", status: "FINISHED" }],
        pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1, hasNext: false, hasPrevious: false },
      };
      vi.mocked(competitionRepository.getResults).mockResolvedValue(results as never);

      const result = await service.getResults("c1", { page: 1, pageSize: 20 });

      expect(result.success).toBe(true);
      expect(competitionRepository.getResults).toHaveBeenCalledWith("c1", { page: 1, pageSize: 20 });
    });
  });

  describe("getCompetitionStats", () => {
    it("returns competition stats", async () => {
      const stats = { totalMatches: 100, totalGoals: 250, averageGoals: 2.5, totalTeams: 20 };
      vi.mocked(competitionRepository.getCompetitionStats).mockResolvedValue(stats as never);

      const result = await service.getCompetitionStats("c1");

      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toEqual(stats);
    });
  });

  describe("getMatchHistory", () => {
    it("returns match history between competition and team", async () => {
      const history = [{ id: "m1", date: new Date().toISOString() }];
      vi.mocked(competitionRepository.getMatchHistory).mockResolvedValue(history as never);

      const result = await service.getMatchHistory("c1", "team-1", 5);

      expect(result.success).toBe(true);
      expect(competitionRepository.getMatchHistory).toHaveBeenCalledWith("c1", "team-1", 5);
    });
  });

  describe("getTeams", () => {
    it("returns teams in competition", async () => {
      const teams = [{ id: "t1", name: "Team A", standing: { position: 1, points: 45 } }];
      vi.mocked(competitionRepository.getTeams).mockResolvedValue(teams as never);

      const result = await service.getTeams("c1");

      expect(result.success).toBe(true);
      expect(competitionRepository.getTeams).toHaveBeenCalledWith("c1");
    });
  });

  describe("updateStandings", () => {
    it("updates standings successfully", async () => {
      vi.mocked(standingRepository.updateStandings).mockResolvedValue(undefined);

      const standings = [
        { teamId: "t1", position: 1, playedGames: 10, won: 8, drawn: 1, lost: 1, goalsFor: 25, goalsAgainst: 5, points: 25 },
      ];

      const result = await service.updateStandings("c1", standings);

      expect(result.success).toBe(true);
      expect(standingRepository.updateStandings).toHaveBeenCalledWith("c1", standings);
    });

    it("rejects empty standings array", async () => {
      const result = await service.updateStandings("c1", []);

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(standingRepository.updateStandings).not.toHaveBeenCalled();
    });

    it("returns error when updateStandings throws", async () => {
      vi.mocked(standingRepository.updateStandings).mockRejectedValue(new Error("Update failed"));

      const standings = [
        { teamId: "t1", position: 1, playedGames: 10, won: 8, drawn: 1, lost: 1, goalsFor: 25, goalsAgainst: 5, points: 25 },
      ];

      const result = await service.updateStandings("c1", standings);

      expect(result.success).toBe(false);
    });
  });
});
