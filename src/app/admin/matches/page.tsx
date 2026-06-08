"use client"

import { useEffect, useState, useCallback } from "react"
import { DataTable, type Column } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MatchEventForm, type MatchEventData } from "@/components/admin/match-event-form"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Swords,
  Clock,
  Goal,
} from "lucide-react"
import { format } from "date-fns"

interface Match {
  id: string
  homeScore: number | null
  awayScore: number | null
  status: string
  minute: number
  round: string | null
  date: string
  venue: string | null
  competition: { id: string; name: string } | null
  homeTeam: { id: string; name: string; shortName: string | null }
  awayTeam: { id: string; name: string; shortName: string | null }
  events?: any[]
}

interface Competition {
  id: string
  name: string
}

interface Team {
  id: string
  name: string
  shortName: string | null
}

interface Player {
  id: string
  name: string
  shirtNumber: number
}

const statusColors: Record<string, "live" | "finished" | "upcoming" | "destructive" | "default"> = {
  LIVE: "live",
  FINISHED: "finished",
  SCHEDULED: "upcoming",
  HALF_TIME: "live",
  EXTRA_TIME: "live",
  PENALTIES: "live",
  POSTPONED: "destructive",
  CANCELLED: "destructive",
}

export default function AdminMatches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Match | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  const [form, setForm] = useState({
    competitionId: "",
    homeTeamId: "",
    awayTeamId: "",
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    round: "",
    venue: "",
    homeScore: "",
    awayScore: "",
    status: "SCHEDULED",
    minute: "0",
  })

  const fetchMatches = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
      })
      const res = await fetch(`/api/admin/matches?${params}`)
      if (res.ok) {
        const data = await res.json()
        setMatches(data.data ?? [])
        setTotalItems(data.pagination?.totalItems ?? 0)
      }
    } catch {
      toast.error("Failed to load matches")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  const fetchCompetitions = async () => {
    try {
      const res = await fetch("/api/competitions?pageSize=100")
      if (res.ok) {
        const data = await res.json()
        setCompetitions(data.data ?? [])
      }
    } catch {}
  }

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams?pageSize=200")
      if (res.ok) {
        const data = await res.json()
        setTeams(data.data ?? [])
      }
    } catch {}
  }

  const fetchPlayers = async (teamId: string) => {
    try {
      const res = await fetch(`/api/players?teamId=${teamId}&pageSize=50`)
      if (res.ok) {
        const data = await res.json()
        setPlayers(data.data ?? [])
      }
    } catch {}
  }

  useEffect(() => {
    fetchMatches()
    fetchCompetitions()
    fetchTeams()
  }, [fetchMatches])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        competitionId: form.competitionId,
        homeTeamId: form.homeTeamId,
        awayTeamId: form.awayTeamId,
        date: new Date(form.date).toISOString(),
        ...(form.round && { round: form.round }),
        ...(form.venue && { venue: form.venue }),
      }

      if (editing) {
        payload.homeScore = form.homeScore ? parseInt(form.homeScore) : null
        payload.awayScore = form.awayScore ? parseInt(form.awayScore) : null
        payload.status = form.status
        payload.minute = parseInt(form.minute) || 0
      }

      const url = editing ? `/api/admin/matches/${editing.id}` : "/api/admin/matches"
      const method = editing ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(editing ? "Match updated" : "Match created")
        setDialogOpen(false)
        resetForm()
        fetchMatches()
      } else {
        const err = await res.json()
        toast.error(err.error ?? "Failed to save match")
      }
    } catch {
      toast.error("Failed to save match")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/matches/${deleteId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Match deleted")
        setDeleteId(null)
        fetchMatches()
      } else {
        toast.error("Failed to delete match")
      }
    } catch {
      toast.error("Failed to delete match")
    }
  }

  const handleAddEvent = async (eventData: MatchEventData) => {
    if (!selectedMatch) return
    try {
      const res = await fetch(`/api/admin/matches/${selectedMatch.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      })
      if (res.ok) {
        toast.success("Event added")
        fetchMatches()
      } else {
        toast.error("Failed to add event")
      }
    } catch {
      toast.error("Failed to add event")
    }
  }

  const resetForm = () => {
    setForm({
      competitionId: "",
      homeTeamId: "",
      awayTeamId: "",
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      round: "",
      venue: "",
      homeScore: "",
      awayScore: "",
      status: "SCHEDULED",
      minute: "0",
    })
    setEditing(null)
  }

  const openEdit = (match: Match) => {
    setForm({
      competitionId: match.competition?.id ?? "",
      homeTeamId: match.homeTeam?.id ?? "",
      awayTeamId: match.awayTeam?.id ?? "",
      date: format(new Date(match.date), "yyyy-MM-dd'T'HH:mm"),
      round: match.round ?? "",
      venue: match.venue ?? "",
      homeScore: match.homeScore?.toString() ?? "",
      awayScore: match.awayScore?.toString() ?? "",
      status: match.status,
      minute: match.minute.toString(),
    })
    setEditing(match)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Matches</h1>
          <p className="text-sm text-muted-foreground">
            Manage matches, scores, and events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchMatches}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Match
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Match" : "Create Match"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Competition</Label>
                  <Select
                    value={form.competitionId}
                    onValueChange={(v) => setForm({ ...form, competitionId: v })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select competition" />
                    </SelectTrigger>
                    <SelectContent>
                      {competitions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Home Team</Label>
                    <Select
                      value={form.homeTeamId}
                      onValueChange={(v) => setForm({ ...form, homeTeamId: v })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Home team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Away Team</Label>
                    <Select
                      value={form.awayTeamId}
                      onValueChange={(v) => setForm({ ...form, awayTeamId: v })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Away team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Round</Label>
                    <Input
                      value={form.round}
                      onChange={(e) => setForm({ ...form, round: e.target.value })}
                      placeholder="e.g. Matchday 1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Input
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    placeholder="Stadium name"
                  />
                </div>

                {editing && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Home Score</Label>
                        <Input
                          type="number"
                          min="0"
                          value={form.homeScore}
                          onChange={(e) => setForm({ ...form, homeScore: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Away Score</Label>
                        <Input
                          type="number"
                          min="0"
                          value={form.awayScore}
                          onChange={(e) => setForm({ ...form, awayScore: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Minute</Label>
                        <Input
                          type="number"
                          min="0"
                          max="120"
                          value={form.minute}
                          onChange={(e) => setForm({ ...form, minute: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={form.status}
                        onValueChange={(v) => setForm({ ...form, status: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["SCHEDULED", "LIVE", "HALF_TIME", "FINISHED", "POSTPONED", "CANCELLED"].map(
                            (s) => (
                              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : editing ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DataTable
        columns={[
          {
            key: "match",
            header: "Match",
            cell: (m: Match) => (
              <div className="flex items-center gap-2">
                <Swords className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">
                    {m.homeTeam?.shortName ?? m.homeTeam?.name} vs {m.awayTeam?.shortName ?? m.awayTeam?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.competition?.name ?? "Unknown"}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "score",
            header: "Score",
            cell: (m: Match) => (
              <span className="font-bold tabular-nums text-lg">
                {m.homeScore ?? m.homeScore === 0 ? `${m.homeScore} - ${m.awayScore}` : "—"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (m: Match) => (
              <Badge variant={statusColors[m.status] ?? "default"}>
                {m.status === "LIVE" ? `${m.minute}'` : m.status.replace(/_/g, " ")}
              </Badge>
            ),
          },
          {
            key: "date",
            header: "Date",
            cell: (m: Match) => (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(m.date), "MMM d, HH:mm")}
              </div>
            ),
            hideOnMobile: true,
          },
          {
            key: "events",
            header: "Events",
            cell: (m: Match) => (
              <div className="flex items-center gap-1">
                <Goal className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {m.events?.length ?? 0}
                </span>
              </div>
            ),
            hideOnMobile: true,
          },
          {
            key: "actions",
            header: "Actions",
            cell: (m: Match) => (
              <div className="flex items-center gap-1">
                <MatchEventForm
                  matchId={m.id}
                  teamId={m.homeTeam?.id}
                  homeTeamId={m.homeTeam?.id}
                  awayTeamId={m.awayTeam?.id}
                  homeTeamName={m.homeTeam?.name}
                  awayTeamName={m.awayTeam?.name}
                  players={players}
                  onSubmit={(data) => {
                    setSelectedMatch(m)
                    handleAddEvent(data)
                  }}
                />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => setDeleteId(m.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={matches}
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchable
        onSearch={(q) => { setSearch(q); setPage(1) }}
        loading={loading}
        keyExtractor={(m) => m.id}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Match</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this match and all associated events and data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
