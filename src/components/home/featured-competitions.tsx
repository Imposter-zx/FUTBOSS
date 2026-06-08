import Link from "next/link"
import { Trophy, Shield, Globe, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CompetitionCard } from "@/components/competitions/competition-card"

interface FeaturedCompetitionsProps {
  className?: string
}

const featured = [
  { id: "1", name: "Premier League", country: "England", season: "2025/26", teamCount: 20 },
  { id: "2", name: "La Liga", country: "Spain", season: "2025/26", teamCount: 20 },
  { id: "3", name: "Serie A", country: "Italy", season: "2025/26", teamCount: 20 },
  { id: "4", name: "Bundesliga", country: "Germany", season: "2025/26", teamCount: 18 },
  { id: "5", name: "Ligue 1", country: "France", season: "2025/26", teamCount: 18 },
  { id: "6", name: "UEFA Champions League", country: "Europe", season: "2025/26", teamCount: 32 },
]

export function FeaturedCompetitions({ className }: FeaturedCompetitionsProps) {
  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Featured Competitions</h2>
          <p className="text-sm text-muted-foreground">Follow the world&apos;s biggest leagues</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/competitions">
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {featured.map((comp) => (
          <CompetitionCard key={comp.id} {...comp} />
        ))}
      </div>
    </section>
  )
}
