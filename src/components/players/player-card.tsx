import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface PlayerCardProps {
  id: string
  name: string
  image?: string
  position: string
  number?: number
  team: { id: string; name: string }
  nationality: string
  age?: number
  rating?: number
  className?: string
  variant?: "default" | "compact"
}

export function PlayerCard({
  id,
  name,
  image,
  position,
  number,
  team,
  nationality,
  age,
  rating,
  className,
  variant = "default",
}: PlayerCardProps) {
  return (
    <Link href={`/players/${id}`}>
      <Card className={cn(
        "group cursor-pointer transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        className
      )}>
        <CardContent className={cn(variant === "compact" ? "p-3" : "p-5")}>
          <div className="flex items-center gap-4">
            <Avatar className={cn(variant === "compact" ? "h-12 w-12" : "h-16 w-16")}>
              {image && <AvatarImage src={image} />}
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-lg font-bold text-foreground">
                {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "font-semibold text-foreground group-hover:text-primary transition-colors truncate",
                  variant === "compact" ? "text-sm" : "text-base"
                )}>
                  {name}
                </h3>
                {rating && (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">
                    {rating.toFixed(1)}
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-[10px]">{position}</Badge>
                {number && <span>#{number}</span>}
                <span>{nationality}</span>
                {age && <span>{age} yrs</span>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{team.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
