import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MatchStatus, EventType } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Team not found" } },
        { status: 404 },
      );
    }

    const finishedMatchIds = await prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        status: MatchStatus.FINISHED,
      },
      select: { id: true },
    });

    const matchIds = finishedMatchIds.map((m) => m.id);

    const goalEvents = await prisma.matchEvent.groupBy({
      by: ["playerId"],
      where: {
        matchId: { in: matchIds },
        type: EventType.GOAL,
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
    });

    const playerIds = goalEvents.map((g) => g.playerId);

    const assistEvents = await prisma.matchEvent.groupBy({
      by: ["playerId"],
      where: {
        matchId: { in: matchIds },
        type: EventType.ASSIST,
        playerId: { in: playerIds },
      },
      _count: { id: true },
    });

    type GroupByCount = { id: number };
    const assistMap = new Map(assistEvents.map((a) => [a.playerId, (a._count as GroupByCount).id]));

    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        photo: true,
        position: true,
        shirtNumber: true,
      },
    });

    const playerMap = new Map(players.map((p) => [p.id, p]));

    const topScorers = goalEvents.map((g, index) => {
      const player = playerMap.get(g.playerId);
      const goalCount = (g._count as GroupByCount).id;
      return {
        rank: index + 1,
        playerId: g.playerId,
        playerName: player?.name ?? "Unknown",
        playerSlug: player?.slug ?? "",
        playerPhoto: player?.photo ?? null,
        position: player?.position ?? null,
        shirtNumber: player?.shirtNumber ?? null,
        goals: goalCount,
        assists: assistMap.get(g.playerId) ?? 0,
        totalContributions: goalCount + (assistMap.get(g.playerId) ?? 0),
      };
    });

    const uniqueTopScorers = topScorers.filter(
      (ts, i, arr) => arr.findIndex((item) => item.playerId === ts.playerId) === i,
    );

    return NextResponse.json({
      success: true,
      data: {
        teamId,
        teamName: team.name,
        topScorers: uniqueTopScorers,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching team top scorers:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch top scorers" } },
      { status: 500 },
    );
  }
}
