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
      include: {
        _count: {
          select: { players: true, homeMatches: true, awayMatches: true },
        },
        competitions: {
          include: {
            competition: {
              select: { id: true, name: true, slug: true, logo: true, tier: true },
            },
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Team not found" } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: team,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch team" } },
      { status: 500 },
    );
  }
}
