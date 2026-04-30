import React from 'react';
import { motion } from 'motion/react';

export const Logo = ({ className = '' }: { className?: string }) => {
  const bars = [18, 36, 54, 72, 48, 84, 60, 42];

  return (
    <div className={`group flex items-center gap-4 ${className}`}>
      <div className="relative flex h-10 items-end gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xl">
        {bars.map((height, index) => (
          <motion.span
            key={index}
            className="w-1 rounded-full bg-gradient-to-t from-cyan-400 via-indigo-400 to-fuchsia-400 shadow-[0_0_16px_rgba(99,102,241,0.55)]"
            animate={{ height: [`${height * 0.55}%`, `${height}%`, `${height * 0.72}%`] }}
            transition={{ duration: 1.4 + index * 0.08, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <div className="flex flex-col leading-none">
        <span className="text-lg font-black uppercase tracking-[0.18em] text-white sm:text-xl">
          VoiceToWebsite
        </span>
        <span className="text-[10px] uppercase tracking-[0.32em] text-slate-400 transition-colors group-hover:text-indigo-300">
          Speak. Build. Launch.
        </span>
      </div>
    </div>
  );
};
