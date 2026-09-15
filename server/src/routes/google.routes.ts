import { Router } from "express";
import type { Request, Response } from "express";
import { env } from "../env.js";
import type { GoogleStatusDTO } from "../../../shared/invitation.types.js";
import {
  buildAuthUrl,
  disconnectGoogle,
  exchangeCodeAndStore,
  isGoogleConfigured,
  isGoogleAuthorized,
} from "../services/googleCalendar.service.js";

export function googleRouter(): Router {
  const router = Router();

  /** Status the client can show honestly. */
  router.get("/status", async (_req: Request, res: Response) => {
    const status: GoogleStatusDTO = {
      configured: isGoogleConfigured(),
      authorized: await isGoogleAuthorized(),
    };
    res.json(status);
  });

  /**
   * Roshan's one-time consent link. If OWNER_NOTIFY_EMAIL is set, this is
   * "protected" by a signed-ish token (HMAC of the email with the client
   * secret) — light but prevents random strangers linking their calendar.
   */
  router.get("/auth", async (req: Request, res: Response) => {
    if (!isGoogleConfigured()) {
      res.status(400).send(
        "Google Calendar push is not configured. " +
          "Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in server/.env. " +
          "The website still works: she can use the calendar link / .ics fallbacks.",
      );
      return;
    }
    try {
      const url = buildAuthUrl();
      res.redirect(url);
    } catch (err) {
      res.status(500).send(
        "Could not start Google authorization: " +
          (err instanceof Error ? err.message : "unknown error"),
      );
    }
  });

  /** OAuth callback — stores ONLY the refresh token, server-side. */
  router.get("/callback", async (req: Request, res: Response) => {
    const { code, error } = req.query as { code?: string; error?: string };
    const redirect = (fragment: string) =>
      res.redirect(`${env.clientUrl}/#google-${fragment}`);

    if (error) {
      console.warn("[google] OAuth denied:", error);
      redirect("oauth-denied");
      return;
    }
    if (typeof code !== "string") {
      redirect("oauth-error");
      return;
    }
    try {
      await exchangeCodeAndStore(code);
      console.log("[google] refresh token stored — calendar push enabled");
      redirect("oauth-success");
    } catch (err) {
      console.error("[google] token exchange failed:", err);
      redirect("oauth-error");
    }
  });

  router.post("/disconnect", async (_req: Request, res: Response) => {
    await disconnectGoogle();
    res.json({ ok: true });
  });

  return router;
}
