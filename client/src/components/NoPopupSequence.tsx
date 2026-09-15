/** The NO loop — one plea per click, in order. YES always works. */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CHARACTERS, COPY, NO_STAGES } from "@shared/invitation.config";
import { HeartSticker } from "./botanicals";
import { useReducedMotion } from "../hooks/useReducedMotion";

const STICKER_SRC: Record<string, string> = {
  kuromi: CHARACTERS.kuromi,
  fatahh: CHARACTERS.fatahh,
  pompompurin: CHARACTERS.pompompurin,
};

function Sticker({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const reduced = useReducedMotion();
  const src = STICKER_SRC[name];

  if (!src || failed) return <HeartSticker size={44} />;

  // fatahh is a wide line-art sticker — give him a wider frame
  const wide = name === "fatahh";
  return (
    <motion.img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={wide ? 150 : 84}
      height={wide ? 90 : 84}
      className="mx-auto select-none object-contain drop-shadow-sm"
      initial={reduced ? false : { scale: 2.2, rotate: -18, opacity: 0 }}
      animate={{ scale: 1, rotate: -4, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
      onError={() => setFailed(true)}
    />
  );
}

function StagePopup({
  stage,
  onInsist,
  onYes,
}: {
  stage: number;
  onInsist: () => void;
  onYes: () => void;
}) {
  const reduced = useReducedMotion();
  const noButtonRef = useRef<HTMLButtonElement>(null);
  const popup = NO_STAGES[stage]!;

  // keep focus on the "no" button as cards swap — the joke must stay clickable
  useEffect(() => {
    noButtonRef.current?.focus();
  }, [stage]);

  return (
    <motion.div
      className="paper-card relative w-full max-w-sm px-7 py-8 text-center"
      initial={reduced ? false : { scale: 0.9, y: 16, rotate: -1.5 }}
      animate={{ scale: 1, y: 0, rotate: -0.5 }}
      exit={reduced ? undefined : { scale: 0.94, opacity: 0, y: 8 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      onClick={(e) => e.stopPropagation()}
    >
      <span
        className="tape tape--powder -top-3 left-1/2 -translate-x-1/2 rotate-2"
        aria-hidden="true"
      />

      <div className="mx-auto mb-3 flex h-[92px] w-fit items-center justify-center">
        <Sticker name={popup.sticker} />
      </div>

      <h2 className="font-serif text-2xl font-semibold leading-snug text-balance sm:text-3xl">
        {popup.message}
      </h2>
      {popup.subtitle && (
        <p className="hand mt-2 text-xl text-cherry">{popup.subtitle}</p>
      )}

      {/* YES is always on the table — the joke is the escalating "no"s, not a trap */}
      <div className="mt-6 flex flex-col gap-2.5">
        <button type="button" className="btn-cherry" onClick={onYes}>
          {popup.yes ?? "okay fine 💗"}
        </button>
        <button ref={noButtonRef} type="button" className="btn-ghost" onClick={onInsist}>
          {popup.no ?? "no"}
        </button>
      </div>
    </motion.div>
  );
}

/** After the last stage — she really means it: a genuinely respectful close. */
function RespectPopup({ onClose }: { onClose: () => void }) {
  const reduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <motion.div
      className="paper-card relative w-full max-w-sm px-7 py-9 text-center"
      initial={reduced ? false : { scale: 0.9, y: 16, rotate: -1.5 }}
      animate={{ scale: 1, y: 0, rotate: -0.5 }}
      exit={reduced ? undefined : { scale: 0.94, opacity: 0, y: 8 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-2" aria-hidden="true" />
      <HeartSticker size={44} className="mx-auto mb-3 animate-bob" />
      <h2 className="font-serif text-3xl font-semibold">{COPY.noRespect.title}</h2>
      {COPY.noRespect.body.split("\n\n").map((para, i) => (
        <p
          key={i}
          className={`mt-2 ${i === 0 ? "hand text-2xl" : "text-[15px] leading-relaxed text-cocoa"}`}
        >
          {para}
        </p>
      ))}
      <div className="mt-6 flex flex-col gap-2.5">
        <button ref={closeRef} type="button" className="btn-ghost" onClick={onClose}>
          {COPY.noRespect.close}
          <span aria-hidden="true"> ↩</span>
        </button>
      </div>
    </motion.div>
  );
}

export function NoPopupSequence({
  stage,
  onInsist,
  onYes,
  onClose,
}: {
  /** Which plea is on screen; NO_STAGES.length → the respectful close. */
  stage: number;
  /** The popup's "no" → next plea. */
  onInsist: () => void;
  /** "okay fine 💗" → continue into the date flow. */
  onYes: () => void;
  /** Close without advancing (Escape / close button). */
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isLast = stage >= NO_STAGES.length;
  const safeStage = Math.min(stage, NO_STAGES.length - 1);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="A very important negotiation"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isLast ? (
          <RespectPopup key="respect" onClose={onClose} />
        ) : (
          <StagePopup
            key={`stage-${stage}`}
            stage={safeStage}
            onInsist={onInsist}
            onYes={onYes}
          />
        )}
      </AnimatePresence>
      <button
        type="button"
        className="absolute right-4 top-4 rounded-full bg-paper/90 px-3 py-2 text-sm font-semibold text-cocoa shadow-card"
        onClick={onClose}
        aria-label="close popup"
      >
        ✕ close
      </button>
      <span className="sr-only">
        saying no keeps bringing new pleads. the yes button always works too.
      </span>
    </motion.div>
  );
}
