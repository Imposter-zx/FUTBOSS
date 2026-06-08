"use client"

import { cn } from "@/lib/utils"

interface LiveIndicatorProps {
  className?: string
  size?: "sm" | "md" | "lg"
  pulse?: boolean
}

export function LiveIndicator({ className, size = "md", pulse = true }: LiveIndicatorProps) {
  const sizeClass = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-3 w-3",
  }

  return (
    <span className={cn("relative inline-flex", className)}>
      {pulse && (
        <span className={cn(
          "absolute inline-flex animate-ping rounded-full bg-red-400 opacity-75",
          sizeClass
        )} />
      )}
      <span className={cn("relative inline-flex rounded-full bg-red-500", sizeClass)} />
    </span>
  )
}
