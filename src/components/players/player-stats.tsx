"use client"

import { cn } from "@/lib/utils"

interface PlayerStat {
  label: string
  value: string | number
  suffix?: string
  icon?: string
  percentile?: number
}

interface PlayerStatsProps {
  stats: PlayerStat[]
  className?: string
  columns?: 2 | 3 | 4
}

export function PlayerStats({ stats, className, columns = 4 }: PlayerStatsProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }

  return (
    <div className={cn("grid gap-3", gridCols[columns], className)}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/20"
        >
          <p className="text-xs text-muted-foreground">{stat.label}</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground">{stat.value}</span>
            {stat.suffix && <span className="text-sm text-muted-foreground">{stat.suffix}</span>}
          </div>
          {stat.percentile !== undefined && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Percentile</span>
                <span>{stat.percentile}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-light/30">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-700"
                  style={{ width: `${stat.percentile}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
