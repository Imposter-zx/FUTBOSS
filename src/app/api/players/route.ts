import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
    const skip = (page - 1) * pageSize;
    const search = searchParams.get("search");
    const position = searchParams.get("position");
    const nationality = searchParams.get("nationality");
    const teamId = searchParams.get("teamId");
    const sortBy = searchParams.get("sortBy") ?? "name";
    const sortOrder = (searchParams.get("sortOrder") ?? "asc") as "asc" | "desc";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (position) {
      where.position = position;
    }

    if (nationality) {
      where.nationality = { contains: nationality, mode: "insensitive" };
    }

    if (teamId) {
      where.teamId = teamId;
    }

    const orderBy: Record<string, "asc" | "desc"> = {};
    const validSortFields = ["name", "goals", "assists", "appearances", "rating", "marketValue", "age"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "name";
    orderBy[sortField] = sortOrder;

    const [data, totalItems] = await Promise.all([
      prisma.player.findMany({
        skip,
        take: pageSize,
        where,
        orderBy,
        include: {
          team: {
            select: { id: true, name: true, slug: true, shortName: true, logo: true },
          },
        },
      }),
      prisma.player.count({ where }),
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
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch players" } },
      { status: 500 },
    );
  }
}
