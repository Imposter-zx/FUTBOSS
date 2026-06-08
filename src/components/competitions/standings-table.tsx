"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface StandingTeam {
  position: number
  teamId: string
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  form: ("W" | "D" | "L")[]
  zone?: "ucl" | "uel" | "relegation" | "promotion"
}

interface StandingsTableProps {
  standings: StandingTeam[]
  className?: string
  highlightTeamId?: string
}

const zoneStyles: Record<string, string> = {
  ucl: "border-l-4 border-l-secondary/60",
  uel: "border-l-4 border-l-accent/60",
  relegation: "border-l-4 border-l-red-500/60",
  promotion: "border-l-4 border-l-primary/60",
}

const formColors = {
  W: "bg-primary text-primary-foreground",
  D: "bg-accent text-accent-foreground",
  L: "bg-destructive text-destructive-foreground",
}

export function StandingsTable({ standings, className, highlightTeamId }: StandingsTableProps) {
  return (
    <div className={cn("rounded-xl border border-border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center">MP</TableHead>
            <TableHead className="text-center">W</TableHead>
            <TableHead className="text-center">D</TableHead>
            <TableHead className="text-center">L</TableHead>
            <TableHead className="text-center">GF</TableHead>
            <TableHead className="text-center">GA</TableHead>
            <TableHead className="text-center">GD</TableHead>
            <TableHead className="text-center font-bold">Pts</TableHead>
            <TableHead className="text-center">Form</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((team) => (
            <TableRow
              key={team.teamId}
              className={cn(
                team.zone && zoneStyles[team.zone],
                highlightTeamId === team.teamId && "bg-primary/5"
              )}
            >
              <TableCell className={cn(
                "text-center text-sm font-bold",
                team.position <= 4 && "text-secondary",
                team.position >= standings.length - 2 && "text-destructive"
              )}>
                {team.position}
              </TableCell>
              <TableCell>
                <Link
                  href={`/teams/${team.teamId}`}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {team.teamName}
                </Link>
              </TableCell>
              <TableCell className="text-center text-sm tabular-nums">{team.played}</TableCell>
              <TableCell className="text-center text-sm tabular-nums">{team.won}</TableCell>
              <TableCell className="text-center text-sm tabular-nums">{team.drawn}</TableCell>
              <TableCell className="text-center text-sm tabular-nums">{team.lost}</TableCell>
              <TableCell className="text-center text-sm tabular-nums">{team.goalsFor}</TableCell>
              <TableCell className="text-center text-sm tabular-nums">{team.goalsAgainst}</TableCell>
              <TableCell className={cn(
                "text-center text-sm font-medium tabular-nums",
                team.goalDifference > 0 && "text-primary",
                team.goalDifference < 0 && "text-destructive"
              )}>
                {team.goalDifference > 0 ? "+" : ""}{team.goalDifference}
              </TableCell>
              <TableCell className="text-center text-sm font-bold tabular-nums text-foreground">
                {team.points}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-0.5">
                  {team.form.map((result, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold",
                        formColors[result]
                      )}
                    >
                      {result}
                    </span>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
