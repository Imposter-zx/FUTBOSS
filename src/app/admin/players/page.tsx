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
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  UserCircle,
  Flag,
} from "lucide-react"

interface Player {
  id: string
  name: string
  slug: string
  position: string
  nationality: string | null
  shirtNumber: number | null
  age: number | null
  team: { id: string; name: string; shortName: string | null } | null
}

interface Team {
  id: string
  name: string
}

const POSITIONS = [
  "GK", "CB", "LB", "RB", "LWB", "RWB",
  "CDM", "CM", "CAM", "LM", "RM",
  "LW", "RW", "CF", "ST",
]

const columns: Column<Player>[] = [
  {
    key: "name",
    header: "Name",
    cell: (p) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <UserCircle className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-medium">{p.name}</p>
          <p className="text-xs text-muted-foreground">{p.slug}</p>
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    key: "team",
    header: "Team",
    cell: (p) => (
      <span className="text-sm">{p.team?.name ?? "—"}</span>
    ),
  },
  {
    key: "position",
    header: "Position",
    cell: (p) => (
      <Badge variant="secondary" className="font-mono text-xs">
        {p.position}
      </Badge>
    ),
  },
  {
    key: "nationality",
    header: "Nationality",
    cell: (p) => (
      <div className="flex items-center gap-1.5 text-sm">
        <Flag className="h-3.5 w-3.5 text-muted-foreground" />
        {p.nationality ?? "—"}
      </div>
    ),
    hideOnMobile: true,
  },
  {
    key: "shirtNumber",
    header: "#",
    cell: (p) => (
      <span className="font-mono text-sm">{p.shirtNumber ?? "—"}</span>
    ),
    hideOnMobile: true,
  },
  {
    key: "age",
    header: "Age",
    cell: (p) => (
      <span className="text-sm font-mono">{p.age ?? "—"}</span>
    ),
    hideOnMobile: true,
  },
]

export default function AdminPlayers() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Player | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])

  const [form, setForm] = useState({
    name: "",
    slug: "",
    position: "CM",
    nationality: "",
    shirtNumber: "",
    teamId: "",
    age: "",
  })

  const fetchPlayers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
      })
      const res = await fetch(`/api/admin/players?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPlayers(data.data ?? [])
        setTotalItems(data.pagination?.totalItems ?? 0)
      }
    } catch {
      toast.error("Failed to load players")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams?pageSize=200")
      if (res.ok) {
        const data = await res.json()
        setTeams(data.data ?? [])
      }
    } catch {}
  }

  useEffect(() => {
    fetchPlayers()
    fetchTeams()
  }, [fetchPlayers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editing ? `/api/admin/players/${editing.id}` : "/api/admin/players"
      const method = editing ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          shirtNumber: form.shirtNumber ? parseInt(form.shirtNumber) : null,
          age: form.age ? parseInt(form.age) : null,
        }),
      })

      if (res.ok) {
        toast.success(editing ? "Player updated" : "Player created")
        setDialogOpen(false)
        resetForm()
        fetchPlayers()
      } else {
        const err = await res.json()
        toast.error(err.error ?? "Failed to save player")
      }
    } catch {
      toast.error("Failed to save player")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/players/${deleteId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Player deleted")
        setDeleteId(null)
        fetchPlayers()
      } else {
        toast.error("Failed to delete player")
      }
    } catch {
      toast.error("Failed to delete player")
    }
  }

  const resetForm = () => {
    setForm({
      name: "", slug: "", position: "CM", nationality: "",
      shirtNumber: "", teamId: "", age: "",
    })
    setEditing(null)
  }

  const openEdit = (player: Player) => {
    setForm({
      name: player.name,
      slug: player.slug,
      position: player.position,
      nationality: player.nationality ?? "",
      shirtNumber: player.shirtNumber?.toString() ?? "",
      teamId: player.team?.id ?? "",
      age: player.age?.toString() ?? "",
    })
    setEditing(player)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Players</h1>
          <p className="text-sm text-muted-foreground">
            Manage football players
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchPlayers}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Player
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Player" : "Create Player"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map((pos) => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Shirt Number</Label>
                    <Input
                      type="number"
                      min="1"
                      max="99"
                      value={form.shirtNumber}
                      onChange={(e) => setForm({ ...form, shirtNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nationality</Label>
                    <Input
                      value={form.nationality}
                      onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                      type="number"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Team</Label>
                  <Select
                    value={form.teamId}
                    onValueChange={(v) => setForm({ ...form, teamId: v })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
          ...columns,
          {
            key: "actions",
            header: "Actions",
            cell: (p) => (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => setDeleteId(p.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={players}
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchable
        onSearch={(q) => { setSearch(q); setPage(1) }}
        loading={loading}
        keyExtractor={(p) => p.id}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this player and all associated data.
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
