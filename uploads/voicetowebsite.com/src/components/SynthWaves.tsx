import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const SynthWaves = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  
  const colors = [
    'rgba(6, 182, 212, 0.3)',   // Cyan
    'rgba(14, 165, 233, 0.3)',  // Sky
    'rgba(59, 130, 246, 0.3)',  // Blue
    'rgba(16, 185, 129, 0.3)',  // Emerald
    'rgba(148, 163, 184, 0.3)', // Silver
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentColorIndex((prev) => (prev + 1) % colors.length);
    }, 30000); // Change color every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const waves = [
      { y: h * 0.8, length: 0.01, amplitude: 30, speed: 0.02 },
      { y: h * 0.85, length: 0.005, amplitude: 50, speed: 0.01 },
      { y: h * 0.9, length: 0.008, amplitude: 40, speed: 0.03 }
    ];

    let t = 0;

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      
      waves.forEach((wave, i) => {
        ctx.beginPath();
        ctx.moveTo(0, wave.y);
        
        for (let x = 0; x < w; x++) {
          const y = wave.y + Math.sin(x * wave.length + t * wave.speed) * wave.amplitude;
          ctx.lineTo(x, y);
        }
        
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        
        const gradient = ctx.createLinearGradient(0, wave.y - wave.amplitude, 0, h);
        gradient.addColorStop(0, colors[currentColorIndex]);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      t += 0.5;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentColorIndex]);

  return (
    <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden mix-blend-screen opacity-40">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
