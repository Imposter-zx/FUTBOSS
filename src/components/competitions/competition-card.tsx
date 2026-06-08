import Link from "next/link"
import { Trophy, Globe, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CompetitionCardProps {
  id: string
  name: string
  country: string
  season: string
  logo?: string
  teamCount?: number
  matchCount?: number
  className?: string
}

export function CompetitionCard({
  id,
  name,
  country,
  season,
  teamCount,
  matchCount,
  className,
}: CompetitionCardProps) {
  return (
    <Link href={`/competitions/${id}`}>
      <Card className={cn(
        "group cursor-pointer transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        className
      )}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 shadow-sm">
              <Trophy className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 space-y-1.5">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {name}
              </h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span>{country}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{season}</span>
              </div>
            </div>
          </div>
          {(teamCount ?? matchCount) && (
            <div className="mt-4 flex gap-2">
              {teamCount && <Badge variant="secondary" className="text-[10px]">{teamCount} teams</Badge>}
              {matchCount && <Badge variant="outline" className="text-[10px]">{matchCount} matches</Badge>}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
