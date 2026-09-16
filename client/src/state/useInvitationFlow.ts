import { useCallback, useMemo, useState } from "react";
import type {
  CreateInvitationInput,
  DateInvitationDTO,
} from "@shared/invitation.types";
import { createInvitation } from "../api/invitationApi";
import type { GardenFlower } from "@shared/invitation.config";
import { NO_STAGES } from "@shared/invitation.config";

export type FlowStep =
  | "opening" // the garden + the question
  | "celebration" // IT'S A DATE burst
  | "planning" // calendar + time
  | "confirming" // ticket review
  | "final"; // success

export interface PickedFlower {
  id: string;
  type: GardenFlower["type"];
}

/** Dev/testing shortcut: ?step=planning&date=2026-09-19&time=18:00 jumps ahead. */
const queryParams =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
const QUERY_STEPS = ["celebration", "planning", "confirming", "final"] as const;

export function useInvitationFlow() {
  const [step, setStep] = useState<FlowStep>(() => {
    const s = queryParams.get("step");
    return QUERY_STEPS.includes(s as (typeof QUERY_STEPS)[number])
      ? (s as FlowStep)
      : "opening";
  });
  /** The stage currently on screen (NO_STAGES.length = the respectful close).
   *  The popup's "no" advances it; progress persists across closes. */
  const [noStage, setNoStage] = useState(0);
  /** Whether a NO popup is currently on screen. */
  const [noOpen, setNoOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(
    () => queryParams.get("date"),
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(
    () => queryParams.get("time"),
  );
  /** The main activity she picked for the date (id from ACTIVITY_OPTIONS). */
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  /** Flowers she picked, in order. */
  const [pickedFlowers, setPickedFlowers] = useState<PickedFlower[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<DateInvitationDTO | null>(null);

  const pickedIds = useMemo(() => new Set(pickedFlowers.map((f) => f.id)), [pickedFlowers]);

  const pickFlower = useCallback((flower: GardenFlower) => {
    setPickedFlowers((prev) => {
      const alreadyPicked = prev.some((f) => f.id === flower.id);
      return alreadyPicked ? prev : [...prev, { id: flower.id, type: flower.type }];
    });
  }, []);

  const sayYes = useCallback(() => setStep("celebration"), []);

  /** NO on the main screen: open the popup at the current stage. */
  const sayNo = useCallback(() => setNoOpen(true), []);
  /** The popup's "no" button → advance to the next stage immediately. */
  const insistNo = useCallback(
    () => setNoStage((s) => Math.min(s + 1, NO_STAGES.length)),
    [],
  );
  /** "okay fine 💗" → she gives in, treat as YES. */
  const giveIn = useCallback(() => {
    setNoOpen(false);
    setStep("celebration");
  }, []);
  /** Close without advancing — NO stays fully available, progress is kept. */
  const closeNoPopup = useCallback(() => setNoOpen(false), []);

  const goToConfirm = useCallback(() => setStep("confirming"), []);
  const backToPlanning = useCallback(() => setStep("planning"), []);

  const validSelection = selectedDate !== null && selectedTime !== null;

  const confirm = useCallback(
    async (opts: { requestCalendar: boolean; requestEmail: boolean }) => {
      if (!validSelection) return;
      setSubmitting(true);
      setSubmitError(null);
      try {
        const input: CreateInvitationInput = {
          selectedDate: selectedDate!,
          selectedTime: selectedTime!,
          activityId: selectedActivityId,
          pickedFlowers,
          requestCalendar: opts.requestCalendar,
          requestEmail: opts.requestEmail,
        };
        const res = await createInvitation(input);
        setResult(res.invitation);
        setStep("final");
      } catch (err) {
        setSubmitError(
          err instanceof Error
            ? err.message
            : "Something went wrong. The website is embarrassed.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [selectedDate, selectedTime, selectedActivityId, pickedFlowers, validSelection],
  );

  return {
    step,
    setStep,
    noStage,
    noOpen,
    pickedFlowers,
    pickedIds,
    selectedDate,
    selectedTime,
    setSelectedDate,
    setSelectedTime,
    selectedActivityId,
    setSelectedActivityId,
    submitting,
    submitError,
    result,
    sayYes,
    sayNo,
    giveIn,
    insistNo,
    closeNoPopup,
    pickFlower,
    goToConfirm,
    backToPlanning,
    confirm,
  };
}
