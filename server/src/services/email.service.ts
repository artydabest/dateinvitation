/**
 * Modular email delivery.
 *
 * The default provider ("console") simply logs the email — perfect for local
 * dev and zero-config demos. Switch EMAIL_PROVIDER=resend with RESEND_API_KEY
 * to deliver real mail. Passwords are never stored; Resend uses an API key
 * that lives only in server/.env.
 */
import { env } from "../env.js";

export interface EmailAttachment {
  /** File name shown in the mail client. */
  filename: string;
  /** Raw file bytes. */
  content: Buffer;
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  /** Optional files to attach (e.g. the keepsake PDF). */
  attachments?: EmailAttachment[];
}

export interface EmailProvider {
  name: string;
  send(msg: EmailMessage): Promise<{ ok: true; id: string } | { ok: false; error: string }>;
}

/** Logs the email; always "succeeds". Great for local development. */
const consoleProvider: EmailProvider = {
  name: "console",
  async send(msg) {
    console.log(
      [
        "──────────────────────────────────────────────",
        `📧 [console email provider] (no real email sent)`,
        `To:      ${msg.to}`,
        `Subject: ${msg.subject}`,
        msg.attachments?.length
          ? `Files:   ${msg.attachments.map((a) => `${a.filename} (${a.content.length}b)`).join(", ")}`
          : null,
        "",
        msg.text,
        "──────────────────────────────────────────────",
      ]
        .filter((l) => l !== null)
        .join("\n"),
    );
    return { ok: true, id: `console_${Date.now()}` };
  },
};

/** Transactional email via Resend (https://resend.com). */
const resendProvider: EmailProvider = {
  name: "resend",
  async send(msg) {
    const apiKey = env.email.resendApiKey;
    if (!apiKey) {
      return { ok: false, error: "RESEND_API_KEY is not configured." };
    }
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.email.from,
          to: [msg.to],
          subject: msg.subject,
          text: msg.text,
          ...(msg.attachments?.length
            ? {
                attachments: msg.attachments.map((a) => ({
                  filename: a.filename,
                  content: a.content.toString("base64"),
                })),
              }
            : {}),
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
      }
      const data = (await res.json()) as { id?: string };
      return { ok: true, id: data.id ?? "resend" };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown email error",
      };
    }
  },
};

function getProvider(): EmailProvider {
  return env.email.provider === "resend" ? resendProvider : consoleProvider;
}

/** Fire-and-log; the caller records the honest result in the DB. */
export async function sendEmail(
  msg: EmailMessage,
): Promise<{ ok: boolean; error?: string }> {
  const provider = getProvider();
  try {
    const result = await provider.send(msg);
    if (result.ok) return { ok: true };
    console.warn(`[email:${provider.name}] failed:`, result.error);
    return { ok: false, error: result.error };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown email error";
    console.warn(`[email:${provider.name}] threw:`, error);
    return { ok: false, error };
  }
}

export function activeEmailProviderName(): string {
  return getProvider().name;
}
