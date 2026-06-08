import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Team not found" } },
        { status: 404 },
      );
    }

    const finishedMatches = await prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        status: "FINISHED",
      },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
        date: true,
      },
      orderBy: { date: "desc" },
    });

    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    let cleanSheets = 0;
    let homeWins = 0;
    let homeDraws = 0;
    let homeLosses = 0;
    let awayWins = 0;
    let awayDraws = 0;
    let awayLosses = 0;
    let homeGoalsFor = 0;
    let homeGoalsAgainst = 0;
    let awayGoalsFor = 0;
    let awayGoalsAgainst = 0;

    for (const match of finishedMatches) {
      const isHome = match.homeTeamId === teamId;
      const teamScore = isHome ? (match.homeScore ?? 0) : (match.awayScore ?? 0);
      const opponentScore = isHome ? (match.awayScore ?? 0) : (match.homeScore ?? 0);

      goalsFor += teamScore;
      goalsAgainst += opponentScore;

      if (opponentScore === 0) cleanSheets++;

      if (isHome) {
        homeGoalsFor += teamScore;
        homeGoalsAgainst += opponentScore;
      } else {
        awayGoalsFor += teamScore;
        awayGoalsAgainst += opponentScore;
      }

      if (teamScore > opponentScore) {
        wins++;
        if (isHome) homeWins++;
        else awayWins++;
      } else if (teamScore === opponentScore) {
        draws++;
        if (isHome) homeDraws++;
        else awayDraws++;
      } else {
        losses++;
        if (isHome) homeLosses++;
        else awayLosses++;
      }
    }

    const recentForm = finishedMatches.slice(0, 5).reverse().map((m) => {
      const isHome = m.homeTeamId === teamId;
      const teamScore = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
      const opponentScore = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
      if (teamScore > opponentScore) return "W";
      if (teamScore === opponentScore) return "D";
      return "L";
    });

    const winRate = finishedMatches.length > 0
      ? Number(((wins / finishedMatches.length) * 100).toFixed(1))
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        teamId,
        totalMatches: finishedMatches.length,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        cleanSheets,
        winRate,
        averageGoalsScored: finishedMatches.length > 0
          ? Number((goalsFor / finishedMatches.length).toFixed(2))
          : 0,
        averageGoalsConceded: finishedMatches.length > 0
          ? Number((goalsAgainst / finishedMatches.length).toFixed(2))
          : 0,
        form: recentForm,
        homeRecord: {
          played: homeWins + homeDraws + homeLosses,
          wins: homeWins,
          draws: homeDraws,
          losses: homeLosses,
          goalsFor: homeGoalsFor,
          goalsAgainst: homeGoalsAgainst,
        },
        awayRecord: {
          played: awayWins + awayDraws + awayLosses,
          wins: awayWins,
          draws: awayDraws,
          losses: awayLosses,
          goalsFor: awayGoalsFor,
          goalsAgainst: awayGoalsAgainst,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching team stats:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch team stats" } },
      { status: 500 },
    );
  }
}
