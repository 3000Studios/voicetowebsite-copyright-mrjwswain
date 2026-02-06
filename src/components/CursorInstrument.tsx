
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
  const cursorPosRef = useRef<Point>({ x: -100, y: -100 });
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

    const drawIonCursor = (x: number, y: number) => {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const grad = ctx.createRadialGradient(x, y, 0, x, y, 22);
      grad.addColorStop(0, 'rgba(34, 211, 238, 0.9)');
      grad.addColorStop(0.4, 'rgba(34, 211, 238, 0.22)');
      grad.addColorStop(1, 'rgba(34, 211, 238, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(34, 211, 238, 0.65)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 14, y);
      ctx.lineTo(x + 14, y);
      ctx.moveTo(x, y - 14);
      ctx.lineTo(x, y + 14);
      ctx.stroke();

      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const lerp = 0.3;
      cursorPosRef.current.x +=
        (mouseRef.current.x - cursorPosRef.current.x) * lerp;
      cursorPosRef.current.y +=
        (mouseRef.current.y - cursorPosRef.current.y) * lerp;

      const hx = cursorPosRef.current.x;
      const hy = cursorPosRef.current.y;

      const tipX = hx;
      const tipY = hy;

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

      drawIonCursor(hx, hy);

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
