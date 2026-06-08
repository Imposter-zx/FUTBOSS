"use client"

import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { MatchCard, type MatchData } from "@/components/matches/match-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface MatchGroup {
  competitionId: string
  competitionName: string
  competitionLogo?: string
  matches: MatchData[]
}

interface MatchListProps {
  groups: MatchGroup[]
  className?: string
  layout?: "vertical" | "horizontal"
  variant?: "default" | "compact"
}

export function MatchList({ groups, className, layout = "vertical", variant = "default" }: MatchListProps) {
  if (layout === "horizontal") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {groups.flatMap((group) =>
            group.matches.map((match) => (
              <div key={match.id} className="min-w-[280px] flex-shrink-0">
                <MatchCard match={match} variant={variant} />
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {groups.map((group) => (
        <div key={group.competitionId}>
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">{group.competitionName}</h3>
            <span className="text-xs text-muted-foreground">({group.matches.length})</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {group.matches.map((match) => (
              <MatchCard key={match.id} match={match} variant={variant} />
            ))}
          </div>
          <Separator className="mt-6" />
        </div>
      ))}
    </div>
  )
}
