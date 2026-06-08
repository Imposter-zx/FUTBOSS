"use client"

import { cn } from "@/lib/utils"
import { MatchCard, type MatchData } from "@/components/matches/match-card"

interface ResultsListProps {
  results: MatchData[]
  className?: string
}

export function ResultsList({ results, className }: ResultsListProps) {
  const grouped = results.reduce<Record<string, MatchData[]>>((acc, match) => {
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
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} variant="compact" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
