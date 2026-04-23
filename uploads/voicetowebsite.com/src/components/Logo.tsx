import React from 'react';
import { motion } from 'motion/react';

export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-4 ${className} group/logo relative`}>
      {/* Soundwave Graphic */}
      <div className="flex items-center gap-[3px] h-8 relative">
        {[20, 50, 80, 40, 100, 60, 90, 50, 70, 30, 60].map((h, i) => (
          <motion.div 
            key={i}
            initial={{ height: "20%" }}
            animate={{ 
              height: [`${h * 0.5}%`, `${h}%`, `${h * 0.7}%`],
            }}
            transition={{
              duration: 1 + Math.random(),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.05
            }}
            className="w-[3px] bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)]"
          />
        ))}
        
        {/* Scanning Effect */}
        <motion.div 
          animate={{ x: ["0%", "100%", "0%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-y-0 left-0 w-[20%] bg-gradient-to-r from-transparent via-white/40 to-transparent z-10"
        />
      </div>
      
      {/* Text Branding */}
      <div className="flex flex-col -space-y-1">
        <span className="text-2xl font-black tracking-tighter whitespace-nowrap italic flex items-center gap-1 group-hover/logo:text-indigo-400 transition-colors">
          VOICE TO <span className="text-white">WEBSITE</span>
          <motion.span 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-1 h-6 bg-indigo-500 ml-1"
          />
        </span>
        <span className="text-[8px] font-bold tracking-[0.6em] opacity-30 group-hover/logo:opacity-100 transition-opacity uppercase text-indigo-500">
          Neural Manifestation Engine
        </span>
      </div>

      {/* Background Glow */}
      <div className="absolute -inset-8 bg-indigo-500/10 blur-3xl rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity duration-1000 -z-10" />
    </div>
  );
};
