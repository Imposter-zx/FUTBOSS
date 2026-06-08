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
      select: { id: true, name: true },
    });

    if (!competition) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Competition not found" } },
        { status: 404 },
      );
    }

    const standings = await prisma.standing.findMany({
      where: { competitionId },
      orderBy: [{ position: "asc" }, { points: "desc" }],
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
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        competitionId,
        competition,
        standings,
        updatedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching standings:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch standings" } },
      { status: 500 },
    );
  }
}
