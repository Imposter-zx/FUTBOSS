"use client"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TimelineEvent {
  id: string
  minute: number
  type: "goal" | "yellow_card" | "red_card" | "substitution" | "var" | "penalty" | "own_goal"
  team: "home" | "away"
  player: string
  detail?: string
  isImportant?: boolean
}

interface MatchTimelineProps {
  events: TimelineEvent[]
  className?: string
}

const eventStyles = {
  goal: "border-green-500 bg-green-500/10",
  yellow_card: "border-yellow-500 bg-yellow-500/10",
  red_card: "border-red-500 bg-red-500/10",
  substitution: "border-blue-500 bg-blue-500/10",
  var: "border-purple-500 bg-purple-500/10",
  penalty: "border-red-500 bg-red-500/10",
  own_goal: "border-orange-500 bg-orange-500/10",
}

const eventIcons = {
  goal: "⚽",
  yellow_card: "🟨",
  red_card: "🟥",
  substitution: "🔄",
  var: "📺",
  penalty: "⚽",
  own_goal: "🟠",
}

export function MatchTimeline({ events, className }: MatchTimelineProps) {
  const sorted = [...events].sort((a, b) => a.minute - b.minute)

  return (
    <ScrollArea className={cn("h-full max-h-[600px]", className)}>
      <div className="relative pl-6">
        <div className="absolute left-3 top-0 h-full w-0.5 bg-border" />
        <div className="space-y-0">
          {sorted.map((event) => (
            <div key={event.id} className="relative pb-6">
              <div
                className={cn(
                  "absolute left-[-22px] flex h-7 w-7 items-center justify-center rounded-full border-2 bg-background text-xs",
                  eventStyles[event.type]
                )}
              >
                {eventIcons[event.type]}
              </div>
              <div
                className={cn(
                  "ml-4 rounded-lg border-l-4 p-3",
                  eventStyles[event.type],
                  event.isImportant && "ring-1 ring-primary/30"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {event.minute}&apos;
                  </span>
                  <span className={cn(
                    "text-sm font-medium",
                    event.team === "home" ? "text-primary" : "text-secondary"
                  )}>
                    {event.player}
                  </span>
                </div>
                {event.detail && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{event.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}
