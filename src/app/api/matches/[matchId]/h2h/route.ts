import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MatchStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  try {
    const { matchId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { homeTeamId: true, awayTeamId: true },
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Match not found" } },
        { status: 404 },
      );
    }

    const [team1, team2] = await Promise.all([
      prisma.team.findUnique({
        where: { id: match.homeTeamId },
        select: { id: true, name: true, slug: true, shortName: true, logo: true },
      }),
      prisma.team.findUnique({
        where: { id: match.awayTeamId },
        select: { id: true, name: true, slug: true, shortName: true, logo: true },
      }),
    ]);

    const h2hMatches = await prisma.match.findMany({
      where: {
        OR: [
          { homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId },
          { homeTeamId: match.awayTeamId, awayTeamId: match.homeTeamId },
        ],
        status: MatchStatus.FINISHED,
      },
      orderBy: { date: "desc" },
      take: limit,
      include: {
        competition: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        homeTeam: {
          select: { id: true, name: true, slug: true, shortName: true, logo: true },
        },
        awayTeam: {
          select: { id: true, name: true, slug: true, shortName: true, logo: true },
        },
      },
    });

    let team1Wins = 0;
    let team2Wins = 0;
    let draws = 0;
    let team1Goals = 0;
    let team2Goals = 0;

    for (const hMatch of h2hMatches) {
      const isTeam1Home = hMatch.homeTeamId === match.homeTeamId;
      const t1Score = isTeam1Home ? (hMatch.homeScore ?? 0) : (hMatch.awayScore ?? 0);
      const t2Score = isTeam1Home ? (hMatch.awayScore ?? 0) : (hMatch.homeScore ?? 0);

      team1Goals += t1Score;
      team2Goals += t2Score;

      if (t1Score > t2Score) team1Wins++;
      else if (t1Score < t2Score) team2Wins++;
      else draws++;
    }

    return NextResponse.json({
      success: true,
      data: {
        team1,
        team2,
        totalMatches: h2hMatches.length,
        team1Wins,
        team2Wins,
        draws,
        team1Goals,
        team2Goals,
        recentMatches: h2hMatches,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching head to head:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch head to head" } },
      { status: 500 },
    );
  }
}
