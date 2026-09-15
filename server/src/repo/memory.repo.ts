import type { InvitationRecord, InvitationRepository } from "./types.js";

/** Zero-dependency fallback used when MONGODB_URI is not configured. */
export class MemoryInvitationRepository implements InvitationRepository {
  private store = new Map<string, InvitationRecord>();
  private seq = 0;

  async init(): Promise<void> {
    this.store.clear();
    this.seq = 0;
  }

  async create(
    input: Pick<InvitationRecord, "selectedDate" | "selectedTime" | "activityId"> & {
      inviteeName: string;
      inviterName: string;
    },
  ): Promise<InvitationRecord> {
    this.seq += 1;
    const now = new Date();
    const record: InvitationRecord = {
      id: `mem_${now.getTime().toString(36)}_${this.seq}`,
      ...input,
      activityId: input.activityId ?? null,
      status: "pending",
      calendarEventId: null,
      calendarStatus: "not_requested",
      emailStatus: "not_requested",
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(record.id, record);
    return { ...record };
  }

  async findById(id: string): Promise<InvitationRecord | null> {
    return this.store.get(id) ?? null;
  }

  async update(
    id: string,
    patch: Partial<
      Pick<
        InvitationRecord,
        "status" | "calendarEventId" | "calendarStatus" | "emailStatus"
      >
    >,
  ): Promise<InvitationRecord | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated: InvitationRecord = {
      ...existing,
      ...patch,
      updatedAt: new Date(),
    };
    this.store.set(id, updated);
    return { ...updated };
  }

  async count(): Promise<number> {
    return this.store.size;
  }
}
