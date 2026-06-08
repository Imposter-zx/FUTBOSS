"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface H2HMatch {
  id: string
  date: string
  competition: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
}

interface H2HTableProps {
  matches: H2HMatch[]
  teamId: string
  className?: string
}

export function H2HTable({ matches, teamId, className }: H2HTableProps) {
  const sorted = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className={cn("rounded-xl border border-border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Comp</TableHead>
            <TableHead colSpan={3}>Match</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((match) => {
            const isHomeWin = match.homeScore > match.awayScore
            const isAwayWin = match.awayScore > match.homeScore
            const isDraw = match.homeScore === match.awayScore

            return (
              <TableRow key={match.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(match.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{match.competition}</TableCell>
                <TableCell className={cn(
                  "text-right text-sm font-medium",
                  isHomeWin && "text-primary"
                )}>
                  {match.homeTeam}
                </TableCell>
                <TableCell className="w-16 text-center font-bold tabular-nums">
                  {match.homeScore} - {match.awayScore}
                </TableCell>
                <TableCell className={cn(
                  "text-sm font-medium",
                  isAwayWin && "text-secondary"
                )}>
                  {match.awayTeam}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
