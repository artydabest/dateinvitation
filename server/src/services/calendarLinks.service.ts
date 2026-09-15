/**
 * Zero-auth calendar fallbacks: a pre-filled Google Calendar link and an
 * RFC 5545 .ics file. These always work, with or without OAuth setup.
 */

/** Build a https://calendar.google.com/render?action=TEMPLATE... link. */
export function buildGoogleCalendarTemplateUrl(event: {
  title: string;
  description: string;
  start: Date;
  durationMinutes: number;
}): string {
  const fmt = (d: Date) => `${formatLocalStamp(d)}${offsetToIcs(d)}`;
  const end = new Date(event.start.getTime() + event.durationMinutes * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description,
    dates: `${fmt(event.start)}/${fmt(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Build full RFC 5545 .ics content for the event. */
export function buildIcsContent(event: {
  title: string;
  description: string;
  start: Date;
  durationMinutes: number;
}): string {
  const end = new Date(
    event.start.getTime() + event.durationMinutes * 60_000,
  );
  const stamp = new Date();
  const line = (s: string) => `${s}\r\n`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//roshan//date-invitation//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${stamp.getTime()}-sakshi-roshan@date-invitation`,
    `DTSTAMP:${toIcsUtc(stamp)}`,
    `DTSTART:${toIcsUtc(event.start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Date with Roshan tomorrow 🌻",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map(line)
    .join("");
}

/* ── helpers ── */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** UTC "YYYYMMDDTHHMMSSZ" — unambiguous for .ics. */
function toIcsUtc(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** Local "YYYYMMDDTHHMMSS" (no Z) for Google's dates param. */
function formatLocalStamp(d: Date): string {
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

/** "+HHMM"/"-HHMM"/"Z" style offset for the current server timezone. */
function offsetToIcs(d: Date): string {
  const offsetMin = -d.getTimezoneOffset();
  if (offsetMin === 0) return "Z";
  const sign = offsetMin > 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  return `${sign}${pad(Math.floor(abs / 60))}${pad(abs % 60)}`;
}

function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}
