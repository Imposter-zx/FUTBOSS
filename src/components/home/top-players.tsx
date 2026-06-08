import Link from "next/link"
import { ArrowRight, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PlayerCard } from "@/components/players/player-card"

interface TopPlayersProps {
  className?: string
}

const topPlayers = [
  { id: "1", name: "Erling Haaland", position: "Forward", number: 9, team: { id: "1", name: "Manchester City" }, nationality: "Norway", age: 24, rating: 9.2 },
  { id: "2", name: "Kylian Mbappé", position: "Forward", number: 7, team: { id: "2", name: "Real Madrid" }, nationality: "France", age: 26, rating: 9.1 },
  { id: "3", name: "Jude Bellingham", position: "Midfielder", number: 5, team: { id: "2", name: "Real Madrid" }, nationality: "England", age: 22, rating: 8.9 },
  { id: "4", name: "Vinícius Jr.", position: "Forward", number: 7, team: { id: "2", name: "Real Madrid" }, nationality: "Brazil", age: 25, rating: 8.8 },
  { id: "5", name: "Rodri", position: "Midfielder", number: 16, team: { id: "1", name: "Manchester City" }, nationality: "Spain", age: 29, rating: 8.9 },
]

export function TopPlayers({ className }: TopPlayersProps) {
  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-accent" />
          <h2 className="text-2xl font-bold text-foreground">Top Players</h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/players">
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {topPlayers.map((player) => (
          <PlayerCard key={player.id} {...player} variant="compact" />
        ))}
      </div>
    </section>
  )
}
