"use client"

import { cn } from "@/lib/utils"
import { MatchCard, type MatchData } from "@/components/matches/match-card"

interface FixturesListProps {
  fixtures: MatchData[]
  className?: string
}

export function FixturesList({ fixtures, className }: FixturesListProps) {
  const grouped = fixtures.reduce<Record<string, MatchData[]>>((acc, match) => {
    const dateKey = new Date(match.date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey]!.push(match)
    return acc
  }, {})

  return (
    <div className={cn("space-y-6", className)}>
      {Object.entries(grouped).map(([date, matches]) => (
        <div key={date}>
          <h3 className="mb-3 text-sm font-semibold text-foreground">{date}</h3>
          <div className="space-y-2">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} variant="compact" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
