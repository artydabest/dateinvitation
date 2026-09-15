import mongoose, { Schema } from "mongoose";
import type {
  CalendarStatus,
  EmailStatus,
  InvitationStatus,
} from "../../../shared/invitation.types.js";
import type {
  InvitationRecord,
  InvitationRepository,
} from "./types.js";

const StatusSchemaValues: InvitationStatus[] = [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
];

/** Mongo document shape (mongoose maps `id` as a virtual of `_id`). */
interface InvitationDocSchema {
  _id: string;
  selectedDate: string;
  selectedTime: string;
  activityId: string | null;
  status: InvitationStatus;
  inviteeName: string;
  inviterName: string;
  calendarEventId: string | null;
  calendarStatus: CalendarStatus;
  emailStatus: EmailStatus;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<InvitationDocSchema>(
  {
    _id: { type: String, required: true },
    selectedDate: { type: String, required: true }, // "YYYY-MM-DD"
    selectedTime: { type: String, required: true }, // "HH:mm"
    activityId: { type: String, default: null },
    status: {
      type: String,
      enum: StatusSchemaValues,
      default: "pending",
      index: true,
    },
    inviteeName: { type: String, required: true },
    inviterName: { type: String, required: true },
    calendarEventId: { type: String, default: null },
    calendarStatus: {
      type: String,
      enum: ["not_requested", "success", "link_only", "failed", "skipped"],
      default: "not_requested",
    },
    emailStatus: {
      type: String,
      enum: [
        "not_requested",
        "sent",
        "failed",
        "skipped",
        "no_recipient",
      ],
      default: "not_requested",
    },
  },
  { timestamps: true, versionKey: false },
);

export class MongoInvitationRepository implements InvitationRepository {
  async init(): Promise<void> {
    await mongoose.connect(process.env.MONGODB_URI ?? "");
  }

  async create(
    input: Pick<InvitationRecord, "selectedDate" | "selectedTime" | "activityId"> & {
      inviteeName: string;
      inviterName: string;
    },
  ): Promise<InvitationRecord> {
    const id = `inv_${new Date().getTime().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const doc = await InvitationModel.create({ _id: id, ...input });
    return toRecord(doc);
  }

  async findById(id: string): Promise<InvitationRecord | null> {
    const doc = await InvitationModel.findById(id).lean();
    return doc ? toRecord(doc as never) : null;
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
    const doc = await InvitationModel.findByIdAndUpdate(
      id,
      { $set: patch },
      { new: true, runValidators: true },
    ).lean();
    return doc ? toRecord(doc as never) : null;
  }

  async count(): Promise<number> {
    return InvitationModel.countDocuments();
  }
}

function toRecord(doc: unknown): InvitationRecord {
  const d = doc as {
    _id: string;
    selectedDate: string;
    selectedTime: string;
    activityId: string | null;
    status: InvitationStatus;
    inviteeName: string;
    inviterName: string;
    calendarEventId: string | null;
    calendarStatus: CalendarStatus;
    emailStatus: EmailStatus;
    createdAt: Date;
    updatedAt: Date;
  };
  return {
    id: d._id,
    selectedDate: d.selectedDate,
    selectedTime: d.selectedTime,
    activityId: d.activityId ?? null,
    status: d.status,
    inviteeName: d.inviteeName,
    inviterName: d.inviterName,
    calendarEventId: d.calendarEventId,
    calendarStatus: d.calendarStatus,
    emailStatus: d.emailStatus,
    createdAt: new Date(d.createdAt),
    updatedAt: new Date(d.updatedAt),
  };
}

const InvitationModel: mongoose.Model<InvitationDocSchema> =
  (mongoose.models.Invitation as mongoose.Model<InvitationDocSchema>) ??
  mongoose.model<InvitationDocSchema>("Invitation", InvitationSchema);
