/** The opening-screen flower garden, driven entirely by GARDEN_FLOWERS config. */
import { motion } from "framer-motion";
import {
  GARDEN_FLOWERS,
  type GardenFlower,
} from "@shared/invitation.config";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { Flower, flowerName } from "./flowers";

export function FlowerGarden({
  picked,
  onPick,
}: {
  picked: Set<string>;
  onPick: (flower: GardenFlower, origin: { x: number; y: number }) => void;
}) {
  const reduced = useReducedMotion();

  return (
    // fixed → the garden spans the whole desktop viewport, so flowers really
    // sit near the screen's edges/corners (not just the center column)
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden={false}>
      {GARDEN_FLOWERS.map((f, i) => {
        const isPicked = picked.has(f.id);
        const pickable = f.pickable !== false;
        return (
          <motion.div
            key={f.id}
            className="absolute"
            style={{
              left: `${f.x}%`,
              top: `${f.y}%`,
              zIndex: f.z === "back" ? 0 : 20,
            }}
            /* centering lives INSIDE the motion transform — a static CSS
               translate would be overwritten by framer-motion and push
               flowers off-screen (the right-edge crop bug) */
            initial={
              reduced
                ? { x: "-50%", y: 0, opacity: 1 }
                : { x: "-50%", y: 14, opacity: 0, scale: 0.6 }
            }
            animate={{ x: "-50%", y: 0, opacity: 1, scale: 1 }}
            transition={
              reduced
                ? { duration: 0 }
                : {
                    delay: 0.1 + (i % 6) * 0.07,
                    type: "spring",
                    stiffness: 120,
                    damping: 14,
                  }
            }
          >
            <div className="pointer-events-auto" style={{ rotate: `${f.rotate ?? 0}deg` }}>
              <Flower
                type={f.type}
                size={f.size}
                rotate={0}
                picked={isPicked}
                onPick={
                  pickable
                    ? (e) => onPick(f, { x: e.clientX, y: e.clientY })
                    : undefined
                }
                ariaLabel={pickable ? `pick the ${flowerName(f.type)}` : undefined}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
