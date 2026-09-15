/**
 * Google Calendar integration.
 *
 * Security model:
 *  - Client id/secret + refresh token live ONLY on the server (env / token file).
 *  - The browser never sees a client secret or any OAuth token.
 *  - The only scope requested is calendar.events (insert events), per least-privilege.
 *  - Every failure path returns an honest status; nothing pretends success.
 *
 * If Google credentials are not configured, the client falls back to the
 * pre-filled calendar link + .ics download — both handled elsewhere.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";
import { env } from "../env.js";
import { serverRoot } from "../paths.js";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

type StoredToken = { refresh_token: string; granted_at: string };

/** Small JSON-file token store; swap for a DB collection in production. */
const tokenStore = {
  async read(): Promise<StoredToken | null> {
    try {
      const raw = await fs.readFile(tokenFilePath(), "utf8");
      const parsed = JSON.parse(raw) as StoredToken;
      return parsed.refresh_token ? parsed : null;
    } catch {
      return null;
    }
  },
  async write(token: StoredToken): Promise<void> {
    await fs.writeFile(
      tokenFilePath(),
      JSON.stringify(token, null, 2),
      { mode: 0o600 },
    );
  },
  async clear(): Promise<void> {
    try {
      await fs.unlink(tokenFilePath());
    } catch {
      /* already gone */
    }
  },
};

function tokenFilePath(): string {
  return path.resolve(serverRoot, env.googleTokenStoreFile);
}

function makeOAuthClient() {
  return new google.auth.OAuth2(
    env.google.clientId,
    env.google.clientSecret,
    env.google.redirectUri,
  );
}

export function isGoogleConfigured(): boolean {
  return Boolean(env.google.clientId && env.google.clientSecret);
}

export async function isGoogleAuthorized(): Promise<boolean> {
  return (await tokenStore.read()) !== null;
}

/** Build the consent URL Roshan visits exactly once. */
export function buildAuthUrl(state?: string): string {
  const client = makeOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

/**
 * Exchange the one-time code for tokens and persist ONLY the refresh token
 * server-side. Access tokens are always minted fresh per request.
 */
export async function exchangeCodeAndStore(code: string): Promise<void> {
  const client = makeOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error(
      "No refresh token returned — revoke the app at myaccount.google.com/permissions and reconnect with prompt=consent.",
    );
  }
  await tokenStore.write({
    refresh_token: tokens.refresh_token,
    granted_at: new Date().toISOString(),
  });
}

export interface CalendarPushResult {
  ok: boolean;
  eventId?: string;
  htmlLink?: string;
  error?: string;
}

/** Insert the event into the authorized calendar. Never throws. */
export async function pushEventToCalendar(event: {
  title: string;
  description: string;
  start: Date;
  durationMinutes: number;
}): Promise<CalendarPushResult> {
  const token = await tokenStore.read();
  if (!token) {
    return { ok: false, error: "Google account not connected yet." };
  }
  try {
    const client = makeOAuthClient();
    client.setCredentials({ refresh_token: token.refresh_token });
    const end = new Date(
      event.start.getTime() + event.durationMinutes * 60_000,
    );
    const { data } = await google.calendar({ version: "v3", auth: client })
      .events.insert({
        calendarId: "primary",
        requestBody: {
          summary: event.title,
          description: event.description,
          start: { dateTime: event.start.toISOString() },
          end: { dateTime: end.toISOString() },
          reminders: {
            useDefault: false,
            overrides: [
              { method: "popup", minutes: 24 * 60 },
              { method: "popup", minutes: 60 },
            ],
          },
          source: { title: "the date invitation website" },
        },
      });
    return { ok: true, eventId: data.id ?? undefined, htmlLink: data.htmlLink ?? undefined };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown Google API error",
    };
  }
}

export async function disconnectGoogle(): Promise<void> {
  await tokenStore.clear();
}
