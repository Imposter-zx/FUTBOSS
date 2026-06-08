import { Shield, MapPin, Calendar, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface TeamHeaderProps {
  id: string
  name: string
  fullName?: string
  country: string
  founded?: number
  stadium?: string
  capacity?: number
  manager?: string
  league?: string
  className?: string
}

export function TeamHeader({
  name,
  fullName,
  country,
  founded,
  stadium,
  capacity,
  manager,
  league,
  className,
}: TeamHeaderProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-background to-surface p-6 sm:p-8",
      className
    )}>
      <div className="absolute right-0 top-0 h-64 w-64 translate-x-16 -translate-y-16 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-8 translate-y-8 rounded-full bg-secondary/5 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-xl ring-1 ring-border">
          <Shield className="h-12 w-12 text-primary" />
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{name}</h1>
            {fullName && <p className="text-sm text-muted-foreground">{fullName}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3" /> {country}
            </Badge>
            {league && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <Users className="h-3 w-3" /> {league}
              </Badge>
            )}
            {founded && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" /> Founded {founded}
              </Badge>
            )}
          </div>

          {(stadium || manager) && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {stadium && (
                <span>
                  <span className="font-medium text-foreground">Stadium:</span> {stadium}
                  {capacity && ` (${capacity.toLocaleString()})`}
                </span>
              )}
              {manager && (
                <span>
                  <span className="font-medium text-foreground">Manager:</span> {manager}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
