import { NextResponse } from "next/server";
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

    let preferences = await prisma.userPreference.findUnique({
      where: { userId: session.user.id },
    });

    if (!preferences) {
      preferences = await prisma.userPreference.create({
        data: {
          userId: session.user.id,
          theme: "SYSTEM",
          language: "EN",
          notificationsEnabled: true,
          pushEnabled: true,
          emailEnabled: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: preferences,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch preferences" } },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const allowedFields = [
      "theme",
      "language",
      "notificationsEnabled",
      "pushEnabled",
      "emailEnabled",
      "favoriteTeams",
      "favoriteCompetitions",
      "favoritePlayers",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "No valid fields to update" } },
        { status: 400 },
      );
    }

    const preferences = await prisma.userPreference.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...updateData,
      } as Record<string, unknown> as Parameters<typeof prisma.userPreference.create>[0]["data"],
      update: updateData,
    });

    return NextResponse.json({
      success: true,
      data: preferences,
      message: "Preferences updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update preferences" } },
      { status: 500 },
    );
  }
}
