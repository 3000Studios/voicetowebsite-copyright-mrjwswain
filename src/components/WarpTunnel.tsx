import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WarpTunnelProps {
  isVisible: boolean;
}

const WarpTunnel: React.FC<WarpTunnelProps> = ({ isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] pointer-events-none flex items-center justify-center overflow-hidden"
        >
          {/* Central explosion flash */}
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 20, opacity: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="w-10 h-10 bg-white rounded-full absolute"
          />

          {/* Warp lines */}
          <div className="relative w-full h-full">
            {[...Array(40)].map((_, i) => {
              const angle = (i / 40) * Math.PI * 2;
              return (
                <motion.div
                  key={i}
                  initial={{
                    x: 0,
                    y: 0,
                    width: 2,
                    height: 10,
                    rotate: (angle * 180) / Math.PI,
                    opacity: 1,
                  }}
                  animate={{
                    x: Math.cos(angle) * 1500,
                    y: Math.sin(angle) * 1500,
                    height: 200,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.6,
                    ease: "circIn",
                    delay: Math.random() * 0.2,
                  }}
                  className="absolute left-1/2 top-1/2 bg-cyan-400"
                  style={{ transformOrigin: "center bottom" }}
                />
              );
            })}
          </div>

          {/* Background color pull */}
          <motion.div
            initial={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
            animate={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="absolute inset-0 z-[10001]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WarpTunnel;
