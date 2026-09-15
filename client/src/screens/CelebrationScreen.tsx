/** The YES burst — IT'S A DATE. */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { COPY } from "@shared/invitation.config";
import { PetalBurst } from "../components/Decorations";
import { Sunflower } from "../components/botanicals";

const POMPOMPURIN = "/assets/characters/pompompurin.png";

function PompompurinSpot() {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <motion.img
        src={POMPOMPURIN}
        alt="Pompompurin"
        draggable={false}
        className="h-28 w-28 select-none rounded-full border-4 border-custard bg-paper object-contain shadow-card"
        initial={{ scale: 0.5, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 14 }}
        onError={() => setFailed(true)}
      />
    );
  }
  return <Sunflower size={110} className="animate-sway opacity-90" />;
}

export function CelebrationScreen({ onContinue }: { onContinue: () => void }) {
  const [burst, setBurst] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setBurst(false), 1800);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <motion.section
      className="screen"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.45 }}
      aria-labelledby="celebration-title"
    >
      <PetalBurst show={burst} />
      <PompompurinSpot />
      <h1
        id="celebration-title"
        className="text-center font-serif text-5xl font-semibold text-balance sm:text-6xl"
      >
        {COPY.yesBurst.title}
      </h1>
      <p className="hand text-center text-2xl text-cocoa">{COPY.yesBurst.subtitle}</p>
      <button type="button" className="btn-cherry" onClick={onContinue}>
        {COPY.yesBurst.continue}
      </button>
    </motion.section>
  );
}
