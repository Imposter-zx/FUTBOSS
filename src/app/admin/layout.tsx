"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import {
  Bell,
  Search,
  ChevronRight,
  Home,
  Loader2,
  ShieldAlert,
  LogOut,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const breadcrumbMap: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/competitions": "Competitions",
  "/admin/matches": "Matches",
  "/admin/teams": "Teams",
  "/admin/players": "Players",
  "/admin/users": "Users",
  "/admin/notifications": "Notifications",
  "/admin/analytics": "Analytics",
  "/admin/settings": "Settings",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [notificationCount] = useState(3)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <ShieldAlert className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            You do not have permission to access this area. Admin privileges are required.
          </p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    )
  }

  const pathParts = pathname.split("/").filter(Boolean)
  const breadcrumbs = pathParts.map((_, i) => {
    const href = "/" + pathParts.slice(0, i + 1).join("/")
    return { href, label: breadcrumbMap[href] ?? pathParts[i] }
  })

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-3">
            {breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Link href="/admin" className="hover:text-foreground transition-colors">
                  <Home className="h-4 w-4" />
                </Link>
                {breadcrumbs.map((crumb, i) => (
                  <div key={crumb.href} className="flex items-center gap-1.5">
                    <ChevronRight className="h-3.5 w-3.5" />
                    {i < breadcrumbs.length - 1 ? (
                      <Link
                        href={crumb.href}
                        className="hover:text-foreground transition-colors capitalize"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-foreground capitalize">{crumb.label}</span>
                    )}
                  </div>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="h-9 w-48 pl-8 text-sm"
              />
            </div>

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px] font-bold flex items-center justify-center"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image ?? undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {session.user.name?.charAt(0)?.toUpperCase() ?? "A"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{session.user.name}</span>
                    <span className="text-xs text-muted-foreground">{session.user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/")}>
                  <Home className="mr-2 h-4 w-4" />
                  Back to Site
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/auth/login" })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  )
}
