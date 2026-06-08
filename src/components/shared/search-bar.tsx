"use client"

import { useState, useEffect } from "react"
import { Search, Command as CommandIcon, Trophy, Users, User, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface SearchResult {
  id: string
  type: "competition" | "team" | "player" | "match"
  label: string
  sublabel?: string
  href: string
}

const mockResults: SearchResult[] = [
  { id: "1", type: "competition", label: "Premier League", sublabel: "England", href: "/competitions/1" },
  { id: "2", type: "competition", label: "La Liga", sublabel: "Spain", href: "/competitions/2" },
  { id: "3", type: "team", label: "Manchester United", sublabel: "Premier League", href: "/teams/1" },
  { id: "4", type: "team", label: "FC Barcelona", sublabel: "La Liga", href: "/teams/2" },
  { id: "5", type: "player", label: "Erling Haaland", sublabel: "Manchester City", href: "/players/1" },
  { id: "6", type: "player", label: "Kylian Mbappé", sublabel: "Real Madrid", href: "/players/2" },
]

const typeIcons = {
  competition: Trophy,
  team: Users,
  player: User,
  match: Globe,
}

export function SearchBar() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-lg border-border bg-surface text-sm text-muted-foreground sm:w-64 lg:w-80"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Search teams, players...</span>
        <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type to search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Competitions">
            {mockResults
              .filter((r) => r.type === "competition")
              .map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => {
                    setOpen(false)
                    window.location.href = result.href
                  }}
                >
                  <Trophy className="mr-2 h-4 w-4 text-accent" />
                  <span>{result.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{result.sublabel}</span>
                </CommandItem>
              ))}
          </CommandGroup>
          <CommandGroup heading="Teams">
            {mockResults
              .filter((r) => r.type === "team")
              .map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => {
                    setOpen(false)
                    window.location.href = result.href
                  }}
                >
                  <Users className="mr-2 h-4 w-4 text-secondary" />
                  <span>{result.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{result.sublabel}</span>
                </CommandItem>
              ))}
          </CommandGroup>
          <CommandGroup heading="Players">
            {mockResults
              .filter((r) => r.type === "player")
              .map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => {
                    setOpen(false)
                    window.location.href = result.href
                  }}
                >
                  <User className="mr-2 h-4 w-4 text-primary" />
                  <span>{result.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{result.sublabel}</span>
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
