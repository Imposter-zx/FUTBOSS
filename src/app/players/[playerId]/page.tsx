import { Suspense } from "react"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Calendar, Flag, Ruler, Weight, Footprints, DollarSign, BadgeCheck } from "lucide-react"
import { playerService } from "@/services/player.service"
import { PlayerStats } from "@/components/players/player-stats"
import { PlayerRatings } from "@/components/players/player-ratings"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { MatchList } from "@/components/matches/match-list"
import type { Player, PlayerStats as PlayerStatsType } from "@/types"
import type { MatchData } from "@/components/matches/match-card"

interface Props {
  params: Promise<{ playerId: string }>
}

async function PlayerContent({ playerId }: { playerId: string }) {
  const [playerResult, metricsResult, matchHistoryResult, ratingsResult] = await Promise.all([
    playerService.findBySlug(playerId),
    playerService.getPerformanceMetrics(playerId),
    playerService.getMatchHistory(playerId, 8),
    playerService.getPlayerRatings(playerId),
  ])

  if (!playerResult.success || !playerResult.data) notFound()

  const player = playerResult.data as Player
  const metrics = metricsResult.success ? (metricsResult.data as Record<string, unknown>) : null
  const matchHistory = matchHistoryResult.success ? (matchHistoryResult.data as MatchData[]) : []
  const ratings = ratingsResult.success ? (ratingsResult.data as Array<{ matchId: string; matchDate: string; opponent: string; rating: number; isHome: boolean }>) : []

  const age = Math.floor((new Date().getTime() - new Date(player.dateOfBirth).getTime()) / 31557600000)
  const marketValueFormatted = player.marketValue
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(player.marketValue)
    : "N/A"

  const stats: Array<{ label: string; value: string | number; suffix?: string; percentile?: number }> = [
    { label: "Goals", value: player.stats?.goals ?? 0 },
    { label: "Assists", value: player.stats?.assists ?? 0 },
    { label: "Appearances", value: player.stats?.appearances ?? 0 },
    { label: "Minutes Played", value: player.stats?.minutesPlayed ?? 0 },
    { label: "Pass Accuracy", value: player.stats?.passAccuracy ?? 0, suffix: "%", percentile: Math.min(Math.round((player.stats?.passAccuracy ?? 0) * 10), 100) },
    { label: "Tackles", value: player.stats?.tackles ?? 0 },
    { label: "Interceptions", value: player.stats?.interceptions ?? 0 },
    { label: "Dribbles", value: player.stats?.dribbles ?? 0 },
    { label: "Yellow Cards", value: player.stats?.yellowCards ?? 0 },
    { label: "Red Cards", value: player.stats?.redCards ?? 0 },
    { label: "Rating", value: player.stats?.rating?.toFixed(1) ?? "-" },
    { label: "Market Value", value: marketValueFormatted },
  ]

  const playerRatings = ratings.map((r) => ({
    matchId: r.matchId,
    matchDate: r.matchDate,
    opponent: r.opponent,
    rating: r.rating,
    isHome: r.isHome,
  }))

  return (
    <div className="space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-background to-surface p-6 sm:p-8">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-16 -translate-y-16 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
          <Avatar className="h-28 w-28 shrink-0 ring-4 ring-border">
            {player.image && <AvatarImage src={player.image} />}
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-3xl font-bold text-foreground">
              {player.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{player.name}</h1>
              <p className="text-sm text-muted-foreground">
                {player.firstName} {player.lastName}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">{player.position}</Badge>
              {player.shirtNumber && <Badge variant="outline" className="text-xs">#{player.shirtNumber}</Badge>}
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Flag className="h-3 w-3" /> {player.nationality}
              </Badge>
              {player.foot && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <Footprints className="h-3 w-3" /> {player.foot === "BOTH" ? "Both" : player.foot}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(player.dateOfBirth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} ({age} yrs)
              </span>
              {player.height && (
                <span className="flex items-center gap-1">
                  <Ruler className="h-3.5 w-3.5" /> {player.height} cm
                </span>
              )}
              {player.weight && (
                <span className="flex items-center gap-1">
                  <Weight className="h-3.5 w-3.5" /> {player.weight} kg
                </span>
              )}
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-primary" /> {marketValueFormatted}
              </span>
            </div>
            {player.team && (
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium text-foreground">{player.team.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <PlayerStats stats={stats} columns={4} />

      {playerRatings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Match Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerRatings ratings={playerRatings} />
          </CardContent>
        </Card>
      )}

      {matchHistory.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Recent Matches</h2>
          <MatchList
            groups={[{ competitionId: "recent", competitionName: "Recent Matches", matches: matchHistory }]}
            variant="compact"
          />
        </div>
      )}
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { playerId } = await params
  const result = await playerService.findBySlug(playerId)
  if (result.success) {
    const player = result.data as Player
    return {
      title: player.name,
      description: `Follow ${player.name} - stats, ratings, match history, and market value for ${player.team?.name ?? "Unknown team"}`,
    }
  }
  return { title: "Player Not Found" }
}

export default async function PlayerPage({ params }: Props) {
  const { playerId } = await params
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <PlayerContent playerId={playerId} />
    </Suspense>
  )
}
