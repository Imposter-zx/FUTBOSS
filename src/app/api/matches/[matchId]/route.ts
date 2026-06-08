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
      include: {
        competition: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        homeTeam: {
          select: {
            id: true,
            name: true,
            slug: true,
            shortName: true,
            logo: true,
            venue: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            slug: true,
            shortName: true,
            logo: true,
            venue: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
        events: {
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
        },
        statistics: true,
        commentaries: {
          orderBy: [{ minute: "asc" }, { id: "asc" }],
        },
        playerStats: {
          include: {
            player: {
              select: { id: true, name: true, slug: true, photo: true, position: true, shirtNumber: true },
            },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Match not found" } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: match,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch match" } },
      { status: 500 },
    );
  }
}
