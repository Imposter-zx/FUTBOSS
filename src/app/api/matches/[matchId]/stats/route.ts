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

    const [statistics, events, matchDetails] = await Promise.all([
      prisma.matchStatistic.findMany({
        where: { matchId },
      }),
      prisma.matchEvent.findMany({
        where: { matchId },
        select: { teamId: true, type: true },
      }),
      prisma.match.findUnique({
        where: { id: matchId },
        select: { homeScore: true, awayScore: true },
      }),
    ]);

    const homeEvents = events.filter((e) => e.teamId === match.homeTeamId);
    const awayEvents = events.filter((e) => e.teamId === match.awayTeamId);

    const calculateStats = (teamEvents: typeof events) => ({
      goals: teamEvents.filter((e) => e.type === "GOAL").length,
      assists: teamEvents.filter((e) => e.type === "ASSIST").length,
      yellowCards: teamEvents.filter((e) => e.type === "YELLOW_CARD").length,
      redCards: teamEvents.filter((e) => e.type === "RED_CARD").length,
      substitutions: teamEvents.filter((e) => e.type === "SUBSTITUTION").length,
      fouls: teamEvents.filter((e) => ["FOUL"].includes(e.type)).length,
      corners: teamEvents.filter((e) => ["CORNER"].includes(e.type)).length,
      offsides: teamEvents.filter((e) => ["OFFSIDE"].includes(e.type)).length,
      saves: teamEvents.filter((e) => ["SAVE"].includes(e.type)).length,
    });

    const statMap = new Map(statistics.map((s) => [s.category, { home: s.homeValue, away: s.awayValue }]));

    const formattedStats = {
      ballPossession: statMap.get("POSSESSION") ?? { home: 50, away: 50 },
      totalShots: statMap.get("SHOTS") ?? { home: 0, away: 0 },
      shotsOnTarget: statMap.get("SHOTS_ON_TARGET") ?? { home: 0, away: 0 },
      corners: statMap.get("CORNERS") ?? { home: 0, away: 0 },
      fouls: statMap.get("FOULS") ?? { home: 0, away: 0 },
      yellowCards: statMap.get("YELLOW_CARDS") ?? { home: 0, away: 0 },
      redCards: statMap.get("RED_CARDS") ?? { home: 0, away: 0 },
      offsides: statMap.get("OFFSIDES") ?? { home: 0, away: 0 },
      saves: statMap.get("SAVES") ?? { home: 0, away: 0 },
      passes: statMap.get("PASSES") ?? { home: 0, away: 0 },
      passAccuracy: statMap.get("PASS_ACCURACY") ?? { home: 0, away: 0 },
      tackles: statMap.get("TACKLES") ?? { home: 0, away: 0 },
      interceptions: statMap.get("INTERCEPTIONS") ?? { home: 0, away: 0 },
      clearances: statMap.get("CLEARANCES") ?? { home: 0, away: 0 },
      blocks: statMap.get("BLOCKS") ?? { home: 0, away: 0 },
      crosses: statMap.get("CROSSES") ?? { home: 0, away: 0 },
      dribbles: statMap.get("DRIBBLES") ?? { home: 0, away: 0 },
    };

    return NextResponse.json({
      success: true,
      data: {
        matchId,
        match: matchDetails,
        homeTeam: { id: match.homeTeamId, stats: calculateStats(homeEvents) },
        awayTeam: { id: match.awayTeamId, stats: calculateStats(awayEvents) },
        statistics: formattedStats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching match stats:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch match statistics" } },
      { status: 500 },
    );
  }
}
