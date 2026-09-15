/** Pick a real date on a real calendar, a time, and the main activity. */
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { COPY, FEATURES, INVITEE_NAME, getActivityOption } from "@shared/invitation.config";
import { DatePicker } from "../components/DatePicker";
import { TimePicker } from "../components/TimePicker";
import { ActivityPicker } from "../components/ActivityPicker";
import { FlowerCluster } from "../components/Decorations";
import { Hibiscus, Sprig, TinyFlower } from "../components/botanicals";
import {
  formatLong,
} from "../lib/dateUtils";

export function PlanningScreen({
  selectedDate,
  selectedTime,
  selectedActivityId,
  onSelectDate,
  onSelectTime,
  onSelectActivity,
  onConfirm,
}: {
  selectedDate: string | null;
  selectedTime: string | null;
  selectedActivityId: string | null;
  onSelectDate: (d: string) => void;
  onSelectTime: (t: string) => void;
  onSelectActivity: (id: string) => void;
  onConfirm: () => void;
}) {
  const canContinue = selectedDate !== null && selectedTime !== null;

  /** Stage-by-stage glides: picking a day reveals the time card,
   *  picking a time reveals the activity cards. Nothing important
   *  hides below the fold without a visual cue. */
  const timeCardRef = useRef<HTMLElement | null>(null);
  const activityRef = useRef<HTMLElement | null>(null);
  const dateWasNull = useRef(selectedDate === null);
  const timeWasNull = useRef(selectedTime === null);
  useEffect(() => {
    if (selectedDate !== null && dateWasNull.current) {
      timeCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    dateWasNull.current = selectedDate === null;
  }, [selectedDate]);
  useEffect(() => {
    if (selectedTime !== null && timeWasNull.current) {
      activityRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    timeWasNull.current = selectedTime === null;
  }, [selectedTime]);

  return (
    <motion.section
      className="screen screen--dense !justify-start pt-8"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.4 }}
      aria-labelledby="planning-title"
    >
      <FlowerCluster corner="top-right" variant="hibiscus" />
      <Sprig className="pointer-events-none absolute -left-7 top-40 opacity-50 animate-sway" aria-hidden="true" />

      <header className="relative z-10 text-center">
        <p className="hand text-2xl text-cherry">{INVITEE_NAME}, it's official —</p>
        <h1 id="planning-title" className="font-serif text-4xl font-semibold">
          {COPY.planning.title}
        </h1>
        <p className="hand mt-1 text-xl opacity-80">{COPY.planning.note}</p>
      </header>

      {/* ── the real calendar ── */}
      <div className="paper-card relative z-10 w-full max-w-md px-5 py-6 sm:px-7">
        <span className="tape -top-3 right-6 rotate-3" aria-hidden="true" />
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="hand text-2xl">{COPY.planning.calendarLabel}</h2>
          <span className="sticker">
            <TinyFlower size={14} /> any day counts
          </span>
        </div>

        <DatePicker
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
        />

        {/* handwritten annotation under the calendar */}
        <div className="mt-4 min-h-[2rem] text-center">
          {selectedDate ? (
            <motion.p
              key={selectedDate}
              className="hand text-xl text-cherry"
              initial={{ opacity: 0, rotate: -1.5 }}
              animate={{ opacity: 1, rotate: -0.8 }}
            >
              🌻 {formatLong(selectedDate)}
            </motion.p>
          ) : (
            <p className="hand text-xl opacity-50">tap a day…</p>
          )}
        </div>
      </div>

      {/* ── time picking ── */}
      <section
        ref={timeCardRef}
        aria-label={COPY.planning.timeTitle}
        className="relative z-10 w-full max-w-md scroll-mt-6"
      >
        <div className="paper-card relative px-5 py-5 tilt-2">
          <span className="tape tape--custard -top-3 left-8 -rotate-2" aria-hidden="true" />
          <h2 className="hand text-2xl">{COPY.planning.timeTitle}</h2>
          <TimePicker selectedTime={selectedTime} onSelectTime={onSelectTime} />
          <p className="hand mt-2 text-lg opacity-75">{COPY.planning.timeNote}</p>
        </div>
      </section>

      {/* ── activity picking ── */}
      {FEATURES.activityPicker && (
        <section
          ref={activityRef}
          className="relative z-10 w-full max-w-md scroll-mt-6"
          aria-label={COPY.planning.activityHeading}
        >
          <div className="paper-card relative px-5 py-5">
            <span className="tape tape--powder -top-3 right-8 rotate-2" aria-hidden="true" />
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <div>
                <h2 className="hand text-2xl">{COPY.planning.activityHeading}</h2>
                <p className="hand mt-0.5 text-lg opacity-75">{COPY.planning.activityTitle}</p>
              </div>
              <span className="sticker whitespace-nowrap">
                <TinyFlower size={14} /> pick one
              </span>
            </div>

            <ActivityPicker selectedId={selectedActivityId} onSelect={onSelectActivity} />

            {/* what she chose — handwritten confirmation */}
            <div className="mt-4 min-h-[2rem] text-center">
              {selectedActivityId ? (
                <motion.p
                  key={selectedActivityId}
                  className="hand text-xl text-cherry"
                  initial={{ opacity: 0, rotate: -1.5 }}
                  animate={{ opacity: 1, rotate: -0.8 }}
                >
                  {`${getActivityOption(selectedActivityId)?.emoji ?? "💗"} ${getActivityOption(selectedActivityId)?.name ?? ""} — good choice`}
                </motion.p>
              ) : (
                <p className="hand text-xl opacity-50">hover or tap a card to peek…</p>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-3">
        <button
          type="button"
          className="btn-cherry w-full sm:w-auto"
          disabled={!canContinue}
          onClick={onConfirm}
        >
          {canContinue ? "look at our date →" : "pick a day + time first"}
        </button>
      </div>

      <Hibiscus className="pointer-events-none absolute -right-5 bottom-16 opacity-40" />
      <Sprig className="pointer-events-none absolute -left-6 bottom-40 hidden opacity-40 sm:block" />
    </motion.section>
  );
}
