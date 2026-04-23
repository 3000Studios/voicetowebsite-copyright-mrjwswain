import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const LiquidFooter = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const location = useLocation();
  const [baseColor, setBaseColor] = useState('#6366f1'); // Indigo default

  // Change color on page change
  useEffect(() => {
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setBaseColor(randomColor);
  }, [location]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = 120;

    const particles: Particle[] = [];
    const particleCount = 40;

    class Particle {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      originalRadius: number;

      constructor() {
        this.x = Math.random() * w;
        this.y = h + Math.random() * 50;
        this.originalRadius = 30 + Math.random() * 40;
        this.radius = this.originalRadius;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -(Math.random() * 1 + 0.5);
      }

      update(mouseX: number, mouseY: number, isDown: boolean, tiltX: number) {
        this.x += this.vx + tiltX * 5;
        this.y += this.vy;

        // Interaction
        const dx = this.x - mouseX;
        const dy = (h - (this.y - (h - 60))) - mouseY; // Coordinate fix for bottom-aligned
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100) {
          const force = (100 - dist) / 100;
          this.radius = this.originalRadius + (isDown ? 50 : 20) * force;
          if (isDown) {
             this.vy -= 0.1;
          }
        } else {
          this.radius += (this.originalRadius - this.radius) * 0.05;
          this.vy += (-(Math.random() * 0.5 + 0.2) - this.vy) * 0.05;
        }

        if (this.y < 30) this.y = 30; // Don't escape up
        if (this.y > h + 50) this.y = h + 50;
        if (this.x < -100) this.x = w + 100;
        if (this.x > w + 100) this.x = -100;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let mouseX = -1000;
    let mouseY = -1000;
    let isDown = false;
    let tiltX = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseDown = () => isDown = true;
    const handleMouseUp = () => isDown = false;
    
    const handleTouch = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.touches[0].clientX - rect.left;
      mouseY = e.touches[0].clientY - rect.top;
      isDown = true;
    };

    const handleTouchEnd = () => {
      isDown = false;
      mouseX = -1000;
      mouseY = -1000;
    };

    const handleTilt = (e: DeviceOrientationEvent) => {
       if (e.gamma) {
          tiltX = e.gamma / 90; // -1 to 1
       }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouch);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('deviceorientation', handleTilt);

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      
      // Meteball effect filter (done via CSS generally but let's do simple blur+threshold here if possible, 
      // or just draw a solid wavy base)
      
      ctx.fillStyle = baseColor;
      ctx.globalAlpha = 0.6;
      
      // Draw a base line
      ctx.beginPath();
      ctx.rect(0, h-40, w, 40);
      ctx.fill();

      particles.forEach(p => {
        p.update(mouseX, mouseY, isDown, tiltX);
        p.draw();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('deviceorientation', handleTilt);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [baseColor]);

  return (
    <div className="absolute bottom-0 left-0 w-full h-[120px] pointer-events-none z-[5] overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full pointer-events-auto filter blur-[20px] contrast-[20]" 
        style={{ background: 'transparent' }}
      />
    </div>
  );
};
