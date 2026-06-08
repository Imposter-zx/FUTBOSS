"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CommentaryEntry {
  id: string
  minute: number
  text: string
  type: "goal" | "card" | "substitution" | "var" | "normal" | "highlight"
  team?: "home" | "away"
}

interface MatchCommentaryProps {
  entries: CommentaryEntry[]
  isLive?: boolean
  className?: string
}

const entryStyles = {
  goal: "border-l-green-500 bg-green-500/5",
  card: "border-l-yellow-500 bg-yellow-500/5",
  substitution: "border-l-blue-500 bg-blue-500/5",
  var: "border-l-purple-500 bg-purple-500/5",
  normal: "border-l-border",
  highlight: "border-l-primary bg-primary/5",
}

const entryIcons = {
  goal: "⚽",
  card: "🟨",
  substitution: "🔄",
  var: "📺",
  normal: "●",
  highlight: "⭐",
}

export function MatchCommentary({ entries, isLive = false, className }: MatchCommentaryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLive && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries, isLive])

  const sorted = [...entries].sort((a, b) => a.minute - b.minute)

  return (
    <ScrollArea ref={scrollRef} className={cn("h-full max-h-[500px]", className)}>
      <div className="space-y-1">
        {sorted.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              "border-l-2 px-4 py-2 transition-colors hover:bg-surface/30",
              entryStyles[entry.type]
            )}
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-xs">{entryIcons[entry.type]}</span>
              <span className="min-w-[2.5rem] text-xs font-bold tabular-nums text-muted-foreground">
                {entry.minute}&apos;
              </span>
              <p className={cn(
                "text-sm leading-snug",
                entry.type === "goal" && "font-semibold text-foreground",
                entry.type === "highlight" && "font-medium text-foreground",
                entry.type === "normal" && "text-muted-foreground"
              )}>
                {entry.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
