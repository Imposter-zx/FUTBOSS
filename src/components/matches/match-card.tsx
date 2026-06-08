"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { LiveIndicator } from "@/components/shared/live-indicator"

interface TeamInfo {
  id: string
  name: string
  logo: string
}

export interface MatchData {
  id: string
  homeTeam: TeamInfo
  awayTeam: TeamInfo
  homeScore: number | null
  awayScore: number | null
  status: "live" | "finished" | "upcoming" | "halftime" | "extratime" | "penalties"
  minute?: number
  date: string
  competition: {
    id: string
    name: string
    logo?: string
  }
}

interface MatchCardProps {
  match: MatchData
  variant?: "default" | "compact"
  className?: string
}

export function MatchCard({ match, variant = "default", className }: MatchCardProps) {
  const isLive = match.status === "live"

  const statusConfig = {
    live: { label: match.minute ? `${match.minute}'` : "LIVE", variant: "live" as const },
    finished: { label: "FT", variant: "finished" as const },
    upcoming: { label: new Date(match.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }), variant: "upcoming" as const },
    halftime: { label: "HT", variant: "default" as const },
    extratime: { label: match.minute ? `${match.minute}'` : "ET", variant: "live" as const },
    penalties: { label: "PEN", variant: "live" as const },
  }

  const statusInfo = statusConfig[match.status]

  return (
    <Link href={`/matches/${match.id}`}>
      <div
        className={cn(
          "group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
          isLive && "border-l-4 border-l-primary shadow-[0_0_15px_rgba(0,230,118,0.1)]",
          className
        )}
      >
        {isLive && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Badge variant={statusInfo.variant} className="text-[10px]">
              {isLive && <LiveIndicator size="sm" className="mr-1" />}
              {statusInfo.label}
            </Badge>
            {isLive && match.minute && (
              <span className="animate-pulse text-[10px] font-semibold text-primary">
                {match.minute}&apos;
              </span>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            {match.competition.name}
          </Badge>
        </div>

        <div className={cn("mt-3", variant === "compact" ? "space-y-1" : "space-y-2")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
                <span className="text-xs font-bold text-foreground">
                  {match.homeTeam.name.charAt(0)}
                </span>
              </div>
              <span className={cn("font-medium text-foreground", variant === "compact" ? "text-sm" : "text-base")}>
                {match.homeTeam.name}
              </span>
            </div>
            <span className={cn(
              "font-bold tabular-nums",
              isLive ? "text-2xl text-primary" : "text-xl text-foreground",
              match.status === "upcoming" && "text-muted-foreground"
            )}>
              {match.homeScore !== null ? match.homeScore : "-"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
                <span className="text-xs font-bold text-foreground">
                  {match.awayTeam.name.charAt(0)}
                </span>
              </div>
              <span className={cn("font-medium text-foreground", variant === "compact" ? "text-sm" : "text-base")}>
                {match.awayTeam.name}
              </span>
            </div>
            <span className={cn(
              "font-bold tabular-nums",
              isLive ? "text-2xl text-primary" : "text-xl text-foreground",
              match.status === "upcoming" && "text-muted-foreground"
            )}>
              {match.awayScore !== null ? match.awayScore : "-"}
            </span>
          </div>
        </div>

        {match.status === "upcoming" && (
          <div className="mt-2 text-center text-xs text-muted-foreground">
            {new Date(match.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>
    </Link>
  )
}
