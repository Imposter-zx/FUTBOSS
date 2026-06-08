"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface SquadPlayer {
  id: string
  name: string
  number: number
  position: string
  nationality: string
  age: number
  rating?: number
  isCaptain?: boolean
}

interface SquadListProps {
  players: SquadPlayer[]
  className?: string
}

const positionOrder = ["Goalkeeper", "Defender", "Midfielder", "Forward"]
const positionColors: Record<string, string> = {
  Goalkeeper: "border-l-yellow-500",
  Defender: "border-l-blue-500",
  Midfielder: "border-l-green-500",
  Forward: "border-l-red-500",
}
const positionIcons: Record<string, string> = {
  Goalkeeper: "GK",
  Defender: "DEF",
  Midfielder: "MID",
  Forward: "FWD",
}

export function SquadList({ players, className }: SquadListProps) {
  const grouped = players.reduce<Record<string, SquadPlayer[]>>((acc, player) => {
    const pos = player.position
    if (!acc[pos]) acc[pos] = []
    acc[pos]!.push(player)
    return acc
  }, {})

  return (
    <div className={cn("space-y-8", className)}>
      {positionOrder.map((position) => {
        const positionPlayers = grouped[position]
        if (!positionPlayers?.length) return null

        return (
          <div key={position}>
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-md bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {positionIcons[position] ?? position}
              </span>
              <h3 className="text-sm font-semibold text-foreground">{position}s</h3>
              <span className="text-xs text-muted-foreground">({positionPlayers.length})</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {positionPlayers.map((player) => (
                <Link
                  key={player.id}
                  href={`/players/${player.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-md",
                    positionColors[player.position]
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-surface text-xs text-foreground">
                      {player.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground truncate">
                        {player.name}
                      </span>
                      {player.isCaptain && (
                        <span className="text-[10px] text-accent font-bold">(C)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>#{player.number}</span>
                      <span>{player.nationality}</span>
                      <span>{player.age} yrs</span>
                    </div>
                  </div>
                  {player.rating && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {player.rating.toFixed(1)}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
