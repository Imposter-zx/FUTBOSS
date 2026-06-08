import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MatchStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
    const skip = (page - 1) * pageSize;
    const competitionId = searchParams.get("competitionId");

    const now = new Date();
    const where: Record<string, unknown> = {
      date: { gte: now },
      status: { in: [MatchStatus.SCHEDULED] },
    };

    if (competitionId) {
      where.competitionId = competitionId;
    }

    const [data, totalItems] = await Promise.all([
      prisma.match.findMany({
        skip,
        take: pageSize,
        where,
        orderBy: { date: "asc" },
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
      }),
      prisma.match.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    return NextResponse.json({
      success: true,
      data,
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
    console.error("Error fetching upcoming matches:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch upcoming matches" } },
      { status: 500 },
    );
  }
}
