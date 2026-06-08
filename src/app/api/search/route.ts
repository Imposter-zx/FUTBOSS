import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const type = searchParams.get("type");
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));

    if (!q || q.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          teams: [],
          players: [],
          competitions: [],
          matches: [],
        },
        timestamp: new Date().toISOString(),
      });
    }

    const query = q.trim();

    const searchTypes = type ? [type] : ["teams", "players", "competitions", "matches"];

    const results: Record<string, unknown[]> = {};

    if (searchTypes.includes("teams")) {
      results.teams = await prisma.team.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { shortName: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          shortName: true,
          logo: true,
          country: true,
        },
        take: limit,
        orderBy: { name: "asc" },
      });
    }

    if (searchTypes.includes("players")) {
      results.players = await prisma.player.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { nationality: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          photo: true,
          position: true,
          team: {
            select: { id: true, name: true, slug: true, shortName: true, logo: true },
          },
        },
        take: limit,
        orderBy: { name: "asc" },
      });
    }

    if (searchTypes.includes("competitions")) {
      results.competitions = await prisma.competition.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { shortName: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          shortName: true,
          logo: true,
          country: true,
          tier: true,
        },
        take: limit,
        orderBy: { tier: "asc" },
      });
    }

    if (searchTypes.includes("matches")) {
      results.matches = await prisma.match.findMany({
        where: {
          OR: [
            { venue: { contains: query, mode: "insensitive" } },
            { referee: { contains: query, mode: "insensitive" } },
            { round: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          homeScore: true,
          awayScore: true,
          status: true,
          date: true,
          homeTeam: {
            select: { id: true, name: true, slug: true, shortName: true, logo: true },
          },
          awayTeam: {
            select: { id: true, name: true, slug: true, shortName: true, logo: true },
          },
          competition: {
            select: { id: true, name: true, slug: true, logo: true },
          },
        },
        take: limit,
        orderBy: { date: "desc" },
      });
    }

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        query,
        totalResults: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error performing search:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to perform search" } },
      { status: 500 },
    );
  }
}
