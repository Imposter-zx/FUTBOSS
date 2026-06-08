import { Suspense } from "react"
import { notFound } from "next/navigation"
import { teamService } from "@/services/team.service"
import { TeamHeader } from "@/components/teams/team-header"
import { SquadList } from "@/components/teams/squad-list"
import { TeamStats } from "@/components/teams/team-stats"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { MatchList } from "@/components/matches/match-list"
import type { Team, Player } from "@/types"
import type { MatchData } from "@/components/matches/match-card"

interface Props {
  params: Promise<{ teamId: string }>
}

async function TeamContent({ teamId }: { teamId: string }) {
  const [teamResult, squadResult, recentResult, upcomingResult, statsResult, scorersResult, positionResult] =
    await Promise.all([
      teamService.findBySlug(teamId),
      teamService.getSquad(teamId),
      teamService.getRecentMatches(teamId, 8),
      teamService.getUpcomingMatches(teamId, 8),
      teamService.getTeamStats(teamId),
      teamService.getTopScorers(teamId, 5),
      teamService.getLeaguePosition(teamId),
    ])

  if (!teamResult.success || !teamResult.data) notFound()

  const team = teamResult.data as Team
  const squad = squadResult.success ? (squadResult.data as Player[]) : []
  const recentMatches = recentResult.success ? (recentResult.data as MatchData[]) : []
  const upcomingMatches = upcomingResult.success ? (upcomingResult.data as MatchData[]) : []
  const teamStats = statsResult.success ? (statsResult.data as Record<string, unknown>) : null
  const topScorers = scorersResult.success ? (scorersResult.data as Array<{ playerId: string; playerName: string; goals: number }>) : []
  const leaguePosition = positionResult.success ? (positionResult.data as { position: number; competitionName: string } | null) : null

  const squadPlayers = squad.map((p) => ({
    id: p.id,
    name: p.name,
    number: p.shirtNumber ?? 0,
    position: p.position,
    nationality: p.nationality,
    age: Math.floor((new Date().getTime() - new Date(p.dateOfBirth).getTime()) / 31557600000),
    rating: p.stats?.rating ?? undefined,
  }))

  const statsArray = teamStats
    ? Object.entries(teamStats).map(([key, value]) => ({
        label: key.replace(/([A-Z])/g, " $1").trim(),
        value: String(value ?? "-"),
      }))
    : []

  return (
    <div className="space-y-6 pb-12">
      <TeamHeader
        id={team.id}
        name={team.name}
        country={team.country}
        founded={team.founded ?? undefined}
        stadium={team.venue ?? undefined}
        league={team.competition?.name}
      />

      {leaguePosition && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
            #{leaguePosition.position}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Current Position</p>
            <p className="text-xs text-muted-foreground">{leaguePosition.competitionName}</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="squad" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="squad">Squad</TabsTrigger>
          <TabsTrigger value="recent">Recent Matches</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Matches</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="squad" className="mt-4">
          {squadPlayers.length > 0 ? (
            <SquadList players={squadPlayers} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Squad information not available</p>
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-4">
          {recentMatches.length > 0 ? (
            <MatchList
              groups={[{ competitionId: "recent", competitionName: "Recent Matches", matches: recentMatches }]}
              variant="compact"
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No recent matches</p>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          {upcomingMatches.length > 0 ? (
            <MatchList
              groups={[{ competitionId: "upcoming", competitionName: "Upcoming Matches", matches: upcomingMatches }]}
              variant="compact"
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No upcoming matches</p>
          )}
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          {statsArray.length > 0 ? (
            <div className="space-y-6">
              <TeamStats stats={statsArray} />
              {topScorers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Scorers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {topScorers.map((s, i) => (
                        <div key={s.playerId} className="flex items-center justify-between rounded-lg bg-surface/50 px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>
                            <span className="text-sm text-foreground">{s.playerName}</span>
                          </div>
                          <span className="text-sm font-bold text-primary">{s.goals} goals</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Team statistics not available</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { teamId } = await params
  const result = await teamService.findBySlug(teamId)
  if (result.success) {
    const team = result.data as Team
    return {
      title: team.name,
      description: `Follow ${team.name} - squad, fixtures, results, and statistics`,
    }
  }
  return { title: "Team Not Found" }
}

export default async function TeamPage({ params }: Props) {
  const { teamId } = await params
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <TeamContent teamId={teamId} />
    </Suspense>
  )
}
