import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const country = searchParams.get("country");
    const competitionId = searchParams.get("competitionId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { shortName: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (country) {
      where.country = country;
    }

    if (competitionId) {
      where.competitions = {
        some: { competitionId },
      };
    }

    const [data, totalItems] = await Promise.all([
      prisma.team.findMany({
        skip,
        take: pageSize,
        where,
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { players: true, homeMatches: true, awayMatches: true },
          },
          competitions: {
            include: {
              competition: {
                select: { id: true, name: true, slug: true, logo: true },
              },
            },
          },
        },
      }),
      prisma.team.count({ where }),
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
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch teams" } },
      { status: 500 },
    );
  }
}
