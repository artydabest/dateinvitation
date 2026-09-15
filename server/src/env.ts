import dotenv from "dotenv";
import path from "node:path";
import { serverRoot } from "./paths.js";

dotenv.config({ path: path.resolve(serverRoot, ".env") });

/** Server-side environment. Never imported by the client. */
export const env = {
  port: Number(process.env.PORT ?? 4000),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ??
      "http://localhost:4000/api/google/callback",
  },
  googleTokenStoreFile:
    process.env.GOOGLE_TOKEN_STORE_FILE ?? "google-oauth-tokens.json",
  ownerNotifyEmail: process.env.OWNER_NOTIFY_EMAIL ?? "",
  email: {
    provider: (process.env.EMAIL_PROVIDER ?? "console") as
      | "console"
      | "resend",
    from: process.env.EMAIL_FROM ?? "Roshan's website <onboarding@resend.dev>",
    resendApiKey: process.env.RESEND_API_KEY ?? "",
  },
  mongodbUri: process.env.MONGODB_URI ?? "",
};

if (!env.google.clientSecret && env.google.clientId) {
  console.warn(
    "[env] GOOGLE_CLIENT_SECRET missing while GOOGLE_CLIENT_ID is set — calendar push will be disabled.",
  );
}
