import { motion, useReducedMotion } from "motion/react";
import React from "react";

type Direction = "up" | "down" | "left" | "right" | "scale" | "fade";

const variants: Record<Direction, { from: Record<string, number | string>; to: Record<string, number | string> }> = {
  up: { from: { opacity: 0, y: 48 }, to: { opacity: 1, y: 0 } },
  down: { from: { opacity: 0, y: -48 }, to: { opacity: 1, y: 0 } },
  left: { from: { opacity: 0, x: 48 }, to: { opacity: 1, x: 0 } },
  right: { from: { opacity: 0, x: -48 }, to: { opacity: 1, x: 0 } },
  scale: { from: { opacity: 0, scale: 0.92 }, to: { opacity: 1, scale: 1 } },
  fade: { from: { opacity: 0 }, to: { opacity: 1 } },
};

export const Reveal: React.FC<{
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  amount?: number;
}> = ({ children, direction = "up", delay = 0, duration = 0.8, className, once = true, amount = 0.1 }) => {
  const reduce = useReducedMotion();
  const v = variants[direction];
  return (
    <motion.div
      className={className}
      initial={reduce ? false : v.from}
      whileInView={reduce ? undefined : v.to}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

export const StaggeredReveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  stagger?: number;
  className?: string;
}> = ({ children, delay = 0, stagger = 0.08, className }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduce ? 0 : stagger, delayChildren: reduce ? 0 : delay } },
      }}
    >
      {React.Children.map(children, (child) => (
        <motion.div
          variants={{
            hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 32 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};
