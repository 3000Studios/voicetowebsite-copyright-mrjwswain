import { motion, useReducedMotion } from "motion/react";
import React from "react";

export const WallpaperBg: React.FC = () => {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_-10%,rgba(0,242,255,0.18),transparent_55%),radial-gradient(ellipse_at_80%_10%,rgba(157,0,255,0.18),transparent_55%),radial-gradient(ellipse_at_50%_120%,rgba(255,0,255,0.10),transparent_60%),linear-gradient(180deg,#03040a,#06080f_55%,#02030a)]" />
      {/* grid */}
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_75%)]" />
      {/* slow orbs */}
      {!reduce && (
        <>
          <motion.div
            initial={{ x: -120, y: -80, opacity: 0.55 }}
            animate={{ x: [-120, 120, -120], y: [-80, 60, -80], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[12%] left-[18%] h-[440px] w-[440px] rounded-full bg-cyan-400/20 blur-[140px]"
          />
          <motion.div
            initial={{ x: 80, y: 40 }}
            animate={{ x: [80, -60, 80], y: [40, 120, 40] }}
            transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[40%] right-[14%] h-[520px] w-[520px] rounded-full bg-fuchsia-500/16 blur-[160px]"
          />
          <motion.div
            initial={{ x: -40, y: 60 }}
            animate={{ x: [-40, 80, -40], y: [60, -40, 60] }}
            transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[6%] left-[40%] h-[360px] w-[360px] rounded-full bg-indigo-500/16 blur-[140px]"
          />
        </>
      )}
      {/* film grain */}
      <div className="absolute inset-0 opacity-[0.035] mix-blend-overlay [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22220%22 height=%22220%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%222%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')]" />
    </div>
  );
};
