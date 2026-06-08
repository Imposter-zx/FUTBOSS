import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  try {
    const { matchId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const teamId = searchParams.get("teamId");

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true },
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Match not found" } },
        { status: 404 },
      );
    }

    const where: Record<string, unknown> = { matchId };

    if (type) {
      where.type = type;
    }

    if (teamId) {
      where.teamId = teamId;
    }

    const events = await prisma.matchEvent.findMany({
      where,
      orderBy: [{ minute: "asc" }, { addedTime: "asc" }],
      include: {
        player: {
          select: { id: true, name: true, slug: true, photo: true, position: true },
        },
        assistPlayer: {
          select: { id: true, name: true, slug: true, photo: true },
        },
        team: {
          select: { id: true, name: true, slug: true, shortName: true, logo: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: events,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching match events:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch match events" } },
      { status: 500 },
    );
  }
}
