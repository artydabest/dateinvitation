/** Flower rendering — real PNG assets with hand-drawn SVG fallbacks. */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  FLOWER_IMAGES,
  FLOWER_TYPES,
  type FlowerType,
} from "@shared/invitation.config";
import { useReducedMotion } from "../hooks/useReducedMotion";
import {
  BabysBreath,
  Hibiscus,
  Lily,
  SmallPink,
  Sunflower,
} from "./botanicals";

const FALLBACKS: Record<
  FlowerType,
  (p: { size?: number; className?: string; style?: React.CSSProperties }) => React.ReactElement
> = {
  cherryRedHibiscus: Hibiscus,
  sunflower: Sunflower,
  lily: Lily,
  lilyAlt: Lily,
  babysBreath: BabysBreath,
  smallPink: SmallPink,
};

/**
 * Renders the real flower image; falls back to the built-in hand-drawn
 * SVG when the image fails to load.
 */
export function FlowerImage({
  type,
  size,
  className = "",
  style,
}: {
  type: FlowerType;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  const Fallback = FALLBACKS[type];

  if (failed) {
    return <Fallback size={size} className={className} style={style} />;
  }
  return (
    <img
      src={FLOWER_IMAGES[type]}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={size}
      height={size}
      className={`select-none object-contain ${className}`}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}

/**
 * One flower in the garden. Pickable flowers show a gentle press/hover
 * cue; picked flowers fade and shrink in place (but stay clickable —
 * picking again just re-flies it to the bouquet).
 */
export function Flower({
  type,
  size,
  rotate = 0,
  picked = false,
  onPick,
  className = "",
  ariaLabel,
}: {
  type: FlowerType;
  size: number;
  rotate?: number;
  picked?: boolean;
  /** Receives the click event so callers can animate from the click origin. */
  onPick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  ariaLabel?: string;
}) {
  const reduced = useReducedMotion();
  const pickable = Boolean(onPick);

  return (
    <motion.button
      type="button"
      className={`block border-0 bg-transparent p-0 leading-none ${className}`}
      style={{ width: size, height: size, cursor: pickable ? "pointer" : "default" }}
      onClick={pickable ? onPick : undefined}
      aria-label={ariaLabel}
      aria-pressed={pickable ? picked : undefined}
      tabIndex={pickable ? 0 : -1}
      whileHover={pickable && !reduced ? { scale: 1.08, rotate: rotate + 3 } : undefined}
      whileTap={pickable && !reduced ? { scale: 0.94 } : undefined}
      animate={
        picked && !reduced
          ? { scale: 0.8, opacity: 0.45, rotate }
          : { scale: 1, opacity: 1, rotate }
      }
      initial={false}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      <FlowerImage type={type} size={size} className="h-full w-full drop-shadow-sm" />
    </motion.button>
  );
}

/** Convenience for aria-labels. */
export function flowerName(type: FlowerType): string {
  return FLOWER_TYPES[type]?.name ?? "flower";
}
