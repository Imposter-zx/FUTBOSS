import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  differenceInMinutes,
  differenceInHours,
  parseISO,
} from "date-fns";

export function formatMatchTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "HH:mm");
}

export function formatMatchDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;

  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isYesterday(d)) return "Yesterday";

  return format(d, "EEE, d MMM");
}

export function formatFullDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEE, d MMM yyyy");
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d MMM yyyy, HH:mm");
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatKickoff(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "HH:mm");
}

export function formatMatchMinute(minute: number | null, status: string): string {
  if (!minute && minute !== 0) return "";

  switch (status) {
    case "LIVE":
      return `${minute}'`;
    case "HALF_TIME":
      return "HT";
    case "EXTRA_TIME":
      return `${minute}+'`;
    case "PENALTIES":
      return "Pen";
    case "FINISHED":
      return "FT";
    case "SCHEDULED":
      return "";
    case "POSTPONED":
      return "PPD";
    case "CANCELLED":
      return "CANC";
    case "ABANDONED":
      return "ABAN";
    default:
      return `${minute}'`;
  }
}

export function getTimeRemaining(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();
  const diffMinutes = differenceInMinutes(d, now);

  if (diffMinutes <= 0) return "Starting soon";
  if (diffMinutes < 60) return `In ${diffMinutes}m`;
  const hours = differenceInHours(d, now);
  if (hours < 24) return `In ${hours}h`;
  return formatMatchDate(d);
}

export function isMatchLive(status: string): boolean {
  return ["LIVE", "HALF_TIME", "EXTRA_TIME", "PENALTIES"].includes(status);
}

export function isMatchFinished(status: string): boolean {
  return status === "FINISHED";
}

export function isMatchUpcoming(status: string): boolean {
  return status === "SCHEDULED";
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function getSeasonLabel(season: string): string {
  const startYear = season.slice(0, 4);
  const endYear = season.slice(4);
  if (endYear) {
    return `${startYear}/${endYear}`;
  }
  return startYear;
}
