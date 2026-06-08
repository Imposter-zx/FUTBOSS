import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get("season");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (season) {
      where.season = season;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { shortName: { contains: search, mode: "insensitive" } },
      ];
    }

    const competitions = await prisma.competition.findMany({
      where,
      orderBy: [{ tier: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: { matches: true, standings: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: competitions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching competitions:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch competitions" } },
      { status: 500 },
    );
  }
}
