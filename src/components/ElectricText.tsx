import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { audioEngine } from "../services/audioEngine";

interface ElectricTextProps {
  text: string;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  active?: boolean;
  role?: string;
  tabIndex?: number;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  "aria-label"?: string;
}

const ElectricText: React.FC<ElectricTextProps> = ({
  text,
  className,
  onClick,
  active,
  role,
  tabIndex,
  onKeyDown,
  "aria-label": ariaLabel,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHovered) {
      audioEngine.playHum();
      const interval = setInterval(() => {
        audioEngine.playSpark();
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isHovered]);

  return (
    <motion.div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      className={`relative cursor-none select-none ${className} font-orbitron font-black tracking-widest flex flex-col items-center justify-center`}
    >
      {/* Platinum Steel-Plated Typography with shimmer */}
      <span
        className={`
        relative z-10 transition-all duration-500
        ${isHovered ? "text-white scale-110 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" : "gold-platinum-text opacity-90"}
      `}
      >
        {text}
      </span>

      {/* Reactive Glow Beneath */}
      <AnimatePresence>
        {(active || isHovered) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute -inset-8 bg-cyan-500/10 blur-3xl rounded-full z-0"
          />
        )}
      </AnimatePresence>

      {/* Electric Spark Discharges */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-white h-[1px] w-6 md:w-12"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0],
                x: [`${Math.random() * 100}%`, `${Math.random() * 150 - 25}%`],
                y: [`${Math.random() * 100}%`, `${Math.random() * 150 - 25}%`],
                scaleX: [0.1, 2, 0.1],
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 0.2 + Math.random() * 0.2,
                repeat: Infinity,
                delay: i * 0.05,
              }}
              style={{
                boxShadow: "0 0 8px #fff, 0 0 12px #22d3ee",
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ElectricText;
