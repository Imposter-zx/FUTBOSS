"use client"

import { useEffect, useState, useCallback } from "react"
import { DataTable, type Column } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  Trophy,
  Search,
  RefreshCw,
  Loader2,
  Globe,
} from "lucide-react"

interface Competition {
  id: string
  name: string
  slug: string
  shortName: string | null
  logoUrl: string | null
  country: string | null
  season: string | null
  isActive: boolean
  tier: number
  _count?: { matches: number; teams: number }
}

function getColumns(toggleActive: (id: string) => void): Column<Competition>[] {
  return [
    {
      key: "name",
      header: "Name",
      cell: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.slug}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "shortName",
      header: "Short Name",
      cell: (c) => (
        <Badge variant="outline" className="font-mono text-xs">
          {c.shortName ?? "—"}
        </Badge>
      ),
    },
    {
      key: "country",
      header: "Country",
      cell: (c) => (
        <div className="flex items-center gap-1.5 text-sm">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          {c.country ?? "—"}
        </div>
      ),
    },
    {
      key: "tier",
      header: "Tier",
      cell: (c) => (
        <Badge variant="secondary" className="font-mono">
          T{c.tier}
        </Badge>
      ),
    },
    {
      key: "matches",
      header: "Matches",
      cell: (c) => (
        <span className="font-mono text-sm">{c._count?.matches ?? 0}</span>
      ),
    },
    {
      key: "active",
      header: "Active",
      cell: (c) => (
        <Switch checked={c.isActive} onCheckedChange={() => toggleActive(c.id)} />
      ),
      hideOnMobile: true,
    },
  ]
}

export default function AdminCompetitions() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Competition | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: "",
    shortName: "",
    slug: "",
    country: "",
    season: new Date().getFullYear().toString(),
    tier: "1",
    isActive: true,
  })

  const fetchCompetitions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
      })
      const res = await fetch(`/api/admin/competitions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCompetitions(data.data ?? [])
        setTotalItems(data.pagination?.totalItems ?? 0)
      }
    } catch {
      toast.error("Failed to load competitions")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => {
    fetchCompetitions()
  }, [fetchCompetitions])

  const toggleActive = async (id: string) => {
    try {
      const competition = competitions.find((c) => c.id === id)
      const res = await fetch(`/api/admin/competitions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !competition?.isActive }),
      })
      if (res.ok) {
        toast.success("Competition updated")
        fetchCompetitions()
      }
    } catch {
      toast.error("Failed to update competition")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editing
        ? `/api/admin/competitions/${editing.id}`
        : "/api/admin/competitions"
      const method = editing ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        toast.success(editing ? "Competition updated" : "Competition created")
        setDialogOpen(false)
        resetForm()
        fetchCompetitions()
      } else {
        const err = await res.json()
        toast.error(err.error ?? "Failed to save competition")
      }
    } catch {
      toast.error("Failed to save competition")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/competitions/${deleteId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("Competition deleted")
        setDeleteId(null)
        fetchCompetitions()
      } else {
        toast.error("Failed to delete competition")
      }
    } catch {
      toast.error("Failed to delete competition")
    }
  }

  const resetForm = () => {
    setForm({
      name: "",
      shortName: "",
      slug: "",
      country: "",
      season: new Date().getFullYear().toString(),
      tier: "1",
      isActive: true,
    })
    setEditing(null)
  }

  const openEdit = (competition: Competition) => {
    setForm({
      name: competition.name,
      shortName: competition.shortName ?? "",
      slug: competition.slug,
      country: competition.country ?? "",
      season: competition.season ?? new Date().getFullYear().toString(),
      tier: String(competition.tier),
      isActive: competition.isActive,
    })
    setEditing(competition)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Competitions</h1>
          <p className="text-sm text-muted-foreground">
            Manage competitions, leagues, and tournaments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCompetitions}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Competition
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Competition" : "Create Competition"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shortName">Short Name</Label>
                    <Input
                      id="shortName"
                      value={form.shortName}
                      onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tier">Tier</Label>
                    <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((t) => (
                          <SelectItem key={t} value={String(t)}>
                            Tier {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="season">Season</Label>
                  <Input
                    id="season"
                    value={form.season}
                    onChange={(e) => setForm({ ...form, season: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                  />
                  <Label>Active</Label>
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
          ...getColumns(toggleActive),
          {
            key: "actions",
            header: "Actions",
            cell: (c) => (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => setDeleteId(c.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={competitions}
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchable
        onSearch={(q) => { setSearch(q); setPage(1) }}
        loading={loading}
        keyExtractor={(c) => c.id}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Competition</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this competition and all associated data. This action cannot be undone.
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
