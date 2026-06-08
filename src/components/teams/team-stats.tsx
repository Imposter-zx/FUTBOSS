"use client"

import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

interface TeamStat {
  label: string
  value: string | number
  type?: "default" | "percentage" | "progress"
  progress?: number
  trend?: "up" | "down" | "neutral"
}

interface TeamStatsProps {
  stats: TeamStat[]
  className?: string
}

export function TeamStats({ stats, className }: TeamStatsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4", className)}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/20"
        >
          <p className="text-xs text-muted-foreground">{stat.label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
          {stat.type === "progress" && stat.progress !== undefined && (
            <Progress value={stat.progress} className="mt-2 h-1.5" />
          )}
          {stat.trend && (
            <span className={cn(
              "mt-1 inline-flex text-xs font-medium",
              stat.trend === "up" && "text-primary",
              stat.trend === "down" && "text-destructive",
              stat.trend === "neutral" && "text-muted-foreground"
            )}>
              {stat.trend === "up" && "↑"} {stat.trend === "down" && "↓"} {stat.trend === "neutral" && "→"}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
