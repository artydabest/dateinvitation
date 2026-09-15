import { env } from "../env.js";
import { MemoryInvitationRepository } from "./memory.repo.js";
import { MongoInvitationRepository } from "./mongo.repo.js";
import type { InvitationRepository } from "./types.js";

export async function createRepository(): Promise<{
  repo: InvitationRepository;
  driver: "mongodb" | "memory";
}> {
  if (env.mongodbUri) {
    try {
      const repo = new MongoInvitationRepository();
      await repo.init();
      console.log("[db] connected to MongoDB");
      return { repo, driver: "mongodb" } as const;
    } catch (err) {
      console.warn(
        "[db] MongoDB connection failed, falling back to in-memory store:",
        err instanceof Error ? err.message : err,
      );
    }
  }
  console.log("[db] using in-memory store (set MONGODB_URI for persistence)");
  const repo = new MemoryInvitationRepository();
  await repo.init();
  return { repo, driver: "memory" } as const;
}

export type { InvitationRepository, InvitationRecord } from "./types.js";
