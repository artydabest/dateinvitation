/** She picks the main activity — hover (or tap) a card to peek the photo, the plan + the real spot on Maps. */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ActivityOption } from "@shared/invitation.config";
import { ACTIVITY_OPTIONS } from "@shared/invitation.config";
import { FlowerImage } from "./flowers";
import { useReducedMotion } from "../hooks/useReducedMotion";

/** The "photo": a real image when configured, a pastel placeholder otherwise. */
function ActivityPhoto({
  emoji,
  color,
  image,
}: {
  emoji: string;
  color: string;
  image: string;
}) {
  const [broken, setBroken] = useState(false);
  const showImg = image !== "" && !broken;

  return (
    <span
      className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-md"
      style={{ background: `linear-gradient(150deg, ${color}, ${color}cc)` }}
    >
      {showImg ? (
        <img
          src={image}
          alt=""
          draggable={false}
          className="h-full w-full select-none object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span
          aria-hidden="true"
          className="select-none text-[2.6rem] leading-none drop-shadow-sm"
        >
          {emoji}
        </span>
      )}
    </span>
  );
}

/** The peek popup — what we'd do there + the real spot on Maps (when set).
 *  Clicks pass through to the card, except on the Maps link itself. */
function PeekPopup({ option }: { option: ActivityOption }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18 }}
      className="hand pointer-events-none absolute inset-x-1.5 bottom-1.5 z-10 block rounded-md bg-cocoa/90 px-2 pb-2 pt-1.5 text-[13px] leading-snug text-paper"
    >
      {option.description}
      {option.location && (
        <a
          href={option.location}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto mt-1 flex items-center gap-1 text-[12px] font-semibold not-italic text-custard underline decoration-dotted underline-offset-2"
          aria-label={`${option.place ?? "venue"} — open in Google Maps`}
        >
          <span aria-hidden="true">📍</span> {option.place}
          <span aria-hidden="true" className="no-underline">
            ↗
          </span>
        </a>
      )}
      <span
        aria-hidden="true"
        className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1.5 rotate-45 bg-cocoa/90"
      />
    </motion.span>
  );
}

export function ActivityPicker({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const reduced = useReducedMotion();
  /** Hover/focus (desktop) or selection keeps a card's peek open. */
  const [peekedId, setPeekedId] = useState<string | null>(null);

  return (
    <div
      role="radiogroup"
      aria-label="the main activity"
      className="grid grid-cols-2 gap-3.5"
    >
      {ACTIVITY_OPTIONS.map((opt, i) => {
        const selected = selectedId === opt.id;
        const open = selected || peekedId === opt.id;

        return (
          <motion.div
            key={opt.id}
            role="radio"
            aria-checked={selected}
            aria-label={`pick ${opt.name}`}
            tabIndex={0}
            onClick={() => onSelect(opt.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(opt.id);
              }
            }}
            onMouseEnter={() => setPeekedId(opt.id)}
            onMouseLeave={() => setPeekedId((id) => (id === opt.id ? null : id))}
            onFocus={() => setPeekedId(opt.id)}
            onBlur={() => setPeekedId((id) => (id === opt.id ? null : id))}
            whileTap={{ scale: 0.96 }}
            className={`paper-card relative flex cursor-pointer flex-col gap-2 px-2.5 pb-2.5 pt-2.5 text-left transition-shadow ${
              i % 2 === 0 ? "-rotate-[0.7deg]" : "rotate-[0.7deg]"
            } ${selected ? "ring-2 ring-cherry ring-offset-2 ring-offset-cream" : ""}`}
          >
            <div className="relative">
              <ActivityPhoto
                emoji={opt.emoji}
                color={opt.color}
                image={opt.image}
              />

              {/* the peek — overlays the photo, name stays visible */}
              <AnimatePresence initial={false}>
                {open && <PeekPopup option={opt} />}
              </AnimatePresence>

              {!open && (
                <span
                  aria-hidden="true"
                  className="hand pointer-events-none absolute right-1.5 top-1.5 rounded-full bg-paper/85 px-1.5 py-0.5 text-[10px] opacity-70"
                >
                  peek 👀
                </span>
              )}
            </div>

            <span className="relative flex items-start justify-between gap-1 px-0.5">
              {/* two-line reserve so every card in the grid is the same height */}
              <span className="hand min-h-[2.9rem] text-lg leading-tight">{opt.name}</span>
              {selected && (
                <motion.span
                  className="absolute -right-1.5 -top-4 z-10"
                  initial={reduced ? false : { scale: 0, rotate: -40 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 15 }}
                  aria-hidden="true"
                >
                  <FlowerImage type="smallPink" size={22} />
                </motion.span>
              )}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
