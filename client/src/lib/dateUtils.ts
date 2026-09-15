/**
 * Date helpers for the real calendar. All math goes through the
 * JS `Date` object (local time, constructed at noon to dodge any
 * DST edge cases) — no hardcoded weekday/date relationships.
 */

export const WEEKDAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"] as const;

/** "2026-09-27" → { y: 2026, m: 9, d: 27 } */
export function parseDateKey(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split("-").map(Number);
  return { y: y ?? 1970, m: m ?? 1, d: d ?? 1 };
}

/** { y: 2026, m: 9, d: 27 } → "2026-09-27" */
export function toDateKey(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Date object for a date key, at noon local time. */
export function dateForKey(key: string): Date {
  const { y, m, d } = parseDateKey(key);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** True if the year is a leap year in the Gregorian calendar. */
export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Days in a month, honoring leap years. month is 1–12. */
export function daysInMonth(y: number, m: number): number {
  if (m === 2 && isLeapYear(y)) return 29;
  return DAYS_IN_MONTH[m - 1] ?? 30;
}

export interface MonthGrid {
  year: number;
  month: number; // 1–12
  monthLabel: string; // "September 2026"
  /** 0–6 — which column the 1st falls in (0 = Sunday). */
  firstWeekday: number;
  /** Nulls pad the leading blanks; every entry is "YYYY-MM-DD". */
  days: (string | null)[];
}

/** Build a full month grid — correct weekday alignment, leap years, transitions. */
export function buildMonthGrid(year: number, month: number): MonthGrid {
  const firstOfMonth = new Date(year, month - 1, 1, 12, 0, 0, 0);
  const firstWeekday = firstOfMonth.getDay(); // 0 = Sunday
  const total = daysInMonth(year, month);

  const days: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: total }, (_, i) => toDateKey(year, month, i + 1)),
  ];

  return {
    year,
    month,
    monthLabel: firstOfMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    firstWeekday,
    days,
  };
}

/** Weekday name from the actual date: "Tue" / "Tuesday". */
export function weekdayName(key: string, long = false): string {
  return dateForKey(key).toLocaleDateString("en-US", { weekday: long ? "long" : "short" });
}

/** "Sat, Sep 19, 2026" */
export function formatPretty(key: string): string {
  return dateForKey(key).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Saturday, September 19" */
export function formatLong(key: string): string {
  return dateForKey(key).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Advance (or rewind) a year/month pair by n months. month is 1–12. */
export function addMonths(y: number, m: number, n: number): { year: number; month: number } {
  const zero = y * 12 + (m - 1) + n;
  return { year: Math.floor(zero / 12), month: (zero % 12) + 1 };
}

/** "6:30 PM" from "18:30". */
export function formatTimePretty(timeStr: string): string {
  const [h = 0, m = 0] = timeStr.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Combine date key + "HH:mm" into one Date (local). */
export function composeDateTime(dateKey: string, timeStr: string): Date {
  const { y, m, d } = parseDateKey(dateKey);
  const [h = 0, mi = 0] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, h, mi, 0, 0);
}

/** Compare date keys lexicographically works for ISO dates; helper for clarity. */
export function isBefore(a: string, b: string): boolean {
  return a < b;
}
