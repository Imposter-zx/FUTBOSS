"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  Goal,
  AlertTriangle,
  Repeat,
  ShieldAlert,
  Monitor,
  ArrowLeftRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

const EVENT_TYPES = [
  { value: "GOAL", label: "Goal", icon: Goal, color: "text-green-500" },
  { value: "YELLOW_CARD", label: "Yellow Card", icon: AlertTriangle, color: "text-yellow-500" },
  { value: "RED_CARD", label: "Red Card", icon: AlertTriangle, color: "text-red-500" },
  { value: "SUBSTITUTION", label: "Substitution", icon: ArrowLeftRight, color: "text-blue-500" },
  { value: "PENALTY", label: "Penalty", icon: ShieldAlert, color: "text-purple-500" },
  { value: "VAR", label: "VAR", icon: Monitor, color: "text-cyan-500" },
  { value: "OWN_GOAL", label: "Own Goal", icon: Goal, color: "text-red-400" },
  { value: "MISSED_PENALTY", label: "Missed Penalty", icon: ShieldAlert, color: "text-orange-500" },
  { value: "SAVE", label: "Save", icon: Repeat, color: "text-blue-400" },
]

const PERIODS = [
  { value: "FIRST_HALF", label: "1st Half" },
  { value: "SECOND_HALF", label: "2nd Half" },
  { value: "EXTRA_TIME", label: "Extra Time" },
  { value: "PENALTIES", label: "Penalties" },
]

interface MatchEventFormProps {
  matchId: string
  teamId: string
  homeTeamId: string
  awayTeamId: string
  homeTeamName: string
  awayTeamName: string
  players: Array<{ id: string; name: string; shirtNumber: number }>
  onSubmit: (data: MatchEventData) => void
}

export interface MatchEventData {
  type: string
  teamId: string
  playerId: string
  assistPlayerId?: string
  minute: number
  extraMinute?: number
  period: string
  description?: string
}

export function MatchEventForm({
  matchId,
  teamId: _teamId,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  players,
  onSubmit,
}: MatchEventFormProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState("GOAL")
  const [teamId, setTeamId] = useState(homeTeamId)
  const [playerId, setPlayerId] = useState("")
  const [assistPlayerId, setAssistPlayerId] = useState("")
  const [minute, setMinute] = useState("")
  const [extraMinute, setExtraMinute] = useState("")
  const [period, setPeriod] = useState("SECOND_HALF")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const selectedTeamPlayers = players
  const selectedEvent = EVENT_TYPES.find((e) => e.value === type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      onSubmit({
        type,
        teamId,
        playerId,
        assistPlayerId: assistPlayerId || undefined,
        minute: parseInt(minute) || 0,
        extraMinute: extraMinute ? parseInt(extraMinute) : undefined,
        period,
        description: description || undefined,
      })
      setOpen(false)
      setType("GOAL")
      setPlayerId("")
      setAssistPlayerId("")
      setMinute("")
      setExtraMinute("")
      setDescription("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Match Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((event) => (
                    <SelectItem key={event.value} value={event.value}>
                      <div className="flex items-center gap-2">
                        <event.icon className={cn("h-4 w-4", event.color)} />
                        {event.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minute</Label>
              <Input
                type="number"
                min="0"
                max="120"
                placeholder="e.g. 45"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Added Time (optional)</Label>
              <Input
                type="number"
                min="0"
                max="15"
                placeholder="e.g. 3"
                value={extraMinute}
                onChange={(e) => setExtraMinute(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Team</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={homeTeamId}>{homeTeamName}</SelectItem>
                <SelectItem value={awayTeamId}>{awayTeamName}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Player</Label>
              <Select value={playerId} onValueChange={setPlayerId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {selectedTeamPlayers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      #{p.shirtNumber} {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(type === "GOAL" || type === "ASSIST") && (
              <div className="space-y-2">
                <Label>Assist (optional)</Label>
                <Select value={assistPlayerId} onValueChange={setAssistPlayerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedTeamPlayers
                      .filter((p) => p.id !== playerId)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          #{p.shirtNumber} {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              placeholder="e.g. Header from corner kick"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-surface/50 p-3">
            {selectedEvent && (
              <selectedEvent.icon className={cn("h-5 w-5", selectedEvent.color)} />
            )}
            <span className="text-sm text-muted-foreground">
              {selectedEvent?.label} - {period === "FIRST_HALF" ? "1st" : "2nd"} Half,{" "}
              {minute || "?"}
              {extraMinute ? `+${extraMinute}` : ""}
            </span>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !playerId || !minute}>
              {submitting ? "Adding..." : "Add Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
