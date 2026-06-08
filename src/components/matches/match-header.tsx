"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { LiveIndicator } from "@/components/shared/live-indicator"

interface MatchHeaderProps {
  homeTeam: { id: string; name: string; logo?: string }
  awayTeam: { id: string; name: string; logo?: string }
  homeScore: number | null
  awayScore: number | null
  status: "live" | "finished" | "upcoming" | "halftime" | "extratime" | "penalties"
  minute?: number
  competition: { id: string; name: string; logo?: string }
  date: string
  venue?: string
  attendance?: number
  h2h?: { played: number; homeWins: number; awayWins: number; draws: number }
  className?: string
}

export function MatchHeader({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
  minute,
  competition,
  date,
  venue,
  attendance,
  h2h,
  className,
}: MatchHeaderProps) {
  const isLive = status === "live"
  const isFinished = status === "finished"
  const isUpcoming = status === "upcoming"

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-surface via-background to-surface p-8", className)}>
      {isLive && <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />}

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {competition.name}
          </Badge>
          {venue && <span className="text-xs text-muted-foreground">{venue}</span>}
          {attendance && (
            <span className="text-xs text-muted-foreground">Att: {attendance.toLocaleString()}</span>
          )}
        </div>

        <div className="flex w-full max-w-3xl items-center justify-between gap-6">
          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface shadow-lg ring-1 ring-border">
              <span className="text-2xl font-bold text-foreground">
                {homeTeam.name.slice(0, 3).toUpperCase()}
              </span>
            </div>
            <span className="text-lg font-bold text-foreground">{homeTeam.name}</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <span className={cn(
                "text-6xl font-black tabular-nums",
                isLive && "text-primary",
                isFinished && "text-foreground",
                isUpcoming && "text-muted-foreground"
              )}>
                {homeScore !== null ? homeScore : "-"}
              </span>
              <span className="text-3xl font-bold text-muted-foreground">:</span>
              <span className={cn(
                "text-6xl font-black tabular-nums",
                isLive && "text-primary",
                isFinished && "text-foreground",
                isUpcoming && "text-muted-foreground"
              )}>
                {awayScore !== null ? awayScore : "-"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isLive && <LiveIndicator size="md" />}
              <Badge variant={isLive ? "live" : isFinished ? "finished" : "upcoming"}>
                {isLive && minute ? `${minute}'` : status === "halftime" ? "HT" : status === "finished" ? "FT" : status === "extratime" ? "ET" : status === "penalties" ? "PEN" : new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </Badge>
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface shadow-lg ring-1 ring-border">
              <span className="text-2xl font-bold text-foreground">
                {awayTeam.name.slice(0, 3).toUpperCase()}
              </span>
            </div>
            <span className="text-lg font-bold text-foreground">{awayTeam.name}</span>
          </div>
        </div>

        {h2h && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>H2H:</span>
            <span className="text-primary">{h2h.homeWins} {homeTeam.name} wins</span>
            <span className="text-muted-foreground">{h2h.draws} draws</span>
            <span className="text-secondary">{h2h.awayWins} {awayTeam.name} wins</span>
            <span>({h2h.played} matches)</span>
          </div>
        )}
      </div>
    </div>
  )
}
