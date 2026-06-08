import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { FixturesList } from "@/components/competitions/fixtures-list"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { competitionService } from "@/services/competition.service"
import type { Competition } from "@/types"
import type { MatchData } from "@/components/matches/match-card"

interface Props {
  params: Promise<{ competitionId: string }>
}

async function FixturesContent({ competitionId }: { competitionId: string }) {
  const [compResult, fixturesResult] = await Promise.all([
    competitionService.findBySlug(competitionId),
    competitionService.getFixtures(competitionId, { page: 1, pageSize: 50 }),
  ])

  if (!compResult.success || !compResult.data) notFound()

  const competition = compResult.data as Competition
  const fixturesData = fixturesResult.success ? (fixturesResult.data as { items: MatchData[] }) : null
  const fixtures = fixturesData?.items ?? []

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
          <p className="text-sm text-muted-foreground">{competition.season} Season - Fixtures</p>
        </div>
      </div>

      {fixtures.length > 0 ? (
        <FixturesList fixtures={fixtures} />
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">No upcoming fixtures for this competition.</p>
      )}
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { competitionId } = await params
  const result = await competitionService.findBySlug(competitionId)
  if (result.success) {
    const comp = result.data as Competition
    return { title: `${comp.name} Fixtures - ${comp.season}` }
  }
  return { title: "Fixtures" }
}

export default async function FixturesPage({ params }: Props) {
  const { competitionId } = await params
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <FixturesContent competitionId={competitionId} />
    </Suspense>
  )
}
