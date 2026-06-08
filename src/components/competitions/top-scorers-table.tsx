"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface TopScorer {
  position: number
  playerId: string
  playerName: string
  teamId: string
  teamName: string
  goals: number
  assists?: number
  matchesPlayed: number
  penalties?: number
  minutesPlayed?: number
}

interface TopScorersTableProps {
  scorers: TopScorer[]
  className?: string
}

export function TopScorersTable({ scorers, className }: TopScorersTableProps) {
  return (
    <div className={cn("rounded-xl border border-border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center">Goals</TableHead>
            <TableHead className="text-center">Assists</TableHead>
            <TableHead className="text-center">Matches</TableHead>
            <TableHead className="text-center">G/M</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scorers.map((scorer) => (
            <TableRow key={scorer.playerId}>
              <TableCell className={cn(
                "text-center text-sm font-bold",
                scorer.position === 1 && "text-accent",
                scorer.position === 2 && "text-muted-foreground",
                scorer.position === 3 && "text-amber-700"
              )}>
                {scorer.position}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px] bg-surface text-foreground">
                      {scorer.playerName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Link
                    href={`/players/${scorer.playerId}`}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {scorer.playerName}
                  </Link>
                  {scorer.penalties && scorer.penalties > 0 && (
                    <span className="text-[10px] text-muted-foreground">({scorer.penalties} pen)</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Link
                  href={`/teams/${scorer.teamId}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {scorer.teamName}
                </Link>
              </TableCell>
              <TableCell className="text-center text-lg font-bold tabular-nums text-foreground">
                {scorer.goals}
              </TableCell>
              <TableCell className="text-center text-sm tabular-nums text-muted-foreground">
                {scorer.assists ?? "-"}
              </TableCell>
              <TableCell className="text-center text-sm tabular-nums text-muted-foreground">
                {scorer.matchesPlayed}
              </TableCell>
              <TableCell className="text-center text-sm tabular-nums text-muted-foreground">
                {(scorer.goals / scorer.matchesPlayed).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
