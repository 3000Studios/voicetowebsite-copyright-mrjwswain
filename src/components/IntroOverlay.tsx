import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { INTRO_VIDEO } from "../constants";

interface IntroOverlayProps {
  onStart: () => void;
  onComplete: () => void;
}

const IntroOverlay: React.FC<IntroOverlayProps> = ({ onStart, onComplete }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [splatterActive, setSplatterActive] = useState(false);
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateMouse = (e: MouseEvent) =>
      setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", updateMouse);
    return () => window.removeEventListener("mousemove", updateMouse);
  }, []);

  const getBlobStyles = () => {
    if (!blobRef.current) return {};
    const rect = blobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dist = Math.hypot(mousePos.x - centerX, mousePos.y - centerY);
    const maxPull = 50;
    const pullRadius = 300;

    if (dist < pullRadius) {
      const pullFactor = (1 - dist / pullRadius) * maxPull;
      const angle = Math.atan2(mousePos.y - centerY, mousePos.x - centerX);
      return {
        x: Math.cos(angle) * pullFactor,
        y: Math.sin(angle) * pullFactor,
      };
    }
    return { x: 0, y: 0 };
  };

  const handleClick = () => {
    onStart();
    setSplatterActive(true);

    setTimeout(() => {
      onComplete();
    }, 800);
  };

  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.1, filter: "blur(50px)" }}
      transition={{ duration: 1.5, ease: "circIn" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-40 scale-105"
        >
          <source src={INTRO_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
      </div>

      <div className="relative z-10 text-center liquid-container flex items-center justify-center">
        <motion.div
          ref={blobRef}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: 1,
            scale: splatterActive ? 25 : [1, 1.05, 1],
            borderRadius: splatterActive
              ? "50%"
              : ["50% 50% 50% 50%", "48% 52% 45% 55%", "52% 48% 55% 45%"],
            ...getBlobStyles(),
          }}
          transition={{
            opacity: { duration: 1 },
            scale: {
              duration: splatterActive ? 1.2 : 4,
              ease: splatterActive ? "circIn" : "easeInOut",
              repeat: splatterActive ? 0 : Infinity,
            },
            borderRadius: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            x: { type: "spring", damping: 15, stiffness: 60 },
            y: { type: "spring", damping: 15, stiffness: 60 },
          }}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Ignite Interface"
          className="w-48 h-48 md:w-64 md:h-64 metallic-goo cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden focus-visible:ring-4 focus-visible:ring-cyan-400 focus-visible:ring-offset-4 focus-visible:ring-offset-black outline-none"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-black/20 pointer-events-none" />
          {!splatterActive && (
            <motion.span
              animate={{
                opacity: [0.6, 1, 0.6],
                letterSpacing: ["0.3em", "0.5em", "0.3em"],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="font-orbitron text-[8px] md:text-[9px] text-black font-black uppercase pointer-events-none z-20 text-center px-4"
            >
              IGNITE INTERFACE
            </motion.span>
          )}
        </motion.div>
      </div>

      <div className="absolute bottom-10 md:bottom-20 w-full text-center z-10 px-4">
        <motion.h1
          className="font-orbitron text-2xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent tracking-[0.2em] md:tracking-[0.3em] uppercase"
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={{
            opacity: [0, 1, 1, 0.8, 1],
            scale: [0.5, 1.1, 1, 1.05, 1],
            rotate: [-10, 5, -2, 1, 0],
            y: [0, -10, 0, -5, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut",
          }}
          whileHover={{
            scale: 1.15,
            rotate: 2,
            textShadow:
              "0 0 30px rgba(34, 211, 238, 0.8), 0 0 60px rgba(59, 130, 246, 0.6)",
          }}
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0.7, 1] }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            GET THE NEW APP
          </motion.span>
          <br />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0.7, 1] }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-3xl md:text-6xl"
          >
            RIGHT NOW!
          </motion.span>
        </motion.h1>

        <motion.div
          className="mt-4 flex justify-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default IntroOverlay;
