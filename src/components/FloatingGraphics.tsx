import { motion } from "motion/react";

export const FloatingGraphics = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Floating Circles */}
      <motion.div
        animate={{
          y: [0, -40, 0],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[10%] left-[5%] w-64 h-64 border-2 border-indigo-500/10 rounded-full"
      />

      <motion.div
        animate={{
          y: [0, 50, 0],
          rotate: [0, -15, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[15%] right-[10%] w-96 h-96 border-2 border-purple-500/10 rounded-full"
      />

      {/* Grid Accents */}
      <div className="absolute top-0 left-0 w-full h-full grid-pattern opacity-10" />

      {/* Technical Lines */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-linear-to-b from-transparent via-indigo-500/20 to-transparent" />
      <div className="absolute top-0 right-1/4 w-px h-full bg-linear-to-b from-transparent via-purple-500/20 to-transparent" />

      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-indigo-500/20 m-8" />
      <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-indigo-500/20 m-8" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-indigo-500/20 m-8" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-indigo-500/20 m-8" />
    </div>
  );
};
