import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ResultsList } from "@/components/competitions/results-list"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { competitionService } from "@/services/competition.service"
import type { Competition } from "@/types"
import type { MatchData } from "@/components/matches/match-card"

interface Props {
  params: Promise<{ competitionId: string }>
}

async function ResultsContent({ competitionId }: { competitionId: string }) {
  const [compResult, resultsResult] = await Promise.all([
    competitionService.findBySlug(competitionId),
    competitionService.getResults(competitionId, { page: 1, pageSize: 50 }),
  ])

  if (!compResult.success || !compResult.data) notFound()

  const competition = compResult.data as Competition
  const resultsData = resultsResult.success ? (resultsResult.data as { items: MatchData[] }) : null
  const results = resultsData?.items ?? []

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
          <p className="text-sm text-muted-foreground">{competition.season} Season - Results</p>
        </div>
      </div>

      {results.length > 0 ? (
        <ResultsList results={results} />
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">No results available for this competition yet.</p>
      )}
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { competitionId } = await params
  const result = await competitionService.findBySlug(competitionId)
  if (result.success) {
    const comp = result.data as Competition
    return { title: `${comp.name} Results - ${comp.season}` }
  }
  return { title: "Results" }
}

export default async function ResultsPage({ params }: Props) {
  const { competitionId } = await params
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <ResultsContent competitionId={competitionId} />
    </Suspense>
  )
}
