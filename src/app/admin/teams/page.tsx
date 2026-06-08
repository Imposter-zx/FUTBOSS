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
  Users,
  Globe,
} from "lucide-react"

interface Team {
  id: string
  name: string
  slug: string
  shortName: string | null
  logoUrl: string | null
  country: string | null
  stadium: string | null
  foundedYear: number | null
  _count?: { players: number; homeMatches: number }
}

const columns: Column<Team>[] = [
  {
    key: "name",
    header: "Name",
    cell: (t) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
          <Users className="h-4 w-4 text-secondary" />
        </div>
        <div>
          <p className="font-medium">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.shortName}</p>
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    key: "country",
    header: "Country",
    cell: (t) => (
      <div className="flex items-center gap-1.5 text-sm">
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        {t.country ?? "—"}
      </div>
    ),
  },
  {
    key: "stadium",
    header: "Stadium",
    cell: (t) => <span className="text-sm">{t.stadium ?? "—"}</span>,
    hideOnMobile: true,
  },
  {
    key: "founded",
    header: "Founded",
    cell: (t) => (
      <span className="text-sm font-mono">{t.foundedYear ?? "—"}</span>
    ),
    hideOnMobile: true,
  },
  {
    key: "players",
    header: "Players",
    cell: (t) => (
      <span className="font-mono text-sm">{t._count?.players ?? 0}</span>
    ),
  },
]

export default function AdminTeams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Team | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: "",
    slug: "",
    shortName: "",
    country: "",
    stadium: "",
    foundedYear: "",
  })

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
      })
      const res = await fetch(`/api/admin/teams?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTeams(data.data ?? [])
        setTotalItems(data.pagination?.totalItems ?? 0)
      }
    } catch {
      toast.error("Failed to load teams")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editing ? `/api/admin/teams/${editing.id}` : "/api/admin/teams"
      const method = editing ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          foundedYear: form.foundedYear ? parseInt(form.foundedYear) : null,
        }),
      })

      if (res.ok) {
        toast.success(editing ? "Team updated" : "Team created")
        setDialogOpen(false)
        resetForm()
        fetchTeams()
      } else {
        const err = await res.json()
        toast.error(err.error ?? "Failed to save team")
      }
    } catch {
      toast.error("Failed to save team")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/teams/${deleteId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Team deleted")
        setDeleteId(null)
        fetchTeams()
      } else {
        toast.error("Failed to delete team")
      }
    } catch {
      toast.error("Failed to delete team")
    }
  }

  const resetForm = () => {
    setForm({ name: "", slug: "", shortName: "", country: "", stadium: "", foundedYear: "" })
    setEditing(null)
  }

  const openEdit = (team: Team) => {
    setForm({
      name: team.name,
      slug: team.slug,
      shortName: team.shortName ?? "",
      country: team.country ?? "",
      stadium: team.stadium ?? "",
      foundedYear: team.foundedYear?.toString() ?? "",
    })
    setEditing(team)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teams</h1>
          <p className="text-sm text-muted-foreground">
            Manage football teams and clubs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTeams}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Team
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Team" : "Create Team"}</DialogTitle>
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
                    <Label>Short Name</Label>
                    <Input
                      value={form.shortName}
                      onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Founded Year</Label>
                    <Input
                      type="number"
                      value={form.foundedYear}
                      onChange={(e) => setForm({ ...form, foundedYear: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Stadium</Label>
                  <Input
                    value={form.stadium}
                    onChange={(e) => setForm({ ...form, stadium: e.target.value })}
                  />
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
            cell: (t) => (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => setDeleteId(t.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={teams}
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchable
        onSearch={(q) => { setSearch(q); setPage(1) }}
        loading={loading}
        keyExtractor={(t) => t.id}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this team and all associated data. This action cannot be undone.
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
