/** Decorative flower clusters for screen corners, hearts, petals. */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HeartOutline,
  HeartSticker,
  Sprig,
  TinyFlower,
} from "./botanicals";
import { FlowerImage } from "./flowers";
import { useReducedMotion } from "../hooks/useReducedMotion";

/* ─────────────────── Heart accents ─────────────────── */

/** A small row of hearts used as a divider. */
export function HeartDivider({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center gap-2 opacity-80 ${className}`}
    >
      <HeartOutline size={18} />
      <HeartSticker size={22} />
      <HeartOutline size={18} />
    </div>
  );
}

/* ───────────────────────── Flower cluster ───────────────────────── */

/** Organically placed corner cluster; large ones sit partly off-screen. */
export function FlowerCluster({
  corner,
  variant = "sunflower",
}: {
  corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  variant?: "sunflower" | "hibiscus" | "lily" | "sprig" | "mixed";
}) {
  const pos: Record<string, string> = {
    "top-left": "-left-8 -top-6 sm:-left-12",
    "top-right": "-right-8 -top-6 sm:-right-12",
    "bottom-left": "-left-8 -bottom-8 sm:-left-12",
    "bottom-right": "-right-8 -bottom-8 sm:-right-12",
  };

  const inner = (
    <div className="relative">
      {(variant === "sunflower" || variant === "mixed") && (
        <FlowerImage type="sunflower" size={96} className="opacity-90 drop-shadow-sm" />
      )}
      {variant === "hibiscus" && (
        <FlowerImage type="cherryRedHibiscus" size={84} className="opacity-90" />
      )}
      {variant === "lily" && <FlowerImage type="lily" size={84} className="opacity-90" />}
      {variant === "sprig" && <Sprig size={72} className="opacity-80" />}
      {(variant === "mixed" || variant === "lily") && (
        <TinyFlower
          size={20}
          color="#bcd6ea"
          center="#8fb8d8"
          className="absolute -right-3 top-6"
        />
      )}
      {(variant === "mixed" || variant === "sunflower") && (
        <TinyFlower size={16} className="absolute -left-4 bottom-8" />
      )}
    </div>
  );

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute ${pos[corner]} z-0 animate-sway-slow`}
    >
      {inner}
    </div>
  );
}

/* ─────────────────────────── Petals layer ───────────────────────── */

interface Petal {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  drift: number;
  color: string;
}

const PETAL_COLORS = ["#f6d7dd", "#bcd6ea", "#f7d774", "#f3c4cd"];

export function PetalsLayer({ count = 12 }: { count?: number }) {
  const reduced = useReducedMotion();
  const [petals] = useState<Petal[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 14 + Math.random() * 14,
      size: 8 + Math.random() * 8,
      drift: (Math.random() - 0.5) * 60,
      color: PETAL_COLORS[i % PETAL_COLORS.length] ?? "#f6d7dd",
    })),
  );

  if (reduced) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
    >
      {petals.map((p) => (
        <motion.span
          key={p.id}
          className="absolute block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.72,
            background: p.color,
            borderRadius: "80% 20% 70% 30% / 60% 40% 60% 40%",
            opacity: 0.7,
          }}
          initial={{ y: -30, rotate: 0 }}
          animate={{
            y: ["-5vh", "105vh"],
            x: [0, p.drift, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────── Selection celebration ──────────────────── */

/** One-shot petal burst used on YES and on confirm. `subtle` = a softer,
 *  smaller shower (e.g. sealing the envelope) vs the big celebration. */
export function PetalBurst({ show, subtle = false }: { show: boolean; subtle?: boolean }) {
  const reduced = useReducedMotion();
  const pieces = Array.from({ length: subtle ? 10 : 18 }, (_, i) => i);
  return (
    <AnimatePresence>
      {show && !reduced && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
        >
          {pieces.map((i) => {
            const angle = (i / pieces.length) * Math.PI * 2;
            const dist = (subtle ? 70 : 120) + Math.random() * (subtle ? 70 : 180);
            return (
              <motion.span
                key={i}
                className="absolute left-1/2 top-1/2 block"
                style={{
                  width: subtle ? 8 : 10,
                  height: subtle ? 6.5 : 8,
                  borderRadius: "80% 20% 70% 30% / 60% 40% 60% 40%",
                  background:
                    PETAL_COLORS[i % PETAL_COLORS.length] ?? "#f6d7dd",
                }}
                initial={{ x: 0, y: 0, opacity: subtle ? 0.8 : 1, scale: 0.6, rotate: 0 }}
                animate={{
                  x: Math.cos(angle) * dist,
                  y: Math.sin(angle) * dist - (subtle ? 24 : 40),
                  opacity: 0,
                  scale: 1.1,
                  rotate: Math.random() * 360,
                }}
                transition={{ duration: (subtle ? 1 : 1.4) + Math.random(), ease: "easeOut" }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
