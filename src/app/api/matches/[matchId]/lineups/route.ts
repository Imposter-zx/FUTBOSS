import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  try {
    const { matchId } = await params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, homeTeamId: true, awayTeamId: true },
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Match not found" } },
        { status: 404 },
      );
    }

    const playerStats = await prisma.matchPlayerStat.findMany({
      where: { matchId },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            slug: true,
            photo: true,
            position: true,
            shirtNumber: true,
            nationality: true,
          },
        },
      },
      orderBy: { player: { position: "asc" } },
    });

    const homeTeamPlayers = playerStats.filter((ps) => ps.teamId === match.homeTeamId);
    const awayTeamPlayers = playerStats.filter((ps) => ps.teamId === match.awayTeamId);

    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({
        where: { id: match.homeTeamId },
        select: { id: true, name: true, slug: true, shortName: true, logo: true, primaryColor: true },
      }),
      prisma.team.findUnique({
        where: { id: match.awayTeamId },
        select: { id: true, name: true, slug: true, shortName: true, logo: true, primaryColor: true },
      }),
    ]);

    const formatLineup = (teamPlayers: typeof playerStats, teamId: string) => {
      const starters = teamPlayers.filter((p) => p.minutesPlayed !== null && p.minutesPlayed! > 0);
      const substitutes = teamPlayers.filter((p) => p.minutesPlayed === null || p.minutesPlayed === 0);

      const hasFormation = starters.length > 0;

      return {
        teamId,
        formation: hasFormation ? calculateFormation(starters) : "4-4-2",
        startingXI: starters.map((p) => ({
          playerId: p.playerId,
          player: p.player,
          shirtNumber: p.player.shirtNumber ?? 0,
          position: p.position ?? p.player.position,
          x: 0,
          y: 0,
          captain: false,
          rating: p.rating,
        })),
        substitutes: substitutes.map((p) => ({
          playerId: p.playerId,
          player: p.player,
          shirtNumber: p.player.shirtNumber ?? 0,
          position: p.position ?? p.player.position,
          rating: p.rating,
        })),
      };
    };

    const result = {
      matchId,
      homeTeam,
      awayTeam,
      home: formatLineup(homeTeamPlayers, match.homeTeamId),
      away: formatLineup(awayTeamPlayers, match.awayTeamId),
    };

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching lineups:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch lineups" } },
      { status: 500 },
    );
  }
}

function calculateFormation(players: { position: string | null }[]): string {
  const def = players.filter((p) => ["CB", "LB", "RB", "LWB", "RWB"].includes(p.position ?? "")).length;
  const mid = players.filter((p) => ["CDM", "CM", "CAM", "LM", "RM"].includes(p.position ?? "")).length;
  const fwd = players.filter((p) => ["LW", "RW", "CF", "ST"].includes(p.position ?? "")).length;
  const gk = players.filter((p) => p.position === "GK").length;

  const defSt = Math.max(1, Math.min(5, def));
  const midSt = Math.max(1, Math.min(5, mid));
  const fwdSt = Math.max(1, Math.min(5, fwd));

  return `${defSt}-${midSt}-${fwdSt}`;
}
