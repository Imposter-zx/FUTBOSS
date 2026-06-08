export function formatCompactNumber(num: number): string {
  if (num === 0) return "0";
  if (num < 1000) return num.toString();

  const suffixes = ["", "K", "M", "B", "T"];
  const tier = Math.floor(Math.log10(Math.abs(num)) / 3);

  if (tier >= suffixes.length) return num.toString();

  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = num / scale;

  return scaled % 1 === 0
    ? `${scaled.toFixed(0)}${suffix}`
    : `${scaled.toFixed(1)}${suffix}`;
}

export function formatCurrency(amount: number, currency: string = "EUR"): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M ${currency}`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K ${currency}`;
  }
  return `${amount.toLocaleString()} ${currency}`;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatRating(value: number): string {
  return value.toFixed(1);
}

export function formatWinRate(wins: number, total: number): string {
  if (total === 0) return "0%";
  return formatPercentage((wins / total) * 100, 1);
}

export function formatForm(results: string[]): string {
  return results.join("-");
}

export function formatFormBadge(result: string): { label: string; color: string } {
  switch (result) {
    case "W":
      return { label: "W", color: "bg-green-500" };
    case "D":
      return { label: "D", color: "bg-yellow-500" };
    case "L":
      return { label: "L", color: "bg-red-500" };
    default:
      return { label: "-", color: "bg-gray-500" };
  }
}

export function formatPosition(pos: number): string {
  if (pos === 1) return "1st";
  if (pos === 2) return "2nd";
  if (pos === 3) return "3rd";
  return `${pos}th`;
}

export function formatGoalContribution(goals: number, assists: number): string {
  const total = goals + assists;
  if (total === 0) return "0";
  return `${total} (${goals}G, ${assists}A)`;
}

export function formatMinutesPlayed(minutes: number): string {
  if (minutes === 0) return "0'";
  const matches = Math.floor(minutes / 90);
  const remainder = minutes % 90;
  if (matches === 0) return `${minutes}'`;
  if (remainder === 0) return `${matches}`;
  return `${matches}+${remainder}'`;
}

export function formatAttendance(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

export function formatHeight(cm: number | null): string {
  if (!cm) return "—";
  const feet = Math.floor(cm / 30.48);
  const inches = Math.round((cm % 30.48) / 2.54);
  return `${cm}cm (${feet}'${inches}")`;
}

export function formatMarketValue(value: number | null): string {
  if (!value) return "—";
  return formatCurrency(value);
}
