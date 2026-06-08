"use client"

import { cn } from "@/lib/utils"

interface Player {
  id: string
  name: string
  number: number
  rating?: number
  position: string
  isCaptain?: boolean
}

interface FormationProps {
  team: string
  formation: string
  starters: Player[]
  substitutes: Player[]
  className?: string
}

const formationPositions: Record<string, number[][]> = {
  "4-3-3": [[50, 85], [20, 75], [50, 75], [80, 75], [50, 62], [20, 50], [50, 50], [80, 50], [20, 30], [50, 20], [80, 30]],
  "4-4-2": [[50, 85], [20, 75], [50, 75], [80, 75], [15, 55], [40, 60], [60, 60], [85, 55], [35, 30], [65, 30]],
  "4-2-3-1": [[50, 85], [20, 75], [50, 75], [80, 75], [35, 62], [65, 62], [15, 45], [50, 48], [85, 45], [50, 25]],
  "3-5-2": [[50, 85], [25, 78], [50, 82], [75, 78], [15, 58], [35, 55], [50, 52], [65, 55], [85, 58], [35, 28], [65, 28]],
  "3-4-3": [[50, 85], [25, 78], [50, 82], [75, 78], [15, 58], [85, 58], [35, 52], [65, 52], [20, 30], [50, 18], [80, 30]],
  "5-3-2": [[50, 85], [10, 75], [30, 78], [50, 82], [70, 78], [90, 75], [30, 55], [50, 52], [70, 55], [35, 28], [65, 28]],
  "2-3-5": [[50, 88], [30, 78], [70, 78], [15, 62], [50, 65], [85, 62], [10, 35], [30, 28], [50, 20], [70, 28], [90, 35]],
}

const defaultFormation = "4-3-3"

export function MatchLineups({ team, formation, starters, substitutes, className }: FormationProps) {
  const positions = formationPositions[formation] ?? formationPositions[defaultFormation]!

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">{team}</h4>
        <span className="text-xs text-muted-foreground">{formation}</span>
      </div>

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-gradient-to-b from-primary/5 via-background to-surface">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/20" />
          <div className="absolute left-1/2 top-0 h-full w-0 border-l border-foreground/10" />
          <div className="absolute left-0 top-1/2 h-0 w-full border-t border-foreground/10" />
          <div className="absolute bottom-[18%] left-[8%] right-[8%] border-b border-foremost/10" />
        </div>

        {positions && starters.slice(0, positions.length).map((player, idx) => {
          const pos = positions[idx]
          if (!pos) return null
          return (
            <div
              key={player.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}
            >
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-[10px] font-bold text-foreground shadow-lg ring-1 ring-border">
                  {player.number}
                </div>
                <span className="whitespace-nowrap rounded bg-background/80 px-1.5 py-0.5 text-[9px] font-medium text-foreground shadow-sm">
                  {player.name.split(" ").pop()}
                  {player.isCaptain && " (C)"}
                </span>
                {player.rating && (
                  <span className="rounded bg-primary/20 px-1 text-[8px] font-semibold text-primary">
                    {player.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div>
        <h5 className="mb-2 text-xs font-semibold text-muted-foreground">Substitutes</h5>
        <div className="grid grid-cols-2 gap-1">
          {substitutes.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center gap-2 rounded-md bg-surface/50 px-2 py-1"
            >
              <span className="w-5 text-center text-[10px] font-bold text-muted-foreground">
                {sub.number}
              </span>
              <span className="text-xs text-foreground">{sub.name}</span>
              {sub.rating && (
                <span className="ml-auto text-[10px] text-primary">{sub.rating.toFixed(1)}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
