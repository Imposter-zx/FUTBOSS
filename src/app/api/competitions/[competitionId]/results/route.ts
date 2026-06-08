import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MatchStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> },
) {
  try {
    const { competitionId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
    const skip = (page - 1) * pageSize;

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

    const where = { competitionId, status: MatchStatus.FINISHED };

    const [data, totalItems] = await Promise.all([
      prisma.match.findMany({
        skip,
        take: pageSize,
        where,
        orderBy: { date: "desc" },
        include: {
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
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch results" } },
      { status: 500 },
    );
  }
}
