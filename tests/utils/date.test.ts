import { describe, it, expect, vi, afterEach } from "vitest";

process.env.TZ = "UTC";

import {
  formatMatchTime,
  formatMatchDate,
  formatFullDate,
  formatDateTime,
  formatRelativeTime,
  formatMatchMinute,
  isMatchLive,
  isMatchFinished,
  isMatchUpcoming,
  formatDuration,
  getSeasonLabel,
} from "@/utils/date";

afterEach(() => {
  vi.useRealTimers();
});

describe("formatMatchTime", () => {
  it("formats a Date object", () => {
    const d = new Date("2026-06-10T15:30:00Z");
    expect(formatMatchTime(d)).toBe("15:30");
  });

  it("formats an ISO string", () => {
    expect(formatMatchTime("2026-06-10T20:00:00Z")).toBe("20:00");
  });
});

describe("formatMatchDate", () => {
  it("returns 'Today' for current date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00Z"));
    expect(formatMatchDate("2026-06-10T15:00:00Z")).toBe("Today");
  });

  it("returns 'Tomorrow' for next day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00Z"));
    expect(formatMatchDate("2026-06-11T15:00:00Z")).toBe("Tomorrow");
  });

  it("returns 'Yesterday' for previous day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00Z"));
    expect(formatMatchDate("2026-06-09T15:00:00Z")).toBe("Yesterday");
  });

  it("returns formatted date for other days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00Z"));
    expect(formatMatchDate("2026-06-15T15:00:00Z")).toBe("Mon, 15 Jun");
  });
});

describe("formatFullDate", () => {
  it("formats with full date pattern", () => {
    expect(formatFullDate("2026-06-10T15:00:00Z")).toBe("Wed, 10 Jun 2026");
  });
});

describe("formatDateTime", () => {
  it("includes date and time", () => {
    const result = formatDateTime("2026-06-10T15:30:00Z");
    expect(result).toBe("10 Jun 2026, 15:30");
  });
});

describe("formatRelativeTime", () => {
  it("includes 'ago' suffix for past dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00Z"));
    const past = new Date(Date.now() - 3600000).toISOString();
    expect(formatRelativeTime(past)).toContain("hour ago");
  });
});

describe("formatMatchMinute", () => {
  it("returns minute with apostrophe for LIVE", () => {
    expect(formatMatchMinute(35, "LIVE")).toBe("35'");
  });

  it("returns HT for HALF_TIME", () => {
    expect(formatMatchMinute(45, "HALF_TIME")).toBe("HT");
  });

  it("returns FT for FINISHED", () => {
    expect(formatMatchMinute(90, "FINISHED")).toBe("FT");
  });

  it("returns empty string for SCHEDULED", () => {
    expect(formatMatchMinute(null, "SCHEDULED")).toBe("");
  });

  it("returns empty for POSTPONED without minute", () => {
    expect(formatMatchMinute(null, "POSTPONED")).toBe("");
  });

  it("returns empty for CANCELLED without minute", () => {
    expect(formatMatchMinute(null, "CANCELLED")).toBe("");
  });

  it("returns empty for ABANDONED without minute", () => {
    expect(formatMatchMinute(null, "ABANDONED")).toBe("");
  });

  it("returns empty when minute is null and not a special status", () => {
    expect(formatMatchMinute(null, "LIVE")).toBe("");
  });
});

describe("isMatchLive", () => {
  it("returns true for LIVE", () => {
    expect(isMatchLive("LIVE")).toBe(true);
  });

  it("returns true for HALF_TIME", () => {
    expect(isMatchLive("HALF_TIME")).toBe(true);
  });

  it("returns true for EXTRA_TIME", () => {
    expect(isMatchLive("EXTRA_TIME")).toBe(true);
  });

  it("returns false for FINISHED", () => {
    expect(isMatchLive("FINISHED")).toBe(false);
  });

  it("returns false for SCHEDULED", () => {
    expect(isMatchLive("SCHEDULED")).toBe(false);
  });
});

describe("isMatchFinished", () => {
  it("returns true for FINISHED", () => {
    expect(isMatchFinished("FINISHED")).toBe(true);
  });

  it("returns false for LIVE", () => {
    expect(isMatchFinished("LIVE")).toBe(false);
  });
});

describe("isMatchUpcoming", () => {
  it("returns true for SCHEDULED", () => {
    expect(isMatchUpcoming("SCHEDULED")).toBe(true);
  });

  it("returns false for LIVE", () => {
    expect(isMatchUpcoming("LIVE")).toBe(false);
  });
});

describe("formatDuration", () => {
  it("returns minutes for less than 60", () => {
    expect(formatDuration(45)).toBe("45m");
  });

  it("returns hours and minutes", () => {
    expect(formatDuration(90)).toBe("1h 30m");
  });

  it("returns only hours for exact hours", () => {
    expect(formatDuration(120)).toBe("2h");
  });

  it("handles 0 minutes", () => {
    expect(formatDuration(0)).toBe("0m");
  });
});

describe("getSeasonLabel", () => {
  it("formats '20242025' as '2024/2025'", () => {
    expect(getSeasonLabel("20242025")).toBe("2024/2025");
  });

  it("returns the year when no end year", () => {
    expect(getSeasonLabel("2024")).toBe("2024");
  });
});
