import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;
    const { searchParams } = new URL(request.url);
    const position = searchParams.get("position");

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Team not found" } },
        { status: 404 },
      );
    }

    const where: Record<string, unknown> = { teamId };

    if (position) {
      where.position = position;
    }

    const players = await prisma.player.findMany({
      where,
      orderBy: [{ position: "asc" }, { shirtNumber: "asc" }, { name: "asc" }],
    });

    const groupedPlayers = {
      goalkeepers: players.filter((p) => p.position === "GK"),
      defenders: players.filter((p) =>
        ["CB", "LB", "RB", "LWB", "RWB"].includes(p.position),
      ),
      midfielders: players.filter((p) =>
        ["CDM", "CM", "CAM", "LM", "RM"].includes(p.position),
      ),
      forwards: players.filter((p) =>
        ["LW", "RW", "CF", "ST"].includes(p.position),
      ),
    };

    return NextResponse.json({
      success: true,
      data: {
        teamId,
        totalPlayers: players.length,
        players,
        grouped: groupedPlayers,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching squad:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch squad" } },
      { status: 500 },
    );
  }
}
