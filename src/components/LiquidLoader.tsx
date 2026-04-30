import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

export const LiquidLoader = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<"falling" | "melting" | "done">("falling");
  const text = "VoiceToWebsite.com";
  const letters = text.split("");

  // Metallic Tech Palette: Cyan, Sky, Blue, Emerald, Silver (No Pink or Purple)
  const colors = ["#06b6d4", "#0ea5e9", "#3b82f6", "#10b981", "#94a3b8"];

  useEffect(() => {
    // Phase 1: Falling (Letters fall 1 by 1)
    const totalFallbackTime = letters.length * 100 + 2000;
    const timer = setTimeout(() => {
      setPhase("melting");
    }, totalFallbackTime);

    // Phase 2: Melting (Drop to footer)
    const meltTimer = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, totalFallbackTime + 1500);

    return () => {
      clearTimeout(timer);
      clearTimeout(meltTimer);
    };
  }, [letters.length, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-100 bg-black flex items-center justify-center overflow-hidden"
    >
      <div className="relative flex">
        {letters.map((char, i) => (
          <motion.span
            key={i}
            initial={{ y: -500, opacity: 0 }}
            animate={{
              ...(phase === "falling"
                ? { y: 0, opacity: 1 }
                : { y: 1000, opacity: 0, scaleY: 2, scaleX: 0.5 }),
              color: [
                colors[i % colors.length],
                colors[(i + 1) % colors.length],
                colors[i % colors.length],
              ],
            }}
            transition={{
              y: {
                type: "spring",
                damping: 12,
                stiffness: 100,
                delay: phase === "falling" ? i * 0.1 : i * 0.05,
                duration: phase === "melting" ? 1.5 : 1,
              },
              opacity: {
                delay: phase === "falling" ? i * 0.1 : i * 0.05,
                duration: phase === "melting" ? 1.5 : 1,
              },
              color: {
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              },
            }}
            className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter drop-shadow-[0_0_20px_rgba(79,70,229,0.5)]"
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </div>

      {/* Surface of "liquid" at the bottom starting to rise */}
      <AnimatePresence>
        {phase === "melting" && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "10vh" }}
            className="absolute bottom-0 left-0 w-full bg-linear-to-t from-indigo-600 via-cyan-600 to-transparent blur-xl opacity-50"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
