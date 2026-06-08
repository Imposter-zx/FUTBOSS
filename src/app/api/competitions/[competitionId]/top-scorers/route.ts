import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MatchStatus, EventType } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> },
) {
  try {
    const { competitionId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

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

    const finishedMatchIds = await prisma.match.findMany({
      where: { competitionId, status: MatchStatus.FINISHED },
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

    const assistEvents = await prisma.matchEvent.groupBy({
      by: ["playerId"],
      where: {
        matchId: { in: matchIds },
        type: EventType.ASSIST,
      },
      _count: { id: true },
    });

    type GroupByCount = { id: number };
    const assistMap = new Map(assistEvents.map((a) => [a.playerId, (a._count as GroupByCount).id]));
    const playerIds = goalEvents.map((g) => g.playerId).filter(Boolean) as string[];

    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        photo: true,
        position: true,
        team: {
          select: { id: true, name: true, slug: true, shortName: true, logo: true },
        },
      },
    });

    const playerMap = new Map(players.map((p) => [p.id, p]));

    const topScorers = goalEvents.map((g, index) => {
      const player = playerMap.get(g.playerId ?? "");
      return {
        rank: index + 1,
        playerId: g.playerId ?? "",
        playerName: player?.name ?? "Unknown",
        playerSlug: player?.slug ?? "",
        playerPhoto: player?.photo ?? null,
        position: player?.position ?? null,
        team: player?.team ?? null,
        goals: (g._count as GroupByCount).id,
        assists: assistMap.get(g.playerId) ?? 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: topScorers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching top scorers:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch top scorers" } },
      { status: 500 },
    );
  }
}
