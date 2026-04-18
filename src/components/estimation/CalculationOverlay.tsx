import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/sunavio/Logo";

const STEPS = [
  "Analyse de votre consommation…",
  "Cartographie de votre ensoleillement…",
  "Dimensionnement de votre installation…",
  "Calcul de votre retour sur investissement…",
];

/**
 * Looping calculation overlay. Cycles through STEPS until `done` becomes true,
 * then completes the current cycle and calls onDone.
 */
export const CalculationOverlay = ({
  done,
  onDone,
}: {
  done: boolean;
  onDone: () => void;
}) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % STEPS.length);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  // When the parent signals done, wait for current step to finish then exit
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(onDone, 700);
    return () => clearTimeout(t);
  }, [done, onDone]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Logo className="text-3xl" />
      </motion.div>
      <span className="gold-rule mt-8 mb-8" />
      <div className="h-8 text-center relative w-full max-w-md">
        {STEPS.map((s, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={i === idx ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="absolute left-0 right-0 text-muted-foreground text-base md:text-lg"
          >
            {s}
          </motion.p>
        ))}
      </div>
    </div>
  );
};
