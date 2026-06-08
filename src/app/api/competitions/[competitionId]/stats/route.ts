import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> },
) {
  try {
    const { competitionId } = await params;

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { id: true },
    });

    if (!competition) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Competition not found" } },
        { status: 404 },
      );
    }

    const [allMatches, standingsCount, goalAndCardEvents] = await Promise.all([
      prisma.match.findMany({
        where: { competitionId },
        select: { homeScore: true, awayScore: true, status: true },
      }),
      prisma.standing.count({ where: { competitionId } }),
      prisma.matchEvent.findMany({
        where: {
          match: { competitionId },
          type: { in: ["GOAL", "YELLOW_CARD", "RED_CARD", "ASSIST"] },
        },
        select: { type: true },
      }),
    ]);

    const finishedMatches = allMatches.filter((m) => m.status === "FINISHED");
    const totalGoals = finishedMatches.reduce((sum, m) => sum + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);
    const goalsByMatch = finishedMatches.map((m) => (m.homeScore ?? 0) + (m.awayScore ?? 0));

    const cleanSheets = finishedMatches.filter(
      (m) => (m.homeScore === 0) || (m.awayScore === 0),
    ).length;

    const highestScoringMatch = finishedMatches.length > 0
      ? Math.max(...goalsByMatch)
      : 0;

    const goalsPerMatch = finishedMatches.length > 0
      ? Number((totalGoals / finishedMatches.length).toFixed(2))
      : 0;

    const totalYellowCards = goalAndCardEvents.filter((e) => e.type === "YELLOW_CARD").length;
    const totalRedCards = goalAndCardEvents.filter((e) => e.type === "RED_CARD").length;
    const totalAssists = goalAndCardEvents.filter((e) => e.type === "ASSIST").length;

    return NextResponse.json({
      success: true,
      data: {
        totalMatches: allMatches.length,
        finishedMatches: finishedMatches.length,
        totalGoals,
        averageGoals: goalsPerMatch,
        totalTeams: standingsCount,
        totalYellowCards,
        totalRedCards,
        totalAssists,
        cleanSheets,
        highestScoringMatch,
        cardsPerMatch: finishedMatches.length > 0
          ? Number(((totalYellowCards + totalRedCards) / finishedMatches.length).toFixed(2))
          : 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching competition stats:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch competition stats" } },
      { status: 500 },
    );
  }
}
