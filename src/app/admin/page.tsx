"use client"

import { useEffect, useState } from "react"
import { StatsCard } from "@/components/admin/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  Trophy,
  Swords,
  Activity,
  TrendingUp,
  TrendingDown,
  Bell,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

const initialAnalytics = {
  totalUsers: 0,
  totalMatches: 0,
  totalTeams: 0,
  totalCompetitions: 0,
  activeUsers: 0,
  liveMatches: 0,
  recentMatches: [],
  userGrowth: [],
  matchesByCompetition: [],
  popularCompetitions: [],
  popularTeams: [],
  totalNotifications: 0,
  pageViews: 0,
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(initialAnalytics)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics")
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch {
      // Handle error silently
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [])

  const systemHealth = [
    { label: "Database", status: "healthy", icon: CheckCircle2 },
    { label: "Redis Cache", status: "healthy", icon: CheckCircle2 },
    { label: "WebSocket", status: "healthy", icon: CheckCircle2 },
    { label: "API Rate Limit", status: "warning", icon: AlertCircle },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, Admin. Here&apos;s what&apos;s happening.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={analytics.totalUsers.toLocaleString()}
          description="Registered users"
          icon={<Users className="h-5 w-5" />}
          trend={{ value: 12, label: "vs last month", direction: "up" }}
          loading={loading}
        />
        <StatsCard
          title="Total Matches"
          value={analytics.totalMatches.toLocaleString()}
          description={`${analytics.liveMatches} live now`}
          icon={<Swords className="h-5 w-5" />}
          trend={{ value: 8, label: "vs last month", direction: "up" }}
          loading={loading}
        />
        <StatsCard
          title="Teams"
          value={analytics.totalTeams.toLocaleString()}
          description={`Across ${analytics.totalCompetitions} competitions`}
          icon={<Trophy className="h-5 w-5" />}
          trend={{ value: 3, label: "new this month", direction: "up" }}
          loading={loading}
        />
        <StatsCard
          title="Active Users"
          value={analytics.activeUsers.toLocaleString()}
          description="Joined today"
          icon={<Activity className="h-5 w-5" />}
          trend={{ value: 5, label: "vs yesterday", direction: "up" }}
          loading={loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.userGrowth}>
                  <defs>
                    <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 100%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 100%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => {
                      const d = new Date(v)
                      return `${d.getMonth() + 1}/${d.getDate()}`
                    }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(142, 100%, 45%)"
                    fill="url(#userGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Matches by Competition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.matchesByCompetition}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="competitionName"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(142, 100%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentMatches.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground text-center py-8">No matches found</p>
              )}
              {analytics.recentMatches.map((match: any) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface/30 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {match.homeTeam?.name ?? "Home"}
                    </span>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {match.awayTeam?.name ?? "Away"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {match.homeScore !== null ? (
                      <span className="font-bold tabular-nums">
                        {match.homeScore} - {match.awayScore}
                      </span>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        {new Date(match.date).toLocaleDateString()}
                      </Badge>
                    )}
                    <Badge
                      variant={
                        match.status === "LIVE"
                          ? "live"
                          : match.status === "FINISHED"
                          ? "finished"
                          : "upcoming"
                      }
                      className="ml-2"
                    >
                      {match.status === "LIVE"
                        ? `${match.minute}'`
                        : match.status === "FINISHED"
                        ? "FT"
                        : match.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemHealth.map((item) => {
                const Icon = item.icon
                const isHealthy = item.status === "healthy"
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`h-4 w-4 ${
                          isHealthy ? "text-green-500" : "text-yellow-500"
                        }`}
                      />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <Badge
                      variant={isHealthy ? "finished" : "upcoming"}
                      className="text-[10px]"
                    >
                      {isHealthy ? "Operational" : "Degraded"}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
          <Separator />
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Notifications Sent</span>
                <span className="font-medium">
                  {analytics.totalNotifications.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
