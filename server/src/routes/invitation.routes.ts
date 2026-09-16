import { Router } from "express";
import type { Request, Response } from "express";
import {
  ACTIVITY_OPTIONS,
  CALENDAR_EVENT,
  EMAIL,
  EVENT_DURATION_MINUTES,
  FEATURES,
  FLOWER_TYPES,
  INVITEE_NAME,
  INVITER_NAME,
} from "../../../shared/invitation.config.js";
import type { ActivityOption } from "../../../shared/invitation.config.js";
import type {
  CreateInvitationInput,
  CreateInvitationResponse,
  DateInvitationDTO,
  PickedFlowerDTO,
} from "../../../shared/invitation.types.js";
import type { InvitationRepository } from "../repo/index.js";
import {
  buildGoogleCalendarTemplateUrl,
  buildIcsContent,
} from "../services/calendarLinks.service.js";
import {
  isGoogleConfigured,
  isGoogleAuthorized,
  pushEventToCalendar,
} from "../services/googleCalendar.service.js";
import { sendEmail } from "../services/email.service.js";
import {
  buildInvitationPdf,
  buildPdfToken,
  parsePdfToken,
} from "../services/invitationPdf.service.js";
import {
  composeDate,
  formatPretty,
  formatTimePretty,
  isValidDateString,
  isValidTimeString,
} from "../utils/time.js";

/** Venue lines for calendar descriptions — location is optional. */
function activityLines(a: ActivityOption | null): string[] {
  if (!a) return [];
  return [
    `main activity: ${a.name}${a.place ? ` (${a.place})` : ""}`,
    ...(a.location ? [a.location] : []),
  ];
}

export function invitationRouter(repo: InvitationRepository): Router {
  const router = Router();

  router.post("/", async (req: Request, res: Response) => {
    try {
      const body = req.body as Partial<CreateInvitationInput>;
      const { selectedDate, selectedTime } = body;

      // ── Validate real dates/times — she can pick any day, not a preset list. ──
      if (
        typeof selectedDate !== "string" ||
        typeof selectedTime !== "string" ||
        !isValidDateString(selectedDate) ||
        !isValidTimeString(selectedTime)
      ) {
        res.status(400).json({ error: "Please pass valid date and time." });
        return;
      }

      // ── Activity: optional, but if sent it must be a real one. ──
      const activityId =
        typeof body.activityId === "string" &&
        ACTIVITY_OPTIONS.some((a) => a.id === body.activityId)
          ? body.activityId
          : null;
      const activity = activityId
        ? ACTIVITY_OPTIONS.find((a) => a.id === activityId) ?? null
        : null;

      // ── Picked flowers: optional; keep only real types, cap at 12, dedupe by id. ──
      const rawFlowers = Array.isArray(body.pickedFlowers) ? body.pickedFlowers : [];
      const seenFlowerIds = new Set<string>();
      const pickedFlowers: PickedFlowerDTO[] = [];
      for (const f of rawFlowers) {
        if (
          pickedFlowers.length >= 12 ||
          !f ||
          typeof f.id !== "string" ||
          typeof f.type !== "string" ||
          !(f.type in FLOWER_TYPES) ||
          seenFlowerIds.has(f.id)
        ) {
          continue;
        }
        seenFlowerIds.add(f.id);
        pickedFlowers.push({ id: f.id, type: f.type });
      }

      const requestCalendar = body.requestCalendar === true;
      const requestEmail = body.requestEmail === true;

      const invitation = await repo.create({
        selectedDate,
        selectedTime,
        activityId,
        pickedFlowers,
        inviteeName: INVITEE_NAME,
        inviterName: INVITER_NAME,
      });

      let calendarEventId: string | null = null;
      let calendarStatus: DateInvitationDTO["calendarStatus"] = "skipped";
      let calendarLink: string | null = null;

      const start = composeDate(selectedDate, selectedTime);
      const event = {
        title: activity
          ? `${CALENDAR_EVENT.title} — ${activity.name}`
          : CALENDAR_EVENT.title,
        description: activity
          ? [
              ...activityLines(activity),
              "",
              CALENDAR_EVENT.description,
              "",
              "(this is just the main activity — i make the rest of the plan 😌)",
            ].join("\n")
          : CALENDAR_EVENT.description,
        start,
        durationMinutes: EVENT_DURATION_MINUTES,
      };

      // ── Calendar: try the real push; fall back to a link, never fake success. ──
      if (FEATURES.googleCalendarPush && requestCalendar) {
        if (isGoogleConfigured() && (await isGoogleAuthorized())) {
          const push = await pushEventToCalendar(event);
          if (push.ok) {
            calendarEventId = push.eventId ?? null;
            calendarStatus = "success";
          } else {
            calendarStatus = "failed";
            console.warn("[calendar] push failed:", push.error);
          }
        } else {
          calendarStatus = "link_only";
        }
      }
      if (FEATURES.googleCalendarLink) {
        calendarLink = buildGoogleCalendarTemplateUrl(event);
      }

      // ── Email: best-effort, honest status recorded. The keepsake PDF is
      // attached so she gets the invitation even if she loses the tab. ──
      let emailStatus: DateInvitationDTO["emailStatus"] = "skipped";
      if (FEATURES.email && requestEmail) {
        const body = EMAIL.buildBody(
          formatPretty(selectedDate),
          formatTimePretty(selectedTime),
          activity?.name ?? null,
        );
        const buildAttachment = () =>
          buildInvitationPdf({
            datePretty: formatPretty(selectedDate),
            timePretty: formatTimePretty(selectedTime),
            activityName: activity?.name ?? null,
            activityPlace: activity?.place ?? null,
            pickedFlowers,
          }).then((bytes) => ({
            filename: "sakshi-and-roshan-invitation.pdf",
            content: Buffer.from(bytes),
          }));
        if (EMAIL.notifyEmail) {
          const r1 = await sendEmail({
            to: EMAIL.notifyEmail,
            subject: EMAIL.subject,
            text: body,
            attachments: [await buildAttachment()],
          });
          emailStatus = r1.ok ? "sent" : "failed";
        } else {
          emailStatus = "no_recipient";
        }
        if (EMAIL.inviteeEmail) {
          await sendEmail({
            to: EMAIL.inviteeEmail,
            subject: EMAIL.subject,
            text: `psst ${INVITEE_NAME}… it's official 🌻\n\n${formatPretty(selectedDate)} · ${formatTimePretty(selectedTime)}${activity ? `\nmain activity: ${activity.name}` : ""}\n\nsee you then 💗`,
            attachments: [await buildAttachment()],
          });
        }
      }

      const updated =
        (await repo.update(invitation.id, {
          status: "confirmed",
          calendarEventId,
          calendarStatus,
          emailStatus,
        })) ?? invitation;

      const payload: CreateInvitationResponse = {
        invitation: {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
          calendarLink,
          icsUrl: null,
          pdfUrl: FEATURES.pdfDownload
            ? `/api/invitation/pdf/${buildPdfToken({
                selectedDate,
                selectedTime,
                activityId,
                pickedFlowers,
                datePretty: formatPretty(selectedDate),
                timePretty: formatTimePretty(selectedTime),
              })}`
            : null,
        },
      };
      res.status(201).json(payload);
    } catch (err) {
      console.error("[invitation] error:", err);
      res.status(500).json({
        error: "Something went wrong on our side. (The website is shy.)",
      });
    }
  });

  /** .ics download for a stored invitation. */
  router.get("/:id/ics", async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const invitation = await repo.findById(id);
    if (!invitation) {
      res.status(404).send("Not found");
      return;
    }
    const icsActivity = invitation.activityId
      ? ACTIVITY_OPTIONS.find((a) => a.id === invitation.activityId) ?? null
      : null;
    const ics = buildIcsContent({
      title: icsActivity
        ? `${CALENDAR_EVENT.title} — ${icsActivity.name}`
        : CALENDAR_EVENT.title,
      description: icsActivity
        ? [...activityLines(icsActivity), "", CALENDAR_EVENT.description].join(
            "\n",
          )
        : CALENDAR_EVENT.description,
      start: composeDate(invitation.selectedDate, invitation.selectedTime),
      durationMinutes: EVENT_DURATION_MINUTES,
    });
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="date-with-roshan.ics"`,
    );
    res.send(ics);
  });

  /**
   * Keepsake PDF from a stateless signed token — no database involved, so
   * the link keeps working across restarts, deploys, and cold starts.
   */
  router.get("/pdf/:token", async (req: Request, res: Response) => {
    const input = await parsePdfToken(req.params.token ?? "");
    if (!input) {
      res.status(404).send("This invitation link is not valid.");
      return;
    }
    try {
      const pdf = await buildInvitationPdf(input);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="sakshi-and-roshan-invitation.pdf"`,
      );
      res.send(Buffer.from(pdf));
    } catch (err) {
      console.error("[invitation] pdf error:", err);
      res.status(500).send("Could not build the invitation PDF.");
    }
  });

  return router;
}
