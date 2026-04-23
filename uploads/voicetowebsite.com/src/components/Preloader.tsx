import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const Preloader = () => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsComplete(true), 500);
          return 100;
        }
        return prev + Math.floor(Math.random() * 10) + 1;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-between p-12 lg:p-24"
        >
          <div className="w-full flex justify-between items-start">
            <span className="text-[10px] font-black tracking-[0.5em] uppercase opacity-40">Neural Architect // System Initialization</span>
            <span className="text-[10px] font-black tracking-[0.5em] uppercase opacity-40">v8.2.0</span>
          </div>

          <div className="flex flex-col items-center">
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: progress / 100 }}
              className="w-64 h-px bg-white origin-left mb-8"
            />
            <span className="text-[10vw] font-display font-bold leading-none tracking-tighter">
              {progress}%
            </span>
          </div>

          <div className="w-full flex justify-between items-end">
            <div className="space-y-2">
              <span className="block text-[8px] uppercase tracking-widest opacity-20">Protocol: Manifest_Alpha</span>
              <span className="block text-[8px] uppercase tracking-widest opacity-20">Secure Tunnel: Established</span>
            </div>
            <span className="text-[8px] uppercase tracking-widest opacity-20">© 2026</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
