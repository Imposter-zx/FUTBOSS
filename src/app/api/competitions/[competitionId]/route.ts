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
      include: {
        _count: {
          select: { matches: true, standings: true, teams: true, seasons: true },
        },
        seasons: {
          where: { isCurrent: true },
          take: 1,
        },
      },
    });

    if (!competition) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Competition not found" } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: competition,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching competition:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch competition" } },
      { status: 500 },
    );
  }
}
