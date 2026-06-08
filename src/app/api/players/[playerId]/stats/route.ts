import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> },
) {
  try {
    const { playerId } = await params;

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, name: true },
    });

    if (!player) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Player not found" } },
        { status: 404 },
      );
    }

    const [events, playerMatches, playerStats] = await Promise.all([
      prisma.matchEvent.findMany({
        where: { playerId },
        select: { type: true, minute: true, matchId: true },
      }),
      prisma.matchPlayerStat.findMany({
        where: { playerId },
        include: {
          match: {
            select: { date: true, competitionId: true },
          },
        },
        orderBy: { match: { date: "desc" } },
      }),
      prisma.matchPlayerStat.aggregate({
        where: { playerId },
        _avg: {
          rating: true,
          passAccuracy: true,
          xG: true,
          xA: true,
          touches: true,
        },
        _sum: {
          minutesPlayed: true,
          goals: true,
          assists: true,
          shots: true,
          shotsOnTarget: true,
          passes: true,
          tackles: true,
          interceptions: true,
          clearances: true,
          blocks: true,
          fouls: true,
          yellowCards: true,
          redCards: true,
          offsides: true,
          dribbles: true,
          dispossessed: true,
          aerialDuelsWon: true,
          aerialDuelsLost: true,
          keyPasses: true,
        },
      }),
    ]);

    const totalMatches = playerMatches.length;
    const goals = events.filter((e) => e.type === "GOAL").length;
    const assists = events.filter((e) => e.type === "ASSIST").length;

    const seasonalStats = [
      {
        season: "2024/2025",
        appearances: totalMatches,
        starts: playerStats._sum.minutesPlayed ? Math.ceil(playerStats._sum.minutesPlayed / 90) : 0,
        minutesPlayed: playerStats._sum.minutesPlayed ?? 0,
        goals: playerStats._sum.goals ?? 0,
        assists: playerStats._sum.assists ?? 0,
        shots: playerStats._sum.shots ?? 0,
        shotsOnTarget: playerStats._sum.shotsOnTarget ?? 0,
        passAccuracy: playerStats._avg.passAccuracy ?? 0,
        tackles: playerStats._sum.tackles ?? 0,
        interceptions: playerStats._sum.interceptions ?? 0,
        clearances: playerStats._sum.clearances ?? 0,
        blocks: playerStats._sum.blocks ?? 0,
        fouls: playerStats._sum.fouls ?? 0,
        yellowCards: playerStats._sum.yellowCards ?? 0,
        redCards: playerStats._sum.redCards ?? 0,
        offsides: playerStats._sum.offsides ?? 0,
        dribbles: playerStats._sum.dribbles ?? 0,
        dispossessed: playerStats._sum.dispossessed ?? 0,
        aerialDuelsWon: playerStats._sum.aerialDuelsWon ?? 0,
        aerialDuelsLost: playerStats._sum.aerialDuelsLost ?? 0,
        keyPasses: playerStats._sum.keyPasses ?? 0,
        rating: playerStats._avg.rating ?? 0,
        xG: playerStats._avg.xG ?? 0,
        xA: playerStats._avg.xA ?? 0,
      },
    ];

    const totalDuels = (playerStats._sum.aerialDuelsWon ?? 0) + (playerStats._sum.aerialDuelsLost ?? 0);
    const shotAccuracy = playerStats._sum.shots && playerStats._sum.shots > 0
      ? Number((((playerStats._sum.shotsOnTarget ?? 0) / (playerStats._sum.shots ?? 0)) * 100).toFixed(1))
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        playerId,
        playerName: player.name,
        career: {
          totalMatches,
          totalGoals: goals,
          totalAssists: assists,
          goalsPerMatch: totalMatches > 0 ? Number((goals / totalMatches).toFixed(2)) : 0,
          assistsPerMatch: totalMatches > 0 ? Number((assists / totalMatches).toFixed(2)) : 0,
          shotAccuracy,
          duelWinRate: totalDuels > 0
            ? Number((((playerStats._sum.aerialDuelsWon ?? 0) / totalDuels) * 100).toFixed(1))
            : 0,
        },
        seasonal: seasonalStats,
        averages: {
          rating: Number((playerStats._avg.rating ?? 0).toFixed(1)),
          passes: Number((playerStats._avg.passAccuracy ?? 0).toFixed(1)),
          touches: Number((playerStats._avg.touches ?? 0).toFixed(0)),
          xG: Number((playerStats._avg.xG ?? 0).toFixed(2)),
          xA: Number((playerStats._avg.xA ?? 0).toFixed(2)),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching player stats:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch player stats" } },
      { status: 500 },
    );
  }
}
