/** Time helpers shared by routes and services. */

/** Compose a Date from "YYYY-MM-DD" + "HH:mm" interpreted in server-local time. */
export function composeDate(dateStr: string, timeStr: string): Date {
  const [y = 1970, mo = 1, d = 1] = dateStr.split("-").map(Number);
  const [h = 0, mi = 0] = timeStr.split(":").map(Number);
  return new Date(y, mo - 1, d, h, mi, 0, 0);
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Sat, Sep 19, 2026" */
export function formatPretty(dateStr: string): string {
  const d = composeDate(dateStr, "12:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "6:30 PM" */
export function formatTimePretty(timeStr: string): string {
  const [h = 0, m = 0] = timeStr.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${suffix}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Strict "YYYY-MM-DD" check — rejects impossible dates like 2026-02-30
 * that plain `new Date()` would silently roll over to March.
 */
export function isValidDateString(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y = 1970, mo = 1, d = 1] = s.split("-").map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1970 || y > 2100) return false;
  const dObj = composeDate(s, "00:00");
  return (
    dObj.getFullYear() === y && dObj.getMonth() === mo - 1 && dObj.getDate() === d
  );
}

export function isValidTimeString(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}
