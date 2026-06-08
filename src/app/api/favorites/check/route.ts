import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "entityType and entityId query params are required" } },
        { status: 400 },
      );
    }

    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        entityType,
        entityId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        isFavorited: !!favorite,
        favoriteId: favorite?.id ?? null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error checking favorite:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to check favorite status" } },
      { status: 500 },
    );
  }
}
