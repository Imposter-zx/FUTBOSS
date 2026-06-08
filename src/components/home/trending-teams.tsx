import Link from "next/link"
import { ArrowRight, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TeamCard {
  id: string
  name: string
  rank: number
  league: string
  trend: "up" | "down" | "stable"
  form: ("W" | "D" | "L")[]
}

interface TrendingTeamsProps {
  className?: string
}

const teams: TeamCard[] = [
  { id: "1", name: "Manchester City", rank: 1, league: "Premier League", trend: "up", form: ["W", "W", "W", "D", "W"] },
  { id: "2", name: "Real Madrid", rank: 2, league: "La Liga", trend: "up", form: ["W", "W", "W", "W", "W"] },
  { id: "3", name: "Bayern Munich", rank: 3, league: "Bundesliga", trend: "stable", form: ["W", "D", "W", "W", "L"] },
  { id: "4", name: "Inter Milan", rank: 4, league: "Serie A", trend: "up", form: ["W", "W", "D", "W", "W"] },
  { id: "5", name: "PSG", rank: 5, league: "Ligue 1", trend: "down", form: ["W", "L", "W", "D", "W"] },
  { id: "6", name: "Arsenal", rank: 6, league: "Premier League", trend: "up", form: ["W", "W", "W", "W", "D"] },
]

const formColors = {
  W: "bg-primary",
  D: "bg-accent",
  L: "bg-destructive",
}

const trendIcons = {
  up: "🔥",
  down: "📉",
  stable: "➡️",
}

export function TrendingTeams({ className }: TrendingTeamsProps) {
  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Trending Teams</h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/teams">
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {teams.map((team) => (
          <Link key={team.id} href={`/teams/${team.id}`}>
            <Card className="group cursor-pointer transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-lg">
                    ⚽
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {team.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">{team.league}</p>
                  </div>
                  <span className="text-sm">{trendIcons[team.trend]}</span>
                </div>
                <div className="mt-3 flex gap-1">
                  {team.form.map((result, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white",
                        formColors[result]
                      )}
                    >
                      {result}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
