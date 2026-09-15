/** The gathered bouquet — overlapping flower images, pinned top-right like scrapbook. */
import { AnimatePresence, motion } from "framer-motion";
import type { FlowerType } from "@shared/invitation.config";
import { COPY } from "@shared/invitation.config";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { FlowerImage } from "./flowers";
import { HeartSticker } from "./botanicals";

export interface PickedFlower {
  /** Unique instance id (garden flower id). */
  id: string;
  type: FlowerType;
}

/**
 * Overlapping arrangement slots — fanned up and out from the wrap cone.
 * x/y are offsets from the cone's center axis (x=0), so every flower
 * stays centered on the bouquet regardless of size.
 */
const BOUQUET_SLOTS = [
  { x: 0, y: -34, s: 0.95, r: -14 },
  { x: -24, y: -22, s: 0.9, r: 12 },
  { x: 24, y: -24, s: 0.88, r: -8 },
  { x: -10, y: -44, s: 0.8, r: 6 },
  { x: 14, y: -40, s: 0.78, r: -18 },
  { x: -32, y: -30, s: 0.72, r: 20 },
  { x: 32, y: -32, s: 0.7, r: 10 },
  { x: 4, y: -20, s: 0.68, r: -4 },
  { x: -18, y: -8, s: 0.62, r: 16 },
  { x: 20, y: -10, s: 0.6, r: -12 },
  { x: -36, y: -14, s: 0.58, r: 24 },
  { x: 36, y: -16, s: 0.56, r: -22 },
];

const FLOWER_PX = 56; // flower size before slot scale
/** Where flower stems tuck into the cone (px from the box bottom). */
const STEM_Y = 30;

export function Bouquet({
  flowers,
  label = COPY.opening.bouquetLabel,
  compact = false,
  /** Pinned mode adds the washi-tape strip holding it to the page. */
  pinned = false,
}: {
  flowers: PickedFlower[];
  label?: string;
  /** Smaller arrangement (tight corners). */
  compact?: boolean;
  pinned?: boolean;
}) {
  const reduced = useReducedMotion();
  const scale = compact ? 0.72 : 1;
  const flowerPx = Math.round(FLOWER_PX * scale);

  return (
    <div
      className="pointer-events-none z-30 flex w-max flex-col items-center"
      aria-label={label}
    >
      {/* the gathered bunch */}
      <div
        className="relative"
        style={{ width: 120 * scale, height: 128 * scale }}
        aria-hidden="true"
      >
        {/* washi tape holding the bouquet to the page */}
        {pinned && (
          <span
            className="tape tape--powder -top-2 left-1/2 z-20 -translate-x-1/2 -rotate-3"
            style={{ width: 64 * scale, height: 20 * scale }}
          />
        )}

        {/* flowers, fanned around the cone axis (centered, not left-anchored) */}
        <AnimatePresence>
          {flowers.slice(-BOUQUET_SLOTS.length).map((f, i) => {
            const slot = BOUQUET_SLOTS[i]!;
            return (
              <motion.div
                key={f.id}
                className="absolute"
                style={{
                  // center the box on the axis: left edge = 50% − half flower
                  left: `calc(50% - ${flowerPx / 2}px)`,
                  bottom: STEM_Y * scale,
                }}
                initial={
                  reduced
                    ? false
                    : { x: 50, y: 70, opacity: 0, scale: 0.4, rotate: 40 }
                }
                animate={{
                  x: slot.x * scale,
                  y: slot.y * scale,
                  scale: slot.s,
                  rotate: slot.r,
                  opacity: 1,
                }}
                exit={reduced ? undefined : { scale: 0.3, opacity: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 17 }}
              >
                <FlowerImage type={f.type} size={flowerPx} className="drop-shadow-sm" />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* empty state: a single heart waiting in the wrap */}
        {flowers.length === 0 && (
          <motion.div
            className="absolute"
            style={{ left: `calc(50% - ${11 * scale}px)`, bottom: STEM_Y * scale }}
            animate={reduced ? undefined : { y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <HeartSticker size={Math.round(22 * scale)} />
          </motion.div>
        )}

        {/* the cone wrap, ON TOP — its wide mouth covers the stems */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{ zIndex: 30 }}
        >
          <div
            className="bq-wrap"
            style={{ width: 46 * scale, height: 54 * scale }}
          />
        </div>
      </div>

      {/* handwritten label (no count) */}
      <span className="hand mt-0.5 text-lg text-cherry">{label}</span>
    </div>
  );
}
