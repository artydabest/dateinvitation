# For Sakshi 🌻 — a date invitation website

A tiny handmade digital scrapbook that asks one very important question, lets
Sakshi pick a day + time, and (optionally) pushes the event to Google Calendar
and emails Roshan. Built to feel like handmade stationery — not a template.

## Stack

| Layer | Tech |
|---|---|
| Client | React 18 · Vite · TypeScript · Tailwind · Framer Motion |
| Server | Node · Express · TypeScript (ESM) |
| Database | MongoDB + Mongoose (optional — falls back to in-memory) |
| Calendar | Google OAuth + Calendar API (optional) · gcal link + `.ics` fallbacks |
| Email | Modular provider: `console` (default) or Resend |

Monorepo layout (npm workspaces):

```
shared/        → invitation.config.ts  ← EVERYTHING personal lives here
               → invitation.types.ts   ← shared API types
client/        → React app (screens, components, state, api)
               → public/assets/        ← drop your own images here
server/        → Express API, Google OAuth, email, DB
```

## Adding your own images (Pompompurin, flowers, stickers)

All images are referenced from **`shared/invitation.config.ts` → `ASSETS`**.
Drop a file into `client/public/assets/` (characters / flowers / stickers /
photos / decorations) and update the path in the config — **no component
code changes needed**. Any image left as `null` renders a built-in
hand-drawn SVG fallback, so the site always works while you collect assets.

Key assets:

| What | Where |
|---|---|
| The real Pompompurin | `assets/characters/pompompurin.png` |
| Cherry-red hibiscus | `assets/flowers/cherry-red-hibiscus.png` |
| NO-popup stickers | `assets/stickers/{pleading,sad,website,shy,no-1,no-2,desperate}.png` |

The opening screen is a **flower garden** driven by `GARDEN_FLOWERS` in the
config — positions, sizes, rotations, and which flowers are pickable. Every
picked flower shows a tiny message (`FLOWER_TYPES[*].messages`), then flies
into the **bouquet pinned in the top-right corner** (with a washi-tape strip,
compact on mobile) and overlaps into a real arrangement.

## The NO negotiation

Every click of NO (on the page or inside a popup) advances to the next plea
from `NO_POPUPS` in the config — each with its own sticker slot. After the
last plea comes the finale: *"okay okay 😭 I am officially out of arguments.**
**fine… one last chance?"* → **YES 💗**. Closing a popup never breaks the
button; progress is kept and NO always brings the next reaction.

## The real calendar

Sakshi picks **any real date** from a monthly calendar — correct weekday
alignment (all math through the JS `Date` object, no hardcoded weekday
names), leap years, month navigation. The currently selected date gets the
sunflower (and only that date). Times are quick suggestions plus a full
hour/minute/AM-PM picker. Server-side validation accepts any valid
`YYYY-MM-DD` + `HH:mm` and strictly rejects impossible dates like
`2026-02-30`.

## Quick start (zero credentials needed)

```bash
npm install
npm run dev          # server on :4000, client on :5173
```

Open http://localhost:5173. That's it — without any env config the site works
fully: RSVPs are stored in memory, the calendar button uses the pre-filled
Google Calendar link, the `.ics` download works, and emails are logged to the
server console.

## Customizing the invitation

Open **`shared/invitation.config.ts`** — one file, clearly commented:

- names, invitation copy, every screen's text
- `AVAILABLE_DATES` / `AVAILABLE_TIMES` / `DATE_NOTES`
- calendar event title + description, duration
- email subject/body, recipient addresses
- WhatsApp phone + message
- feature toggles (calendar push, link, .ics, email, petals, easter eggs)

**Never put secrets in this file** — it ships to the browser. Secrets go in
`server/.env` only.

## Server environment

Copy `server/.env.example` → `server/.env`:

```ini
PORT=4000
CLIENT_URL=http://localhost:5173

# optional — Google Calendar push
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:4000/api/google/callback
OWNER_NOTIFY_EMAIL=

# optional — email delivery (console | resend)
EMAIL_PROVIDER=console
EMAIL_FROM="Roshan's website <onboarding@resend.dev>"
RESEND_API_KEY=

# optional — persistence (in-memory if unset)
MONGODB_URI=
```

## Google Calendar — how it works (and why it's safe)

**Before any Google integration runs, here is exactly what authorization
happens:**

1. **Roshan** (the site owner, not Sakshi) creates an OAuth client at
   [console.cloud.google.com](https://console.cloud.google.com):
   - create a project → configure the **OAuth consent screen** (External,
     *Testing* mode, add Roshan's own Gmail as a test user)
   - Credentials → *Create OAuth client ID* → **Web application**
   - add redirect URI: `http://localhost:4000/api/google/callback`
   - put the client ID/secret in `server/.env`
2. Visit **`http://localhost:4000/api/google/auth`** once. Google shows the
   consent screen asking for permission to **insert events** on Roshan's
   calendar. The only scope requested is `calendar.events`.
3. The callback stores **only the refresh token**, server-side
   (`google-oauth-tokens.json`, gitignored — swap the store for a DB
   collection in production). Access tokens are minted per request and never
   leave the server.

Security properties:

- ❌ no client secret in frontend code — it lives only in `server/.env`
- ❌ no OAuth/refresh tokens ever sent to the browser
- ✅ least-privilege scope (`calendar.events`, nothing else)
- ✅ OAuth errors handled: denial, missing code, failed exchange → the client
  simply keeps the working fallbacks
- ✅ honesty rule: if the automatic push fails (or was never set up), the API
  returns `calendarStatus: "link_only" | "failed"` and the UI **never** claims
  the event was created. Sakshi always gets the one-tap pre-filled calendar
  link + `.ics` download.

When Sakshi confirms her date, the server attempts the push (if configured +
authorized + enabled) and returns the real status, which the final screen
displays truthfully.

## Email

- `EMAIL_PROVIDER=console` (default): the email is printed to the server
  console — perfect for testing, nothing leaves the machine.
- `EMAIL_PROVIDER=resend`: set `RESEND_API_KEY` and real mail goes out via
  [Resend](https://resend.com). The API key stays in `server/.env`; no Gmail
  passwords are ever stored. The provider is one small module
  (`server/src/services/email.service.ts`) — swap in any transactional
  provider (Postmark, SES, Nodemailer…) by implementing the same interface.

Recipients are configured in `shared/invitation.config.ts` (`EMAIL.notifyEmail`
for Roshan, `EMAIL.inviteeEmail` optionally for Sakshi). Empty = skipped, and
the DB records `no_recipient` instead of pretending.

## Database

`MONGODB_URI` unset → in-memory store (restarts reset data — fine for the big
day). Set it to `mongodb://127.0.0.1:27017/sakshi-date` or an Atlas URI for
persistence.

Schema (`server/src/repo/mongo.repo.ts`): `selectedDate`, `selectedTime`,
`status`, `inviteeName`, `inviterName`, `calendarEventId`, `calendarStatus`,
`emailStatus`, timestamps. Minimal personal data, easy to extend.

## Production build

```bash
npm run build:all    # builds client → client/dist, server → server/dist
npm start            # serves API + static client from :4000
```

## API surface

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | status: db driver, email provider, google state |
| POST | `/api/invitation` | create RSVP (validates against config) |
| GET | `/api/invitation/:id/ics` | download the `.ics` file |
| GET | `/api/invitation/:id/pdf` | download the keepsake invitation PDF |
| GET | `/api/google/status` | `{ configured, authorized }` |
| GET | `/api/google/auth` | start Roshan's one-time OAuth consent |
| GET | `/api/google/callback` | OAuth callback (stores refresh token) |
| POST | `/api/google/disconnect` | delete the stored token |

## Checks performed

- ✅ TypeScript strict, both workspaces
- ✅ YES flow: flower garden → celebration → planning → ticket → final
- ✅ NO flow: sequential plea popups (configurable in `NO_POPUPS`) with
  sticker slots → respectful close (NO stays a real, keyboard-accessible
  choice — no dodge-the-button nonsense)
- ✅ real calendar: correct weekdays (Tuesday is Tuesday), leap years,
  month navigation; sunflower appears ONLY on the selected date
- ✅ validation: server rejects impossible dates (2026-02-30) and garbage
- ✅ honest failure states for calendar + email + API errors
- ✅ mobile-first layout, 48px tap targets, no horizontal overflow
- ✅ `prefers-reduced-motion` disables petals/sways/bursts
- ✅ semantic HTML, skip link, focus-visible rings, aria labels/pressed
- ✅ easter-egg icons toggle on/off properly (never stuck active)
