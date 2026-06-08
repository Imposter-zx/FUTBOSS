"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Bell,
  Send,
  History,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Megaphone,
} from "lucide-react"
import { format } from "date-fns"

const NOTIFICATION_TYPES = [
  { value: "SYSTEM", label: "System" },
  { value: "MATCH_START", label: "Match Start" },
  { value: "MATCH_GOAL", label: "Match Goal" },
  { value: "MATCH_END", label: "Match End" },
  { value: "MATCH_REMINDER", label: "Match Reminder" },
  { value: "NEWS", label: "News" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "SUBSCRIPTION", label: "Subscription" },
]

const TARGET_TYPES = [
  { value: "ALL", label: "All Users" },
  { value: "USERS", label: "Specific Users" },
  { value: "TEAM", label: "Team Followers" },
  { value: "COMPETITION", label: "Competition Followers" },
  { value: "PLAYER", label: "Player Followers" },
]

interface NotificationHistory {
  id: string
  title: string
  message: string
  type: string
  createdAt: string
  _count?: { notifications: number }
}

export default function AdminNotifications() {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [type, setType] = useState("SYSTEM")
  const [targetType, setTargetType] = useState("ALL")
  const [targetIds, setTargetIds] = useState("")
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<NotificationHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch("/api/admin/notifications?pageSize=20&sortBy=createdAt&sortOrder=desc")
      if (res.ok) {
        const data = await res.json()
        setHistory(data.data ?? [])
      }
    } catch {
      // silent
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required")
      return
    }

    setSending(true)
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        message: message.trim(),
        type,
        target: {
          type: targetType,
          ids: targetType !== "ALL" && targetIds.trim()
            ? targetIds.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
        },
      }

      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(`Notification sent to ${data.sent} users`)
        setTitle("")
        setMessage("")
        fetchHistory()
      } else {
        const err = await res.json()
        toast.error(err.error ?? "Failed to send notification")
      }
    } catch {
      toast.error("Failed to send notification")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Broadcast notifications to users
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Send Notification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Notification title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Write your notification message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground text-right">
                  {message.length}/2000
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTIFICATION_TYPES.map((nt) => (
                        <SelectItem key={nt.value} value={nt.value}>
                          {nt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target</Label>
                  <Select value={targetType} onValueChange={setTargetType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_TYPES.map((tt) => (
                        <SelectItem key={tt.value} value={tt.value}>
                          {tt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {targetType !== "ALL" && (
                <div className="space-y-2">
                  <Label>
                    Target IDs (comma-separated)
                  </Label>
                  <Input
                    placeholder="e.g. team1, team2, team3"
                    value={targetIds}
                    onChange={(e) => setTargetIds(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter comma-separated IDs of teams, competitions, players, or users
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3">
                <Megaphone className="h-5 w-5 text-primary" />
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Preview:</span>{" "}
                  [{type}] {title || "No title"} — {message.slice(0, 100)}
                  {message.length > 100 ? "..." : ""}
                </div>
              </div>

              <Button type="submit" disabled={sending} className="w-full">
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Notification
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Recent Notifications
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={fetchHistory}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No notifications sent yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-lg border border-border bg-surface/30 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {notification.type}
                          </Badge>
                          <p className="text-sm font-medium truncate">
                            {notification.title}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(notification.createdAt), "MMM d, HH:mm")}
                      </span>
                      {notification._count && (
                        <span className="text-[10px] text-muted-foreground">
                          {notification._count.notifications} recipients
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
