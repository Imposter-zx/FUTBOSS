import { Suspense } from "react"
import { HeroSection } from "@/components/home/hero-section"
import { FeaturedCompetitions } from "@/components/home/featured-competitions"
import { TrendingTeams } from "@/components/home/trending-teams"
import { TopPlayers } from "@/components/home/top-players"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { MatchList } from "@/components/matches/match-list"
import { matchService } from "@/services/match.service"
import type { MatchData } from "@/components/matches/match-card"

function SectionSkeleton() {
  return (
    <div className="flex h-48 items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}

async function LiveMatchesSection() {
  const result = await matchService.getLiveMatches()
  const matches = result.success ? (result.data as MatchData[]) : []

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
        </span>
        <h2 className="text-2xl font-bold text-foreground">Live Matches</h2>
      </div>
      {matches.length > 0 ? (
        <MatchList
          groups={[{ competitionId: "live", competitionName: "Live Now", matches }]}
          layout="horizontal"
          variant="default"
        />
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">No live matches at the moment</p>
      )}
    </section>
  )
}

async function UpcomingMatchesSection() {
  const result = await matchService.getUpcomingMatches({ page: 1, pageSize: 8 })
  const matches = result.success
    ? ((result.data as { items: MatchData[] }).items ?? [])
    : []

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Upcoming Matches</h2>
      {matches.length > 0 ? (
        <MatchList
          groups={[{ competitionId: "upcoming", competitionName: "Upcoming", matches }]}
          layout="horizontal"
          variant="compact"
        />
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">No upcoming matches scheduled</p>
      )}
    </section>
  )
}

async function FinishedMatchesSection() {
  const result = await matchService.getFinishedMatches({ page: 1, pageSize: 8 })
  const matches = result.success
    ? ((result.data as { items: MatchData[] }).items ?? [])
    : []

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Recent Results</h2>
      {matches.length > 0 ? (
        <MatchList
          groups={[{ competitionId: "finished", competitionName: "Just Finished", matches }]}
          layout="horizontal"
          variant="default"
        />
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">No recent results</p>
      )}
    </section>
  )
}

export default function HomePage() {
  return (
    <div className="space-y-12 pb-12">
      <Suspense fallback={<SectionSkeleton />}>
        <HeroSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <LiveMatchesSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <UpcomingMatchesSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <FinishedMatchesSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedCompetitions />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <TrendingTeams />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <TopPlayers />
      </Suspense>
    </div>
  )
}
