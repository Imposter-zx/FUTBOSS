import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { StandingsTable } from "@/components/competitions/standings-table"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { competitionService } from "@/services/competition.service"
import type { Competition, Standing } from "@/types"

interface Props {
  params: Promise<{ competitionId: string }>
}

async function StandingsContent({ competitionId }: { competitionId: string }) {
  const [compResult, standingsResult] = await Promise.all([
    competitionService.findBySlug(competitionId),
    competitionService.getStandings(competitionId),
  ])

  if (!compResult.success || !compResult.data) notFound()

  const competition = compResult.data as Competition
  const standings = standingsResult.success ? (standingsResult.data as Standing[]) : []

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link
          href={`/competitions/${competitionId}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{competition.name}</h1>
          <p className="text-sm text-muted-foreground">{competition.season} Season - Standings</p>
        </div>
      </div>

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
        <p className="py-12 text-center text-sm text-muted-foreground">Standings are not available yet for this competition.</p>
      )}
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { competitionId } = await params
  const result = await competitionService.findBySlug(competitionId)
  if (result.success) {
    const comp = result.data as Competition
    return { title: `${comp.name} Standings - ${comp.season}` }
  }
  return { title: "Standings" }
}

export default async function StandingsPage({ params }: Props) {
  const { competitionId } = await params
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <StandingsContent competitionId={competitionId} />
    </Suspense>
  )
}
