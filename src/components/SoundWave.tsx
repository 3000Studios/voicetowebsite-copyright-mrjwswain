import React from 'react';
import { motion } from 'motion/react';

export const SoundWave = ({ isPlaying = true }: { isPlaying?: boolean }) => {
  const bars = Array.from({ length: 12 });
  
  return (
    <div className="flex items-center gap-1 h-8">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          initial={{ height: 4 }}
          animate={isPlaying ? {
            height: [4, Math.random() * 24 + 8, 4]
          } : { height: 4 }}
          transition={{
            duration: 0.5 + Math.random() * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.05
          }}
          className="w-1 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.8)]"
        />
      ))}
    </div>
  );
};
