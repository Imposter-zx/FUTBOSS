import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      totalMatches,
      totalTeams,
      totalCompetitions,
      activeUsers,
      liveMatches,
      recentMatches,
      userGrowthData,
      matchesByCompetition,
      popularCompetitions,
      popularTeams,
      totalNotifications,
      pageViews,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.match.count(),
      prisma.team.count(),
      prisma.competition.count(),
      prisma.user.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.match.count({
        where: { status: "LIVE" },
      }),
      prisma.match.findMany({
        take: 5,
        orderBy: { date: "desc" },
        include: {
          competition: { select: { id: true, name: true, slug: true } },
          homeTeam: { select: { id: true, name: true, slug: true, logo: true } },
          awayTeam: { select: { id: true, name: true, slug: true, logo: true } },
        },
      }),
      prisma.user.groupBy({
        by: ["createdAt"],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.match.groupBy({
        by: ["competitionId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.match.groupBy({
        by: ["competitionId"],
        where: { status: "LIVE" },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      prisma.match.groupBy({
        by: ["homeTeamId", "awayTeamId"],
        where: { status: { in: ["LIVE", "FINISHED"] } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      prisma.notification.count(),
      0,
    ])

    const competitionIds = matchesByCompetition.map((m) => m.competitionId)
    const competitions = competitionIds.length > 0
      ? await prisma.competition.findMany({
          where: { id: { in: competitionIds } },
          select: { id: true, name: true },
        })
      : []
    const competitionMap = new Map(competitions.map((c) => [c.id, c.name]))

    const userGrowthMap = new Map<string, number>()
    userGrowthData.forEach((entry) => {
      const dateKey = entry.createdAt.toISOString().split("T")[0]!
      userGrowthMap.set(dateKey, (userGrowthMap.get(dateKey) ?? 0) + entry._count.id)
    })

    const userGrowth = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(thirtyDaysAgo)
      date.setDate(date.getDate() + i)
      const dateKey = date.toISOString().split("T")[0]!
      return {
        date: dateKey,
        count: userGrowthMap.get(dateKey) ?? 0,
      }
    })

    return NextResponse.json({
      totalUsers,
      totalMatches,
      totalTeams,
      totalCompetitions,
      activeUsers,
      liveMatches,
      recentMatches,
      userGrowth,
      matchesByCompetition: matchesByCompetition.map((m) => ({
        competitionId: m.competitionId,
        competitionName: competitionMap.get(m.competitionId) ?? "Unknown",
        count: m._count.id,
      })),
      popularCompetitions,
      popularTeams,
      totalNotifications,
      pageViews,
    })
  } catch (error) {
    logger.error("Failed to fetch analytics", { error })
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    )
  }
}
