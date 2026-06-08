import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> },
) {
  try {
    const { playerId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
    const skip = (page - 1) * pageSize;

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

    const matchIdsResult = await prisma.matchEvent.findMany({
      where: { playerId },
      select: { matchId: true },
      distinct: ["matchId"],
      orderBy: { minute: "desc" },
    });

    const matchIds = matchIdsResult.map((m) => m.matchId);

    const totalItems = matchIds.length;

    const paginatedMatchIds = matchIds.slice(skip, skip + pageSize);

    const matches = await prisma.match.findMany({
      where: { id: { in: paginatedMatchIds } },
      orderBy: { date: "desc" },
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
        events: {
          where: { playerId },
          select: { id: true, type: true, minute: true, addedTime: true },
          orderBy: { minute: "asc" },
        },
      },
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    return NextResponse.json({
      success: true,
      data: matches,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching player matches:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch player matches" } },
      { status: 500 },
    );
  }
}
