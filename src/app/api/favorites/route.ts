import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: favorites,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch favorites" } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { entityType, entityId } = body as {
      entityType?: string;
      entityId?: string;
    };

    if (!entityType || !entityId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "entityType and entityId are required" } },
        { status: 400 },
      );
    }

    const existing = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        entityType,
        entityId,
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        message: "Already in favorites",
        timestamp: new Date().toISOString(),
      });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        entityType,
        entityId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: favorite,
        message: "Added to favorites",
        timestamp: new Date().toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to add favorite" } },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { entityType, entityId } = body as {
      entityType?: string;
      entityId?: string;
    };

    if (!entityType || !entityId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "entityType and entityId are required" } },
        { status: 400 },
      );
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        entityType,
        entityId,
      },
    });

    return NextResponse.json({
      success: true,
      data: null,
      message: "Removed from favorites",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to remove favorite" } },
      { status: 500 },
    );
  }
}
