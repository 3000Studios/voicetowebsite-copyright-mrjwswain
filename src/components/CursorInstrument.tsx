
import React, { useEffect, useRef } from 'react';
import { Point } from '../types';

interface ElectricArc {
  points: Point[];
  velocity: Point;
  life: number;
  maxLife: number;
  color: string;
}

interface CursorInstrumentProps {
  isShooting: boolean;
}

const CursorInstrument: React.FC<CursorInstrumentProps> = ({ isShooting }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<Point>({ x: -100, y: -100 });
  const handPosRef = useRef<Point>({ x: -100, y: -100 });
  const arcsRef = useRef<ElectricArc[]>([]);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const createArc = (start: Point) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 15;
      return {
        points: [{ ...start }],
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        life: 1,
        maxLife: 50 + Math.random() * 30,
        color: Math.random() > 0.5 ? '#22d3ee' : '#ffffff'
      };
    };

    const drawRobotHand = (x: number, y: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 12); 

      // Significantly smaller scale (0.25 vs 0.6)
      const scale = 0.25;
      ctx.scale(scale, scale);

      // Palm base
      const palmGrad = ctx.createLinearGradient(-30, 0, 30, 60);
      palmGrad.addColorStop(0, '#d1d5db'); 
      palmGrad.addColorStop(0.5, '#4b5563'); 
      palmGrad.addColorStop(1, '#111827'); 
      
      ctx.fillStyle = palmGrad;
      ctx.beginPath();
      ctx.roundRect(-25, 10, 50, 60, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Index Finger (Pointing)
      const drawFinger = (fx: number, fy: number, length: number, isPointing: boolean) => {
        ctx.save();
        ctx.translate(fx, fy);
        if (isPointing) ctx.rotate(-Math.PI / 6);
        
        for (let i = 0; i < 3; i++) {
          const segLen = length / 3;
          ctx.fillStyle = palmGrad;
          ctx.beginPath();
          ctx.roundRect(-6, -segLen * (i + 1), 12, segLen, 4);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.arc(0, -segLen * i, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      };

      drawFinger(-15, 15, 40, false); 
      drawFinger(-5, 12, 55, false);  
      drawFinger(5, 10, 65, false);   
      drawFinger(18, 15, 60, true);   
      
      // Thumb
      ctx.save();
      ctx.translate(-25, 45);
      ctx.rotate(-Math.PI / 2.5);
      ctx.beginPath();
      ctx.roundRect(-8, 0, 16, 35, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const lerp = 0.3;
      handPosRef.current.x += (mouseRef.current.x - handPosRef.current.x) * lerp;
      handPosRef.current.y += (mouseRef.current.y - handPosRef.current.y) * lerp;

      const hx = handPosRef.current.x;
      const hy = handPosRef.current.y;

      // Adjusted Tip position for smaller scale
      const tipX = hx + 15; 
      const tipY = hy - 18;

      // Emit arcs ONLY if isShooting is active
      if (isShooting) {
        arcsRef.current.push(createArc({ x: tipX, y: tipY }));
      }

      ctx.shadowBlur = 15;
      arcsRef.current = arcsRef.current.filter(arc => {
        const lastPoint = arc.points[arc.points.length - 1];
        const nextPoint = {
          x: lastPoint.x + arc.velocity.x + (Math.random() - 0.5) * 40,
          y: lastPoint.y + arc.velocity.y + (Math.random() - 0.5) * 40
        };

        if (nextPoint.x < 0 || nextPoint.x > canvas.width) arc.velocity.x *= -1;
        if (nextPoint.y < 0 || nextPoint.y > canvas.height) arc.velocity.y *= -1;

        arc.points.push(nextPoint);
        if (arc.points.length > 12) arc.points.shift();

        arc.life++;
        ctx.shadowColor = arc.color;
        ctx.strokeStyle = arc.color;
        ctx.lineWidth = 3 * (1 - arc.life / arc.maxLife);
        ctx.globalAlpha = 1 - arc.life / arc.maxLife;

        ctx.beginPath();
        ctx.moveTo(arc.points[0].x, arc.points[0].y);
        for (let i = 1; i < arc.points.length; i++) {
          ctx.lineTo(arc.points[i].x, arc.points[i].y);
        }
        ctx.stroke();

        return arc.life < arc.maxLife;
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (isShooting) {
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#22d3ee';
        ctx.beginPath();
        ctx.arc(tipX, tipY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      drawRobotHand(hx, hy);

      requestRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isShooting]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[9999]" 
    />
  );
};

export default CursorInstrument;
