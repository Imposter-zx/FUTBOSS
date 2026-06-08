import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MatchStatus } from "@prisma/client";

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { status: MatchStatus.LIVE },
          { status: MatchStatus.HALF_TIME },
          { status: MatchStatus.EXTRA_TIME },
          { status: MatchStatus.PENALTIES },
        ],
      },
      orderBy: [{ status: "asc" }, { date: "desc" }],
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
      },
    });

    return NextResponse.json({
      success: true,
      data: matches,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching live matches:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch live matches" } },
      { status: 500 },
    );
  }
}
