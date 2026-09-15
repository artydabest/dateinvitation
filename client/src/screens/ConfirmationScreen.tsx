/** The ticket review before sealing the envelope. */
import { useState } from "react";
import { motion } from "framer-motion";
import { COPY, getActivityOption } from "@shared/invitation.config";
import { FlowerCluster, HeartDivider, PetalBurst } from "../components/Decorations";
import { HeartDoodle, TinyFlower } from "../components/botanicals";
import { formatLong, formatTimePretty } from "../lib/dateUtils";

export function ConfirmationScreen({
  selectedDate,
  selectedTime,
  selectedActivityId,
  submitting,
  submitError,
  onConfirm,
  onEdit,
}: {
  selectedDate: string;
  selectedTime: string;
  selectedActivityId: string | null;
  submitting: boolean;
  submitError: string | null;
  onConfirm: () => void;
  onEdit: () => void;}) {
  const activity = selectedActivityId ? getActivityOption(selectedActivityId) : undefined;
  /** one soft shower of petals the moment she seals the envelope */
  const [burst, setBurst] = useState(false);

  return (
    <motion.section
      className="screen"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.4 }}
      aria-labelledby="confirmation-title"
    >
      <PetalBurst show={burst} subtle />
      <FlowerCluster corner="top-left" variant="hibiscus" />
      <HeartDoodle
        size={40}
        color="#f3c4cd"
        className="pointer-events-none absolute -right-4 bottom-32 animate-bob opacity-60"
      />

      <motion.article
        className="paper-card relative z-10 w-full max-w-md overflow-hidden"
        initial={{ rotate: -1.2, scale: 0.96, opacity: 0 }}
        animate={{ rotate: -0.8, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <span className="tape -top-3 left-1/2 -translate-x-1/2 -rotate-1" aria-hidden="true" />

        <div className="px-7 pt-8 pb-6 text-center">
          <p className="hand text-2xl text-cherry">admit one (+ one nervous boy)</p>
          <h1 id="confirmation-title" className="mt-1 font-serif text-4xl font-semibold text-balance">
            {COPY.confirmation.title}
          </h1>

          <dl className="mt-6 space-y-4 text-left">
            <div className="flex items-start justify-between gap-4 border-b border-dashed border-cocoa/20 pb-3">
              <dt className="hand text-xl text-cocoa">{COPY.confirmation.dateLabel}</dt>
              <dd className="font-serif text-xl font-semibold">{formatLong(selectedDate)}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-dashed border-cocoa/20 pb-3">
              <dt className="hand text-xl text-cocoa">{COPY.confirmation.timeLabel}</dt>
              <dd className="font-serif text-xl font-semibold">{formatTimePretty(selectedTime)}</dd>
            </div>
            {activity && (
              <div className="flex items-start justify-between gap-4 border-b border-dashed border-cocoa/20 pb-3">
                <dt className="hand text-xl text-cocoa">{COPY.confirmation.activityLabel}</dt>
                <dd className="text-right font-serif text-xl font-semibold">
                  {`${activity.emoji} ${activity.name}`}
                </dd>
              </div>
            )}
          </dl>

          {activity && (
            <p className="hand mt-4 text-lg opacity-80">{COPY.confirmation.activityNote}</p>
          )}
          <p className="hand mt-5 text-xl opacity-80">{COPY.confirmation.note}</p>
        </div>

        {/* perforation */}
        <div className="relative" aria-hidden="true">
          <div className="border-t-2 border-dashed border-cocoa/25" />
          <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-cream" />
          <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-cream" />
        </div>

        <div className="flex flex-col gap-2.5 px-7 py-6 sm:flex-row">
          <button
            type="button"
            className="btn-cherry flex-1"
            onClick={() => {
              setBurst(true);
              onConfirm();
            }}
            disabled={submitting}
          >
            {submitting ? "sealing the envelope…" : COPY.confirmation.confirm}
          </button>
          <button
            type="button"
            className="btn-ghost flex-1"
            onClick={onEdit}
            disabled={submitting}
          >
            {COPY.confirmation.edit}
            <span aria-hidden="true"> ↩</span>
          </button>
        </div>
      </motion.article>

      {submitError && (
        <p
          className="relative z-10 max-w-md rounded-md border border-cherry/30 bg-blush/40 px-4 py-3 text-center text-sm font-semibold text-cherry"
          role="alert"
        >
          {submitError} — your picks are still saved, please try again.
        </p>
      )}

      <HeartDivider className="relative z-10" />

      <div className="relative z-10 flex items-center gap-2 opacity-80">
        <TinyFlower size={16} color="#bcd6ea" center="#8fb8d8" />
        <TinyFlower size={16} />
        <TinyFlower size={16} color="#f7d774" center="#d9962e" />
      </div>
    </motion.section>
  );
}
