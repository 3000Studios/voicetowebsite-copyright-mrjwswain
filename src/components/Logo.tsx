import { motion } from "motion/react";

export const Logo = ({ className = "" }: { className?: string }) => {
  const nodes = [
    [18, 54],
    [36, 25],
    [58, 68],
    [78, 35],
  ];

  return (
    <div className={`group flex items-center gap-4 ${className}`}>
      <div className="relative h-12 w-12 shrink-0 rounded-2xl border border-cyan-200/20 bg-white/[0.06] shadow-[0_0_34px_rgba(53,226,255,0.22)] backdrop-blur-xl">
        <motion.div
          className="absolute inset-2 rounded-xl border border-indigo-200/25 bg-[radial-gradient(circle_at_top,rgba(53,226,255,0.2),transparent_55%)]"
          animate={{ rotateZ: [0, 8, -6, 0], scale: [1, 1.03, 0.98, 1] }}
          whileHover={{ scale: 1.06, rotateZ: 10 }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
          <path d="M18 54 L36 25 L58 68 L78 35" fill="none" stroke="rgba(103,232,249,.72)" strokeWidth="2" />
          <path d="M18 54 L58 68 M36 25 L78 35" fill="none" stroke="rgba(165,180,252,.38)" strokeWidth="1" />
          {nodes.map(([cx, cy], index) => (
            <motion.circle
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r="4"
              fill={index % 2 ? "#a5b4fc" : "#67e8f9"}
              animate={{ opacity: [0.55, 1, 0.55], r: [3.2, 5.2, 3.2], y: [0, -1, 0] }}
              transition={{ duration: 1.8 + index * 0.2, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </svg>
      </div>

      <motion.div
        className="flex flex-col leading-none"
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="font-display text-lg font-black uppercase tracking-[0.15em] text-white sm:text-xl">
          VoiceToWebsite.com
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.34em] text-cyan-100/55 transition-colors group-hover:text-cyan-200">
          Speak. Build. Launch.
        </span>
      </motion.div>
    </div>
  );
};
