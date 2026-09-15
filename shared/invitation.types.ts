/** Shared API types between client and server. */

export type InvitationStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "cancelled";

export type CalendarStatus =
  | "not_requested"
  | "success"
  | "link_only"
 | "failed"
  | "skipped";

export type EmailStatus =
  | "not_requested"
  | "sent"
  | "failed"
  | "skipped"
  | "no_recipient";

export interface DateInvitationDTO {
  id: string;
  selectedDate: string; // "YYYY-MM-DD" — the real date she picked
  selectedTime: string; // "HH:mm" — 24h, the real time she picked
  /** The main activity she picked (id from ACTIVITY_OPTIONS). Null = none picked. */
  activityId: string | null;
  status: InvitationStatus;
  inviteeName: string;
  inviterName: string;
  calendarEventId: string | null;
  calendarStatus: CalendarStatus;
  emailStatus: EmailStatus;
  /** Pre-filled Google Calendar link (always present when enabled). */
  calendarLink: string | null;
  /** Download URL for the generated .ics file. */
  icsUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** POST /api/invitation body. */
export interface CreateInvitationInput {
  selectedDate: string; // "YYYY-MM-DD" — any real calendar date
  selectedTime: string; // "HH:mm" — any real clock time
  /** Optional main activity (id from ACTIVITY_OPTIONS). */
  activityId?: string | null;
  /** Toggles the two external actions, so the client decides what it offered. */
  requestCalendar: boolean;
  requestEmail: boolean;
}

/** POST /api/invitation response. */
export interface CreateInvitationResponse {
  invitation: DateInvitationDTO;
}

/** GET /api/google/status response. */
export interface GoogleStatusDTO {
  configured: boolean; // client id/secret/redirect present in server env
  authorized: boolean; // a refresh token is stored server-side
}
