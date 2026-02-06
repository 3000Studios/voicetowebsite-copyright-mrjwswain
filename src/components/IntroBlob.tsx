import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

interface IntroBlobProps {
  splatterActive: boolean;
  onStart: () => void;
}

const IntroBlob: React.FC<IntroBlobProps> = ({ splatterActive, onStart }) => {
  const blobRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const centerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updateCenter = () => {
      if (blobRef.current) {
        const rect = blobRef.current.getBoundingClientRect();
        centerRef.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      }
    };

    updateCenter();
    window.addEventListener('resize', updateCenter);

    // Also update on mount/delay because layout might shift
    const t = setTimeout(updateCenter, 100);
    return () => {
        window.removeEventListener('resize', updateCenter);
        clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const maxPull = 50;
  const pullRadius = 300;

  const calculatePull = (mx: number, my: number) => {
    const cx = centerRef.current.x;
    const cy = centerRef.current.y;
    const dist = Math.hypot(mx - cx, my - cy);

    if (dist < pullRadius) {
      const pullFactor = (1 - dist / pullRadius) * maxPull;
      const angle = Math.atan2(my - cy, mx - cx);
      return {
        x: Math.cos(angle) * pullFactor,
        y: Math.sin(angle) * pullFactor,
      };
    }
    return { x: 0, y: 0 };
  };

  const xPull = useTransform([mouseX, mouseY], ([mx, my]) => calculatePull(mx as number, my as number).x);
  const yPull = useTransform([mouseX, mouseY], ([mx, my]) => calculatePull(mx as number, my as number).y);

  const springConfig = { damping: 15, stiffness: 60 };
  const x = useSpring(xPull, springConfig);
  const y = useSpring(yPull, springConfig);

  return (
    <motion.div
        ref={blobRef}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
            opacity: 1,
            scale: splatterActive ? 25 : [1, 1.05, 1],
            borderRadius: splatterActive ? "50%" : ["50% 50% 50% 50%", "48% 52% 45% 55%", "52% 48% 55% 45%"]
        }}
        style={{ x, y }}
        transition={{
            opacity: { duration: 1 },
            scale: { duration: splatterActive ? 1.2 : 4, ease: splatterActive ? "circIn" : "easeInOut", repeat: splatterActive ? 0 : Infinity },
            borderRadius: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }}
        onClick={onStart}
        className="w-48 h-48 md:w-64 md:h-64 metallic-goo cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden"
    >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-black/20 pointer-events-none" />
        {!splatterActive && (
            <motion.span
                animate={{ opacity: [0.6, 1, 0.6], letterSpacing: ["0.3em", "0.5em", "0.3em"] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="font-orbitron text-[8px] md:text-[9px] text-black font-black uppercase pointer-events-none z-20 text-center px-4"
            >
                IGNITE INTERFACE
            </motion.span>
        )}
    </motion.div>
  );
};

export default IntroBlob;
