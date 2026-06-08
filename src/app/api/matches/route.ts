import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
    const skip = (page - 1) * pageSize;
    const status = searchParams.get("status");
    const competitionId = searchParams.get("competitionId");
    const date = searchParams.get("date");
    const teamId = searchParams.get("teamId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (competitionId) {
      where.competitionId = competitionId;
    }

    if (date) {
      const matchDate = new Date(date);
      const startOfDay = new Date(matchDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(matchDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.date = { gte: startOfDay, lte: endOfDay };
    }

    if (teamId) {
      where.OR = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
    }

    if (search) {
      where.OR = [
        { venue: { contains: search, mode: "insensitive" } },
        { referee: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, totalItems] = await Promise.all([
      prisma.match.findMany({
        skip,
        take: pageSize,
        where,
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
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch matches" } },
      { status: 500 },
    );
  }
}
