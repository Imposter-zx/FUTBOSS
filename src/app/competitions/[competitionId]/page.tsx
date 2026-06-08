import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Trophy, Globe, Calendar } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { StandingsTable } from "@/components/competitions/standings-table"
import { FixturesList } from "@/components/competitions/fixtures-list"
import { ResultsList } from "@/components/competitions/results-list"
import { TopScorersTable } from "@/components/competitions/top-scorers-table"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { competitionService } from "@/services/competition.service"
import type { Competition, Standing, Match } from "@/types"
import type { MatchData } from "@/components/matches/match-card"

interface Props {
  params: Promise<{ competitionId: string }>
}

async function CompetitionContent({ competitionId }: { competitionId: string }) {
  const [compResult, standingsResult, fixturesResult, resultsResult, scorersResult, statsResult] =
    await Promise.all([
      competitionService.findBySlug(competitionId),
      competitionService.getStandings(competitionId),
      competitionService.getFixtures(competitionId, { page: 1, pageSize: 10 }),
      competitionService.getResults(competitionId, { page: 1, pageSize: 10 }),
      competitionService.getTopScorers(competitionId, 10),
      competitionService.getCompetitionStats(competitionId),
    ])

  if (!compResult.success || !compResult.data) notFound()

  const competition = compResult.data as Competition
  const standings = standingsResult.success ? (standingsResult.data as Standing[]) : []
  const fixturesData = fixturesResult.success ? (fixturesResult.data as { items: MatchData[] }) : null
  const resultsData = resultsResult.success ? (resultsResult.data as { items: MatchData[] }) : null
  const topScorers = scorersResult.success ? (scorersResult.data as Array<{ playerId: string; playerName: string; teamId: string; teamName: string; goals: number; assists: number; matchesPlayed: number }>) : []
  const stats = statsResult.success ? (statsResult.data as Record<string, unknown>) : null

  return (
    <div className="space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-background to-surface p-6 sm:p-8">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-16 -translate-y-16 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 shadow-xl ring-1 ring-border">
            <Trophy className="h-10 w-10 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{competition.name}</h1>
            <p className="text-sm text-muted-foreground">{competition.shortName}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Globe className="h-3 w-3" /> {competition.country}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" /> {competition.season}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {competition.type}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats ? (stats.totalMatches as number) : "-"}</p>
          <p className="text-xs text-muted-foreground">Matches</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats ? (stats.totalGoals as number) : "-"}</p>
          <p className="text-xs text-muted-foreground">Goals</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats ? (stats.averageGoals as number)?.toFixed(2) : "-"}</p>
          <p className="text-xs text-muted-foreground">Avg Goals</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{standings.length}</p>
          <p className="text-xs text-muted-foreground">Teams</p>
        </div>
      </div>

      <Tabs defaultValue="standings" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="standings">Standings</TabsTrigger>
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="scorers">Top Scorers</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="standings" className="mt-4">
          {standings.length > 0 ? (
            <StandingsTable
              standings={standings.map((s) => ({
                position: s.position,
                teamId: s.teamId,
                teamName: s.team?.name ?? "Unknown",
                played: s.played,
                won: s.won,
                drawn: s.drawn,
                lost: s.lost,
                goalsFor: s.goalsFor,
                goalsAgainst: s.goalsAgainst,
                goalDifference: s.goalDifference,
                points: s.points,
                form: s.form,
              }))}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Standings not available yet</p>
          )}
        </TabsContent>

        <TabsContent value="fixtures" className="mt-4">
          {fixturesData?.items?.length ? (
            <FixturesList fixtures={fixturesData.items} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No upcoming fixtures</p>
          )}
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          {resultsData?.items?.length ? (
            <ResultsList results={resultsData.items} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No results yet</p>
          )}
        </TabsContent>

        <TabsContent value="scorers" className="mt-4">
          {topScorers.length > 0 ? (
            <TopScorersTable
              scorers={topScorers.map((s, i) => ({
                position: i + 1,
                playerId: s.playerId,
                playerName: s.playerName,
                teamId: s.teamId,
                teamName: s.teamName,
                goals: s.goals,
                assists: s.assists,
                matchesPlayed: s.matchesPlayed,
              }))}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Top scorers not available</p>
          )}
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          {stats ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{String(value ?? "-")}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Statistics not available</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { competitionId } = await params
  const result = await competitionService.findBySlug(competitionId)
  if (result.success) {
    const comp = result.data as Competition
    return {
      title: `${comp.name} - ${comp.season}`,
      description: `Follow ${comp.name} ${comp.season} - standings, fixtures, results, top scorers, and statistics`,
    }
  }
  return { title: "Competition Not Found" }
}

export default async function CompetitionPage({ params }: Props) {
  const { competitionId } = await params
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <CompetitionContent competitionId={competitionId} />
    </Suspense>
  )
}
