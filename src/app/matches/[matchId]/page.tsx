import { Suspense } from "react"
import { notFound } from "next/navigation"
import { matchService } from "@/services/match.service"
import { MatchHeader } from "@/components/matches/match-header"
import { MatchTimeline } from "@/components/matches/match-timeline"
import { MatchStats } from "@/components/matches/match-stats"
import { MatchLineups } from "@/components/matches/match-lineups"
import { MatchCommentary } from "@/components/matches/match-commentary"
import { H2HTable } from "@/components/matches/h2h-table"
import { LiveIndicator } from "@/components/shared/live-indicator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import type { Match, MatchStatistics, MatchEvent, TimelineEntry, MatchTimeline as MatchTimelineType, HeadToHead, Lineup } from "@/types"

interface Props {
  params: Promise<{ matchId: string }>
}

async function MatchContent({ matchId }: { matchId: string }) {
  const matchResult = await matchService.findById(matchId)

  if (!matchResult.success || !matchResult.data) notFound()

  const match = matchResult.data as any

  const [timelineResult, statsResult, h2hResult] = await Promise.all([
    matchService.getMatchTimeline(matchId),
    matchService.getTeamStats(matchId),
    matchService.getHeadToHead(match.homeTeamId, match.awayTeamId, 5),
  ])

  const timelineData = timelineResult.success ? (timelineResult.data as unknown as MatchTimelineType) : null
  const matchStats = statsResult.success ? (statsResult.data as MatchStatistics) : null
  const h2h = h2hResult.success ? (h2hResult.data as HeadToHead) : null

  const isLive = match.status === "LIVE" || match.status === "HALF_TIME" || match.status === "EXTRA_TIME" || match.status === "PENALTIES"
  const isFinished = match.status === "FINISHED"
  const isUpcoming = match.status === "SCHEDULED"

  const headerStatus = isLive ? "live" as const : isFinished ? "finished" as const : "upcoming" as const

  const statCategories = matchStats
    ? [
        { label: "Possession", home: matchStats.ballPossession.home, away: matchStats.ballPossession.away, suffix: "%" },
        { label: "Total Shots", home: matchStats.totalShots.home, away: matchStats.totalShots.away },
        { label: "Shots on Target", home: matchStats.shotsOnTarget.home, away: matchStats.shotsOnTarget.away },
        { label: "Shots off Target", home: matchStats.shotsOffTarget.home, away: matchStats.shotsOffTarget.away },
        { label: "Blocked Shots", home: matchStats.blockedShots.home, away: matchStats.blockedShots.away },
        { label: "Corners", home: matchStats.corners.home, away: matchStats.corners.away },
        { label: "Offsides", home: matchStats.offsides.home, away: matchStats.offsides.away },
        { label: "Fouls", home: matchStats.fouls.home, away: matchStats.fouls.away },
        { label: "Yellow Cards", home: matchStats.yellowCards.home, away: matchStats.yellowCards.away },
        { label: "Red Cards", home: matchStats.redCards.home, away: matchStats.redCards.away },
        { label: "Saves", home: matchStats.saves.home, away: matchStats.saves.away },
        { label: "Passes", home: matchStats.passes.home, away: matchStats.passes.away },
        { label: "Pass Accuracy", home: matchStats.passAccuracy.home, away: matchStats.passAccuracy.away, suffix: "%" },
        { label: "Expected Goals (xG)", home: matchStats.expectedGoals.home, away: matchStats.expectedGoals.away },
      ]
    : []

  const timelineEvents = timelineData?.events.map((e: TimelineEntry, i: number) => ({
    id: `event-${i}`,
    minute: e.minute,
    type: (e.type === "GOAL" || e.type === "PENALTY_SCORED" ? "goal" :
           e.type === "YELLOW_CARD" ? "yellow_card" :
           e.type === "RED_CARD" || e.type === "SECOND_YELLOW" ? "red_card" :
           e.type === "SUBSTITUTION" ? "substitution" :
           e.type === "VAR" ? "var" :
           e.type === "PENALTY_MISSED" ? "penalty" :
           e.type === "OWN_GOAL" ? "own_goal" : "goal") as "goal" | "yellow_card" | "red_card" | "substitution" | "var" | "penalty" | "own_goal",
    team: e.teamId === match.homeTeamId ? "home" as const : "away" as const,
    player: e.playerName ?? "Unknown",
    detail: e.detail ?? undefined,
    isImportant: e.type === "GOAL" || e.type === "PENALTY_SCORED" || e.type === "RED_CARD",
  })) ?? []

  const commentaryEntries = timelineEvents.map((e) => ({
    id: e.id,
    minute: e.minute,
    text: e.player,
    type: (e.type === "goal" || e.type === "penalty" || e.type === "own_goal" ? "goal" :
           e.type === "yellow_card" || e.type === "red_card" ? "card" :
           e.type === "substitution" ? "substitution" :
           e.type === "var" ? "var" : "normal") as "goal" | "card" | "substitution" | "var" | "normal" | "highlight",
    team: e.team,
  }))

  const h2hMatches = h2h?.recentMatches.map((m) => ({
    id: m.id,
    date: m.date,
    competition: m.competition?.name ?? "",
    homeTeam: m.homeTeam?.name ?? "",
    awayTeam: m.awayTeam?.name ?? "",
    homeScore: m.homeScore ?? 0,
    awayScore: m.awayScore ?? 0,
  })) ?? []

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLive && <LiveIndicator size="lg" />}
          <Badge variant={isLive ? "live" : isFinished ? "finished" : "upcoming"} className="text-sm px-3 py-1">
            {isLive && match.minute ? `${match.minute}'` : isFinished ? "Full Time" : isUpcoming ? new Date(match.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : match.status}
          </Badge>
        </div>
        {match.competition && (
          <Badge variant="outline" className="text-xs">
            {match.competition.name} - {match.round ?? match.matchday ? `Matchday ${match.matchday}` : ""}
          </Badge>
        )}
      </div>

      <MatchHeader
        homeTeam={{ id: match.homeTeamId, name: match.homeTeam?.name ?? "Home", logo: match.homeTeam?.logo }}
        awayTeam={{ id: match.awayTeamId, name: match.awayTeam?.name ?? "Away", logo: match.awayTeam?.logo }}
        homeScore={match.homeScore}
        awayScore={match.awayScore}
        status={headerStatus}
        minute={match.minute ?? undefined}
        competition={{ id: match.competitionId, name: match.competition?.name ?? "Competition", logo: match.competition?.logo ?? undefined }}
        date={match.date}
        venue={match.venue ?? undefined}
        attendance={match.attendance ?? undefined}
        h2h={h2h ? { played: h2h.totalMatches, homeWins: h2h.team1Wins, awayWins: h2h.team2Wins, draws: h2h.draws } : undefined}
      />

      {timelineEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Match Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <MatchTimeline events={timelineEvents} />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="lineups">Lineups</TabsTrigger>
          <TabsTrigger value="commentary">Commentary</TabsTrigger>
          <TabsTrigger value="h2h">Head to Head</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-4">
          {statCategories.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <MatchStats
                  homeTeam={match.homeTeam?.name ?? "Home"}
                  awayTeam={match.awayTeam?.name ?? "Away"}
                  stats={statCategories}
                />
              </CardContent>
            </Card>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Match statistics not available</p>
          )}
        </TabsContent>

        <TabsContent value="lineups" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <MatchLineups
                  team={match.homeTeam?.name ?? "Home"}
                  formation="4-3-3"
                  starters={[]}
                  substitutes={[]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <MatchLineups
                  team={match.awayTeam?.name ?? "Away"}
                  formation="4-3-3"
                  starters={[]}
                  substitutes={[]}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="commentary" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {commentaryEntries.length > 0 ? (
                <MatchCommentary entries={commentaryEntries} isLive={isLive} />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">No commentary available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="h2h" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {h2hMatches.length > 0 ? (
                <H2HTable matches={h2hMatches} teamId={match.homeTeamId} />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">No head-to-head history available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { matchId } = await params
  const result = await matchService.findById(matchId)
  if (result.success) {
    const match = result.data as Match
    const home = match.homeTeam?.name ?? "Home"
    const away = match.awayTeam?.name ?? "Away"
    const score = match.homeScore !== null ? `${match.homeScore} - ${match.awayScore}` : "vs"
    return {
      title: `${home} ${score} ${away}`,
      description: `Follow ${home} vs ${away} live - ${match.competition?.name ?? "Football"} match with live scores, stats, and commentary`,
    }
  }
  return { title: "Match Not Found" }
}

export default async function MatchPage({ params }: Props) {
  const { matchId } = await params
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <MatchContent matchId={matchId} />
    </Suspense>
  )
}
