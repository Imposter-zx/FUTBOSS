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
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            shortName: true,
            logo: true,
            venue: true,
          },
        },
        _count: {
          select: { matchEvents: true, matchPlayerStats: true },
        },
      },
    });

    if (!player) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Player not found" } },
        { status: 404 },
      );
    }

    const stats = await prisma.matchEvent.groupBy({
      by: ["type"],
      where: { playerId },
      _count: { id: true },
    });

    const statsMap = {
      goals: stats.find((s) => s.type === "GOAL")?._count!.id ?? 0,
      assists: stats.find((s) => s.type === "ASSIST")?._count!.id ?? 0,
      yellowCards: stats.find((s) => s.type === "YELLOW_CARD")?._count!.id ?? 0,
      redCards: stats.find((s) => s.type === "RED_CARD")?._count!.id ?? 0,
      appearances: stats.reduce((sum, s) => sum + s._count!.id, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        ...player,
        stats: statsMap,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching player:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch player" } },
      { status: 500 },
    );
  }
}
