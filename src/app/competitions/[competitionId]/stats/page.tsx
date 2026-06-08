import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ArrowLeft, TrendingUp, Target, Shield, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { competitionService } from "@/services/competition.service"
import type { Competition, CompetitionStats } from "@/types"

interface Props {
  params: Promise<{ competitionId: string }>
}

async function StatsContent({ competitionId }: { competitionId: string }) {
  const [compResult, statsResult] = await Promise.all([
    competitionService.findBySlug(competitionId),
    competitionService.getCompetitionStats(competitionId),
  ])

  if (!compResult.success || !compResult.data) notFound()

  const competition = compResult.data as Competition
  const stats = statsResult.success ? (statsResult.data as CompetitionStats) : null

  if (!stats) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center gap-4">
          <Link href={`/competitions/${competitionId}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{competition.name}</h1>
            <p className="text-sm text-muted-foreground">Statistics</p>
          </div>
        </div>
        <p className="py-12 text-center text-sm text-muted-foreground">Statistics not available yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href={`/competitions/${competitionId}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{competition.name}</h1>
          <p className="text-sm text-muted-foreground">{competition.season} Season - Statistics</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMatches}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGoals}</div>
            <p className="text-xs text-muted-foreground">{stats.averageGoals.toFixed(2)} per match</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Yellow Cards</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalYellowCards}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Red Cards</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRedCards}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Scorer</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topScorer ? (
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {stats.topScorer.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{stats.topScorer.name}</p>
                  <p className="text-sm text-muted-foreground">{stats.topScorer.team?.name}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">N/A</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Possession</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.averagePossession.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { competitionId } = await params
  const result = await competitionService.findBySlug(competitionId)
  if (result.success) {
    const comp = result.data as Competition
    return { title: `${comp.name} Statistics - ${comp.season}` }
  }
  return { title: "Statistics" }
}

export default async function StatsPage({ params }: Props) {
  const { competitionId } = await params
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <StatsContent competitionId={competitionId} />
    </Suspense>
  )
}
