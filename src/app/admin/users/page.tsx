"use client"

import { useEffect, useState, useCallback } from "react"
import { DataTable, type Column } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  RefreshCw,
  UserCircle,
  Shield,
  Ban,
  CheckCircle2,
  Mail,
  Calendar,
  Activity,
} from "lucide-react"
import { format } from "date-fns"

interface AppUser {
  id: string
  email: string
  name: string | null
  image: string | null
  role: string
  isActive: boolean
  emailVerified: string | null
  createdAt: string
  _count?: {
    accounts: number
    notifications: number
    subscriptions: number
  }
}

const roleColors: Record<string, "default" | "secondary" | "destructive"> = {
  ADMIN: "destructive",
  USER: "default",
  GUEST: "secondary",
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [search, setSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
      })
      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.data ?? [])
        setTotalItems(data.pagination?.totalItems ?? 0)
      }
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const toggleBan = async (user: AppUser) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      if (res.ok) {
        toast.success(user.isActive ? "User banned" : "User unbanned")
        fetchUsers()
        if (selectedUser?.id === user.id) {
          setSelectedUser({ ...user, isActive: !user.isActive })
        }
      } else {
        toast.error("Failed to update user")
      }
    } catch {
      toast.error("Failed to update user")
    }
  }

  const changeRole = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      if (res.ok) {
        toast.success("Role updated")
        fetchUsers()
      } else {
        toast.error("Failed to update role")
      }
    } catch {
      toast.error("Failed to update role")
    }
  }

  const columns: Column<AppUser>[] = [
    {
      key: "user",
      header: "User",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={u.image ?? undefined} />
            <AvatarFallback className="text-xs">
              {u.name?.charAt(0)?.toUpperCase() ?? u.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{u.name ?? "Unnamed"}</p>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "role",
      header: "Role",
      cell: (u) => (
        <Select
          value={u.role}
          onValueChange={(v) => changeRole(u.id, v)}
        >
          <SelectTrigger className="h-7 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="GUEST">Guest</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (u) => (
        <Badge variant={u.isActive ? "finished" : "destructive"}>
          {u.isActive ? "Active" : "Banned"}
        </Badge>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      cell: (u) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(u.createdAt), "MMM d, yyyy")}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (u) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedUser(u)
              setDetailsOpen(true)
            }}
          >
            <UserCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${u.isActive ? "text-destructive" : "text-green-500"}`}
            onClick={(e) => {
              e.stopPropagation()
              toggleBan(u)
            }}
          >
            {u.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage registered users and their roles
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchable
        onSearch={(q) => { setSearch(q); setPage(1) }}
        loading={loading}
        keyExtractor={(u) => u.id}
        onRowClick={(u) => { setSelectedUser(u); setDetailsOpen(true) }}
      />

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.image ?? undefined} />
                  <AvatarFallback className="text-lg">
                    {selectedUser.name?.charAt(0)?.toUpperCase() ?? selectedUser.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name ?? "Unnamed"}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <Badge
                    variant={roleColors[selectedUser.role] ?? "default"}
                    className="mt-1"
                  >
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Email Verified
                  </div>
                  <p className="text-sm font-medium">
                    {selectedUser.emailVerified
                      ? format(new Date(selectedUser.emailVerified), "MMM d, yyyy")
                      : "Not verified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Joined
                  </div>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedUser.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    Status
                  </div>
                  <Badge variant={selectedUser.isActive ? "finished" : "destructive"}>
                    {selectedUser.isActive ? "Active" : "Banned"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    Role
                  </div>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(v) => changeRole(selectedUser.id, v)}
                  >
                    <SelectTrigger className="h-7 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="GUEST">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button
                  variant={selectedUser.isActive ? "destructive" : "default"}
                  onClick={() => toggleBan(selectedUser)}
                >
                  {selectedUser.isActive ? "Ban User" : "Unban User"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
