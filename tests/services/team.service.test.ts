import { describe, it, expect, vi, beforeEach } from "vitest";
import { TeamService } from "@/services/team.service";

vi.mock("@/repositories/team.repository", () => ({
  default: {
    findBySlug: vi.fn(),
    getSquad: vi.fn(),
    getRecentMatches: vi.fn(),
    getUpcomingMatches: vi.fn(),
    getTeamStats: vi.fn(),
    getTopScorers: vi.fn(),
    getLeaguePosition: vi.fn(),
  },
}));

import teamRepository from "@/repositories/team.repository";

describe("TeamService", () => {
  let service: TeamService;

  beforeEach(() => {
    service = new TeamService();
    vi.clearAllMocks();
  });

  describe("findBySlug", () => {
    it("returns team data for a valid slug", async () => {
      const mockTeam = { id: "team-1", name: "FC Barcelona", slug: "fc-barcelona" };
      vi.mocked(teamRepository.findBySlug).mockResolvedValue(mockTeam as never);

      const result = await service.findBySlug("fc-barcelona");

      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toEqual(mockTeam);
      expect(teamRepository.findBySlug).toHaveBeenCalledWith("fc-barcelona");
    });

    it("returns error when repository throws", async () => {
      vi.mocked(teamRepository.findBySlug).mockRejectedValue(new Error("Team not found"));

      const result = await service.findBySlug("unknown");

      expect(result.success).toBe(false);
    });
  });

  describe("getSquad", () => {
    it("returns squad for a team", async () => {
      const squad = [{ id: "p1", name: "Player 1", position: "FW" }];
      vi.mocked(teamRepository.getSquad).mockResolvedValue(squad as never);

      const result = await service.getSquad("team-1");

      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toEqual(squad);
      expect(teamRepository.getSquad).toHaveBeenCalledWith("team-1");
    });
  });

  describe("getRecentMatches", () => {
    it("returns recent matches for a team", async () => {
      const matches = [{ id: "m1", date: new Date().toISOString(), status: "FINISHED" }];
      vi.mocked(teamRepository.getRecentMatches).mockResolvedValue(matches as never);

      const result = await service.getRecentMatches("team-1", 5);

      expect(result.success).toBe(true);
      expect(teamRepository.getRecentMatches).toHaveBeenCalledWith("team-1", 5);
    });
  });

  describe("getUpcomingMatches", () => {
    it("returns upcoming matches for a team", async () => {
      const matches = [{ id: "m2", date: new Date(Date.now() + 86400000).toISOString(), status: "SCHEDULED" }];
      vi.mocked(teamRepository.getUpcomingMatches).mockResolvedValue(matches as never);

      const result = await service.getUpcomingMatches("team-1", 5);

      expect(result.success).toBe(true);
      expect(teamRepository.getUpcomingMatches).toHaveBeenCalledWith("team-1", 5);
    });
  });

  describe("getTeamStats", () => {
    it("returns stats for a team", async () => {
      const stats = { totalMatches: 10, wins: 5, draws: 3, losses: 2 };
      vi.mocked(teamRepository.getTeamStats).mockResolvedValue(stats as never);

      const result = await service.getTeamStats("team-1");

      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toEqual(stats);
      expect(teamRepository.getTeamStats).toHaveBeenCalledWith("team-1");
    });
  });

  describe("getTopScorers", () => {
    it("returns top scorers for a team", async () => {
      const scorers = [{ playerId: "p1", playerName: "Player 1", goals: 10, assists: 5, appearances: 15 }];
      vi.mocked(teamRepository.getTopScorers).mockResolvedValue(scorers as never);

      const result = await service.getTopScorers("team-1", 5);

      expect(result.success).toBe(true);
      expect(teamRepository.getTopScorers).toHaveBeenCalledWith("team-1", 5);
    });
  });

  describe("getLeaguePosition", () => {
    it("returns league position for a team", async () => {
      const position = { competitionId: "c1", competitionName: "La Liga", position: 1, totalTeams: 20, points: 45 };
      vi.mocked(teamRepository.getLeaguePosition).mockResolvedValue(position as never);

      const result = await service.getLeaguePosition("team-1");

      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toEqual(position);
      expect(teamRepository.getLeaguePosition).toHaveBeenCalledWith("team-1");
    });

    it("returns null when team has no league position", async () => {
      vi.mocked(teamRepository.getLeaguePosition).mockResolvedValue(null as never);

      const result = await service.getLeaguePosition("nonexistent");

      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBeNull();
    });
  });
});
