import type {
  CalendarStatus,
  EmailStatus,
  InvitationStatus,
  PickedFlowerDTO,
} from "../../../shared/invitation.types.js";

/** Persistence-agnostic invitation record. */
export interface InvitationRecord {
  id: string;
  selectedDate: string; // "YYYY-MM-DD"
  selectedTime: string; // "HH:mm"
  /** The main activity she picked (id from ACTIVITY_OPTIONS). Null = none. */
  activityId: string | null;
  /** Flowers she picked from the garden, in order (max 12). */
  pickedFlowers: PickedFlowerDTO[];
  status: InvitationStatus;
  inviteeName: string;
  inviterName: string;
  calendarEventId: string | null;
  calendarStatus: CalendarStatus;
  emailStatus: EmailStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvitationRepository {
  init(): Promise<void>;
  create(
    input: Pick<
      InvitationRecord,
      "selectedDate" | "selectedTime" | "activityId" | "pickedFlowers"
    > & {
      inviteeName: string;
      inviterName: string;
    },
  ): Promise<InvitationRecord>;
  findById(id: string): Promise<InvitationRecord | null>;
  update(
    id: string,
    patch: Partial<
      Pick<
        InvitationRecord,
        | "status"
        | "calendarEventId"
        | "calendarStatus"
        | "emailStatus"
      >
    >,
  ): Promise<InvitationRecord | null>;
  count(): Promise<number>;
}
