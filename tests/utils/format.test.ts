import { describe, it, expect } from "vitest";
import {
  formatCompactNumber,
  formatCurrency,
  formatPercentage,
  formatRating,
  formatWinRate,
  formatForm,
  formatFormBadge,
  formatPosition,
  formatGoalContribution,
  formatMinutesPlayed,
  formatAttendance,
  formatHeight,
  formatMarketValue,
} from "@/utils/format";

describe("formatCompactNumber", () => {
  it("returns '0' for 0", () => {
    expect(formatCompactNumber(0)).toBe("0");
  });

  it("returns the number as string for < 1000", () => {
    expect(formatCompactNumber(999)).toBe("999");
  });

  it("formats thousands", () => {
    expect(formatCompactNumber(1500)).toBe("1.5K");
  });

  it("formats millions", () => {
    expect(formatCompactNumber(2500000)).toBe("2.5M");
  });

  it("formats billions", () => {
    expect(formatCompactNumber(3000000000)).toBe("3B");
  });

  it("handles round numbers without decimals", () => {
    expect(formatCompactNumber(2000)).toBe("2K");
  });
});

describe("formatCurrency", () => {
  it("formats millions", () => {
    expect(formatCurrency(50000000)).toBe("50.0M EUR");
  });

  it("formats thousands", () => {
    expect(formatCurrency(5000)).toBe("5K EUR");
  });

  it("formats small amounts", () => {
    expect(formatCurrency(500)).toBe("500 EUR");
  });

  it("supports custom currency", () => {
    expect(formatCurrency(1000000, "GBP")).toBe("1.0M GBP");
  });
});

describe("formatPercentage", () => {
  it("formats with default 1 decimal", () => {
    expect(formatPercentage(75.5)).toBe("75.5%");
  });

  it("formats with custom decimals", () => {
    expect(formatPercentage(75.555, 2)).toBe("75.56%");
  });
});

describe("formatRating", () => {
  it("formats with one decimal", () => {
    expect(formatRating(7.5)).toBe("7.5");
  });
});

describe("formatWinRate", () => {
  it("returns '0%' when total is 0", () => {
    expect(formatWinRate(0, 0)).toBe("0%");
  });

  it("calculates win rate percentage", () => {
    expect(formatWinRate(5, 10)).toBe("50.0%");
  });
});

describe("formatForm", () => {
  it("joins results with dashes", () => {
    expect(formatForm(["W", "D", "L"])).toBe("W-D-L");
  });
});

describe("formatFormBadge", () => {
  it("returns green for W", () => {
    expect(formatFormBadge("W")).toEqual({ label: "W", color: "bg-green-500" });
  });

  it("returns yellow for D", () => {
    expect(formatFormBadge("D")).toEqual({ label: "D", color: "bg-yellow-500" });
  });

  it("returns red for L", () => {
    expect(formatFormBadge("L")).toEqual({ label: "L", color: "bg-red-500" });
  });

  it("returns gray default", () => {
    expect(formatFormBadge("X")).toEqual({ label: "-", color: "bg-gray-500" });
  });
});

describe("formatPosition", () => {
  it("formats 1st", () => {
    expect(formatPosition(1)).toBe("1st");
  });

  it("formats 2nd", () => {
    expect(formatPosition(2)).toBe("2nd");
  });

  it("formats 3rd", () => {
    expect(formatPosition(3)).toBe("3rd");
  });

  it("formats 4th and beyond", () => {
    expect(formatPosition(4)).toBe("4th");
  });

  it("formats 11th", () => {
    expect(formatPosition(11)).toBe("11th");
  });
});

describe("formatGoalContribution", () => {
  it("returns '0' for zero contribution", () => {
    expect(formatGoalContribution(0, 0)).toBe("0");
  });

  it("formats goals and assists", () => {
    expect(formatGoalContribution(5, 3)).toBe("8 (5G, 3A)");
  });
});

describe("formatMinutesPlayed", () => {
  it("returns 0' for zero", () => {
    expect(formatMinutesPlayed(0)).toBe("0'");
  });

  it("returns minutes for less than 90", () => {
    expect(formatMinutesPlayed(45)).toBe("45'");
  });

  it("returns match count for exact multiples of 90", () => {
    expect(formatMinutesPlayed(180)).toBe("2");
  });

  it("returns match count plus remainder", () => {
    expect(formatMinutesPlayed(95)).toBe("1+5'");
  });
});

describe("formatAttendance", () => {
  it("formats thousands as K", () => {
    expect(formatAttendance(50000)).toBe("50.0K");
  });

  it("formats small numbers", () => {
    expect(formatAttendance(500)).toBe("500");
  });
});

describe("formatHeight", () => {
  it("returns em dash for null", () => {
    expect(formatHeight(null)).toBe("—");
  });

  it("converts cm to feet/inches", () => {
    expect(formatHeight(183)).toBe("183cm (6'0\")");
  });
});

describe("formatMarketValue", () => {
  it("returns em dash for null", () => {
    expect(formatMarketValue(null)).toBe("—");
  });

  it("formats value using currency format", () => {
    const result = formatMarketValue(50000000);
    expect(result).toContain("M EUR");
  });
});
