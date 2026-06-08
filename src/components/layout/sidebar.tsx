"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, Trophy, Globe, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

interface Competition {
  id: string
  name: string
  country: string
  icon: React.ReactNode
}

const competitions: Competition[] = [
  { id: "1", name: "Premier League", country: "England", icon: <Shield className="h-4 w-4" /> },
  { id: "2", name: "La Liga", country: "Spain", icon: <Trophy className="h-4 w-4" /> },
  { id: "3", name: "Serie A", country: "Italy", icon: <Shield className="h-4 w-4" /> },
  { id: "4", name: "Bundesliga", country: "Germany", icon: <Trophy className="h-4 w-4" /> },
  { id: "5", name: "Ligue 1", country: "France", icon: <Shield className="h-4 w-4" /> },
  { id: "6", name: "UCL", country: "Europe", icon: <Globe className="h-4 w-4" /> },
  { id: "7", name: "UEL", country: "Europe", icon: <Globe className="h-4 w-4" /> },
  { id: "8", name: "World Cup", country: "International", icon: <Globe className="h-4 w-4" /> },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <span className="text-sm font-semibold text-foreground">Competitions</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", collapsed && "mx-auto")}
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <nav className="space-y-1 p-2">
          {competitions.map((comp) => {
            const isActive = pathname?.includes(`/competitions/${comp.id}`)
            return (
              <Link
                key={comp.id}
                href={`/competitions/${comp.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? comp.name : undefined}
              >
                <span className={cn(isActive ? "text-primary" : "text-muted-foreground")}>
                  {comp.icon}
                </span>
                {!collapsed && (
                  <div className="flex flex-col">
                    <span>{comp.name}</span>
                    <span className="text-[10px] text-muted-foreground">{comp.country}</span>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
    </aside>
  )
}
