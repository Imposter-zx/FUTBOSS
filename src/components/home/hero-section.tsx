"use client"

import { ArrowRight, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface HeroSectionProps {
  className?: string
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <section className={cn("relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface via-background to-surface p-8 sm:p-12 lg:p-16", className)}>
      <div className="absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[300px] w-[300px] -translate-x-1/4 translate-y-1/4 rounded-full bg-secondary/5 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left">
        <Badge variant="gold" className="mb-4 animate-fade-in">
          Live Scores & Stats
        </Badge>

        <h1 className="max-w-3xl text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Your Ultimate{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Football
          </span>{" "}
          Companion
        </h1>

        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Follow live scores, stats, standings, and everything football. From the Premier League to
          the Champions League, we&apos;ve got you covered.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="gap-2">
            <Play className="h-5 w-5 fill-current" />
            Live Now
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg">
            Browse Competitions
          </Button>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-8">
          {[
            { number: "10K+", label: "Live Matches" },
            { number: "500+", label: "Competitions" },
            { number: "50K+", label: "Players" },
            { number: "1M+", label: "Users" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-foreground">{stat.number}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
