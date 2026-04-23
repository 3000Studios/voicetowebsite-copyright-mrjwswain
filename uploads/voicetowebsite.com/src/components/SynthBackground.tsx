import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export const SynthBackground = () => {
  const [elements, setElements] = useState<any[]>([]);

  useEffect(() => {
    const newElements = [...Array(15)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 100 + Math.random() * 400,
      duration: 10 + Math.random() * 20,
      delay: Math.random() * 5,
      zIndex: -15, // Move all to background
    }));
    setElements(newElements);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {elements.map((el) => (
        <motion.div
          key={el.id}
          className="synth-wave-3d"
          style={{
            left: el.left,
            top: el.top,
            width: el.size,
            height: el.size,
            zIndex: el.zIndex,
          }}
          animate={{
            x: [0, 100, -100, 0],
            y: [0, -100, 100, 0],
            rotateX: [0, 180, 360],
            rotateY: [0, 180, 360],
            scale: [1, 1.5, 0.8, 1],
          }}
          transition={{
            duration: el.duration,
            repeat: Infinity,
            delay: el.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
