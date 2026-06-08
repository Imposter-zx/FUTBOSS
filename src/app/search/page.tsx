import { Suspense } from "react"
import Link from "next/link"
import { Search, Trophy, Users, User, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { playerService } from "@/services/player.service"
import type { Player } from "@/types"

interface Props {
  searchParams: Promise<{ q?: string; type?: string }>
}

async function SearchResults({ query, type }: { query: string; type?: string }) {
  const result = await playerService.search(query, { page: 1, pageSize: 20 })
  const players = result.success ? (result.data as { items: Player[] }).items ?? [] : []

  if (!query) {
    return (
      <EmptyState
        icon={<Search className="h-16 w-16" />}
        title="Search for something"
        description="Search for players, teams, competitions, and more"
      />
    )
  }

  if (players.length === 0) {
    return (
      <EmptyState
        icon={<Search className="h-16 w-16" />}
        title="No results found"
        description={`We couldn't find any results for "${query}". Try a different search term.`}
      />
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Found {players.length} result{players.length !== 1 ? "s" : ""} for &quot;{query}&quot;
      </p>

      <div className="space-y-2">
        {players.map((player) => (
          <Link key={player.id} href={`/players/${player.id}`}>
            <Card className="group cursor-pointer transition-all hover:border-primary/30">
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-surface text-sm text-foreground">
                    {player.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {player.name}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">{player.position}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {player.team?.name} &middot; {player.nationality}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, type } = await searchParams
  const query = q ?? ""

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Search</h1>
        <p className="text-sm text-muted-foreground">Find players, teams, competitions, and matches</p>
      </div>

      <form className="relative" action="/search" method="GET">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={query}
          placeholder="Search players, teams, competitions..."
          className="h-12 pl-12 text-base"
          autoFocus
        />
      </form>

      <div className="flex gap-2">
        <Button variant={!type ? "default" : "outline"} size="sm" asChild>
          <Link href={`/search?q=${encodeURIComponent(query)}`}>All</Link>
        </Button>
        <Button variant={type === "player" ? "default" : "outline"} size="sm" asChild>
          <Link href={`/search?q=${encodeURIComponent(query)}&type=player`}>
            <User className="mr-1 h-3 w-3" /> Players
          </Link>
        </Button>
        <Button variant={type === "team" ? "default" : "outline"} size="sm" asChild>
          <Link href={`/search?q=${encodeURIComponent(query)}&type=team`}>
            <Users className="mr-1 h-3 w-3" /> Teams
          </Link>
        </Button>
        <Button variant={type === "competition" ? "default" : "outline"} size="sm" asChild>
          <Link href={`/search?q=${encodeURIComponent(query)}&type=competition`}>
            <Trophy className="mr-1 h-3 w-3" /> Competitions
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <SearchResults query={query} type={type} />
      </Suspense>
    </div>
  )
}
