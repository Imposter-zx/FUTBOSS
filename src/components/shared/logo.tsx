interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showTagline?: boolean
}

export function Logo({ className, size = "md", showTagline = false }: LogoProps) {
  const sizes = {
    sm: { text: "text-lg", tagline: "text-[8px]" },
    md: { text: "text-2xl", tagline: "text-[10px]" },
    lg: { text: "text-4xl", tagline: "text-xs" },
  }

  return (
    <div className={cn("flex flex-col items-start", className)}>
      <div className={cn("font-bold tracking-tight", sizes[size].text)}>
        <span className="text-primary">FUT</span>
        <span className="text-accent">BOSS</span>
      </div>
      {showTagline && (
        <span className={cn("text-muted-foreground font-medium tracking-wider uppercase", sizes[size].tagline)}>
          Ultimate Football
        </span>
      )}
    </div>
  )
}

import { cn } from "@/lib/utils"
