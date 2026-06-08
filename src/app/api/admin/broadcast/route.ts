import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redis } from "@/lib/redis"
import { logger } from "@/lib/logger"
import { z } from "zod"

const broadcastSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum([
    "MATCH_START",
    "MATCH_GOAL",
    "MATCH_END",
    "MATCH_REMINDER",
    "SUBSCRIPTION",
    "SYSTEM",
    "NEWS",
    "TRANSFER",
  ]).default("SYSTEM"),
  target: z.object({
    type: z.enum(["ALL", "USERS", "TEAM", "COMPETITION", "PLAYER"]),
    ids: z.array(z.string()).optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = broadcastSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { title, message, type, target } = validation.data

    let users: Array<{ id: string }> = []

    if (!target || target.type === "ALL") {
      users = await prisma.user.findMany({
        select: { id: true },
        where: { role: { not: "ADMIN" } },
      })
    } else if (target.type === "USERS" && target.ids) {
      users = target.ids.map((id) => ({ id }))
    } else if (target.type === "TEAM" && target.ids) {
      const subscriptions = await prisma.userSubscription.findMany({
        where: {
          type: "TEAM",
          teamId: { in: target.ids },
        },
        select: { userId: true },
      })
      users = subscriptions.map((s) => ({ id: s.userId }))
    } else if (target.type === "COMPETITION" && target.ids) {
      const subscriptions = await prisma.userSubscription.findMany({
        where: {
          type: "COMPETITION",
          competitionId: { in: target.ids },
        },
        select: { userId: true },
      })
      users = subscriptions.map((s) => ({ id: s.userId }))
    } else if (target.type === "PLAYER" && target.ids) {
      const subscriptions = await prisma.userSubscription.findMany({
        where: {
          type: "PLAYER",
          playerId: { in: target.ids },
        },
        select: { userId: true },
      })
      users = subscriptions.map((s) => ({ id: s.userId }))
    }

    if (users.length === 0) {
      return NextResponse.json(
        { error: "No target users found" },
        { status: 400 }
      )
    }

    const uniqueUsers = Array.from(new Map(users.map((u) => [u.id, u])).values())

    const notifications = await prisma.notification.createMany({
      data: uniqueUsers.map((user) => ({
        userId: user.id,
        title,
        message,
        type: type as never,
        data: {
          broadcast: true,
          broadcastType: target?.type ?? "ALL",
          sentBy: session.user.id,
        },
        read: false,
      })),
    })

    try {
      const wsMessage = JSON.stringify({
        type: "NOTIFICATION",
        payload: { title, message, type },
      })

      await redis.publish("ws:notifications", wsMessage)
    } catch (redisError) {
      logger.warn("Failed to publish notification to Redis", {
        error: redisError instanceof Error ? redisError.message : "Unknown",
      })
    }

    return NextResponse.json({
      success: true,
      sent: notifications.count,
      totalUsers: uniqueUsers.length,
    })
  } catch (error) {
    logger.error("Failed to broadcast notification", { error })
    return NextResponse.json(
      { error: "Failed to broadcast notification" },
      { status: 500 }
    )
  }
}
