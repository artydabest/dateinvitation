/** The opening: a tiny flower garden made for Sakshi + the big question. */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { COPY } from "@shared/invitation.config";
import { FlowerGarden } from "../components/FlowerGarden";
import { Bouquet } from "../components/Bouquet";
import { HeartDivider } from "../components/Decorations";
import { FlowerImage } from "../components/flowers";
import { HeartDoodle } from "../components/botanicals";
import type { PickedFlower } from "../state/useInvitationFlow";
import type { GardenFlower } from "@shared/invitation.config";

/**
 * A flower flying from where she clicked into the top-right bouquet.
 * Animates via viewport coordinates so it lands exactly at the corner.
 */
function Flyer({
  flower,
  origin,
  onDone,
}: {
  flower: PickedFlower;
  origin: { x: number; y: number };
  onDone: () => void;
}) {
  return (
    <motion.div
      className="pointer-events-none fixed z-40"
      style={{ left: 0, top: 0 }}
      initial={{ x: origin.x - 32, y: origin.y - 32, scale: 1.35, rotate: -18, opacity: 0.95 }}
      animate={{ x: window.innerWidth - 90, y: 64, scale: 0.5, rotate: 14, opacity: 0 }}
      transition={{ duration: 0.9, ease: "easeIn" }}
      onAnimationComplete={onDone}
    >
      <FlowerImage type={flower.type} size={64} />
    </motion.div>
  );
}

export function OpeningScreen({
  onYes,
  onNo,
  onPick,
  pickedIds,
  pickedFlowers,
}: {
  onYes: () => void;
  onNo: () => void;
  onPick: (flower: GardenFlower) => void;
  pickedIds: Set<string>;
  pickedFlowers: PickedFlower[];
}) {
  const [flying, setFlying] = useState<{
    flower: PickedFlower;
    origin: { x: number; y: number };
  } | null>(null);

  return (
    <motion.section
      className="screen garden-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5 }}
      aria-labelledby="opening-title"
    >
      {/* the garden surrounds the card — config-driven placement */}
      <FlowerGarden
        picked={pickedIds}
        onPick={(flower, origin) => {
          onPick(flower);
          setFlying({ flower: { id: flower.id, type: flower.type }, origin });
        }}
      />

      {/* the question, on a taped paper card */}
      <motion.article
        className="paper-card paper-card--ruled relative z-10 w-full max-w-md px-7 py-9 sm:px-10"
        initial={{ y: 24, opacity: 0, rotate: -1.2 }}
        animate={{ y: 0, opacity: 1, rotate: -0.6 }}
        transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
      >
        <span className="tape -top-3 left-6 -rotate-3" aria-hidden="true" />
        <span className="tape tape--powder -top-2 right-8 rotate-6" aria-hidden="true" />

        <h1
          id="opening-title"
          className="text-center font-serif text-5xl font-semibold leading-tight text-balance sm:text-6xl"
        >
          {COPY.opening.title}
        </h1>
        <p className="mt-3 text-center font-serif text-xl italic text-cocoa">
          {COPY.opening.subtitle}
        </p>

        <HeartDivider className="my-6" />

        <p className="text-center font-serif text-2xl font-medium leading-snug text-balance sm:text-[1.7rem]">
          {COPY.opening.question}{" "}
          <span className="inline-block animate-bob align-middle">
            <HeartDoodle size={22} color="#c8102e" />
          </span>
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button type="button" className="btn-cherry w-full sm:w-auto" onClick={onYes}>
            {COPY.opening.yes}
          </button>
          <button type="button" className="btn-ghost w-full sm:w-auto" onClick={onNo}>
            {COPY.opening.no}
          </button>
        </div>

        <p className="hand mt-5 text-center text-lg opacity-80">{COPY.opening.hint}</p>
      </motion.article>

      {/* ── the bouquet, pinned into the top-right corner (desktop) ── */}
      <div className="bq-corner" aria-live="polite">
        <Bouquet flowers={pickedFlowers} pinned />
      </div>

      {/* pick animation: flower flies toward the corner bouquet */}
      <AnimatePresence>
        {flying && (
          <Flyer
            key={flying.flower.id + String(flying.origin.x)}
            flower={flying.flower}
            origin={flying.origin}
            onDone={() => setFlying(null)}
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
}
