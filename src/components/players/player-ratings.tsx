"use client"

import { cn } from "@/lib/utils"

interface RatingEntry {
  matchId: string
  matchDate: string
  opponent: string
  rating: number
  isHome: boolean
}

interface PlayerRatingsProps {
  ratings: RatingEntry[]
  className?: string
}

export function PlayerRatings({ ratings, className }: PlayerRatingsProps) {
  const sorted = [...ratings].sort(
    (a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
  )
  const average =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-primary"
    if (rating >= 7) return "text-secondary"
    if (rating >= 6) return "text-accent"
    return "text-destructive"
  }

  const getRatingBg = (rating: number) => {
    if (rating >= 8) return "bg-primary"
    if (rating >= 7) return "bg-secondary"
    if (rating >= 6) return "bg-accent"
    return "bg-destructive"
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">{average.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">Avg Rating</p>
        </div>
        <div className="flex-1">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
              <div
                key={star}
                className={cn(
                  "h-2 flex-1 rounded-full transition-colors",
                  star <= Math.round(average) ? getRatingBg(average) : "bg-surface-light/30"
                )}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        {sorted.map((entry) => (
          <div
            key={entry.matchId}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 transition-colors hover:bg-surface/50"
          >
            <span className="w-16 text-xs text-muted-foreground tabular-nums">
              {new Date(entry.matchDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
            </span>
            <div className="flex-1 text-sm text-foreground">
              <span className={entry.isHome ? "text-primary" : "text-secondary"}>
                {entry.opponent}
              </span>
            </div>
            <span className={cn("text-sm font-bold tabular-nums", getRatingColor(entry.rating))}>
              {entry.rating.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
