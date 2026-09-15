import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./env.js";
import { createRepository } from "./repo/index.js";
import { invitationRouter } from "./routes/invitation.routes.js";
import { googleRouter } from "./routes/google.routes.js";
import { activeEmailProviderName } from "./services/email.service.js";
import {
  isGoogleConfigured,
  isGoogleAuthorized,
} from "./services/googleCalendar.service.js";
import { serverRoot } from "./paths.js";

async function main() {
  const { repo, driver } = await createRepository();

  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(express.json({ limit: "16kb" }));
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    }),
  );

  app.use(
    "/api/invitation",
    rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false }),
  );

  app.get("/api/health", async (_req, res) => {
    res.json({
      ok: true,
      db: driver,
      emailProvider: activeEmailProviderName(),
      google: { configured: isGoogleConfigured(), authorized: await isGoogleAuthorized() },
    });
  });

  app.use("/api/invitation", invitationRouter(repo));
  app.use("/api/google", googleRouter());

  // ── Production: serve the built client + SPA fallback ──
  const clientDist = path.resolve(serverRoot, "../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });

  app.listen(env.port, () => {
    console.log(`💌 API listening on http://localhost:${env.port}`);
    console.log(`   db: ${driver} · email: ${activeEmailProviderName()}`);
  });
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
