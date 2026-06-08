"use client"

import { cn } from "@/lib/utils"

interface StatCategory {
  label: string
  home: number
  away: number
  suffix?: string
}

interface MatchStatsProps {
  homeTeam: string
  awayTeam: string
  stats: StatCategory[]
  className?: string
}

function StatBar({ home, away }: { home: number; away: number }) {
  const total = home + away
  const homePercent = total > 0 ? (home / total) * 100 : 50
  const awayPercent = total > 0 ? (away / total) * 100 : 50

  return (
    <div className="flex h-2 w-full gap-0.5 rounded-full bg-surface-light/20">
      <div
        className="rounded-l-full bg-primary transition-all duration-700"
        style={{ width: `${homePercent}%` }}
      />
      <div
        className="rounded-r-full bg-secondary transition-all duration-700"
        style={{ width: `${awayPercent}%` }}
      />
    </div>
  )
}

export function MatchStats({ homeTeam, awayTeam, stats, className }: MatchStatsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between px-2">
        <span className="text-sm font-semibold text-foreground">{homeTeam}</span>
        <span className="text-xs text-muted-foreground">Stats</span>
        <span className="text-sm font-semibold text-foreground">{awayTeam}</span>
      </div>
      <div className="space-y-3">
        {stats.map((stat) => (
          <div key={stat.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="w-16 text-right font-semibold text-foreground tabular-nums">
                {stat.home}{stat.suffix ?? ""}
              </span>
              <span className="text-center text-muted-foreground">{stat.label}</span>
              <span className="w-16 font-semibold text-foreground tabular-nums">
                {stat.away}{stat.suffix ?? ""}
              </span>
            </div>
            <StatBar home={stat.home} away={stat.away} />
          </div>
        ))}
      </div>
    </div>
  )
}
