import Link from "next/link"
import { Suspense } from "react"
import { Trophy, Search } from "lucide-react"
import { competitionService } from "@/services/competition.service"
import { CompetitionCard } from "@/components/competitions/competition-card"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import type { Competition } from "@/types"

async function CompetitionsList() {
  const result = await competitionService.findActive()
  const competitions = result.success ? (result.data as Competition[]) : []

  if (competitions.length === 0) {
    return (
      <EmptyState
        icon={<Trophy className="h-16 w-16" />}
        title="No competitions found"
        description="Check back later for active competitions."
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {competitions.map((comp) => (
        <CompetitionCard
          key={comp.id}
          id={comp.id}
          name={comp.name}
          country={comp.country}
          season={comp.season}
          teamCount={comp.teams?.length}
        />
      ))}
    </div>
  )
}

export default function CompetitionsPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Competitions</h1>
          <p className="text-sm text-muted-foreground">
            Browse all football competitions from around the world
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search competitions..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href="/competitions"
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground"
        >
          All
        </Link>
        <Link
          href="/competitions?type=league"
          className="rounded-full bg-surface px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Leagues
        </Link>
        <Link
          href="/competitions?type=cup"
          className="rounded-full bg-surface px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Cups
        </Link>
        <Link
          href="/competitions?type=international"
          className="rounded-full bg-surface px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          International
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <CompetitionsList />
      </Suspense>
    </div>
  )
}
