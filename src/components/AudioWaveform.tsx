import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

type WaveMode = 'opener' | 'bumper';

interface AudioWaveformProps {
  active?: boolean;
  mode?: WaveMode;
  className?: string;
}

const parseAccentRgb = (value: string) => {
  const raw = (value || '').trim();
  const parts = raw.split(',').map((p) => Number(p.trim()));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return [56, 189, 248] as const;
  return [parts[0], parts[1], parts[2]] as const;
};

const roundRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  const anyCtx = ctx as any;
  if (typeof anyCtx.roundRect === 'function') {
    anyCtx.roundRect(x, y, w, h, radius);
    return;
  }

  // Fallback for browsers without CanvasRenderingContext2D.roundRect
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
};

const AudioWaveform: React.FC<AudioWaveformProps> = ({
  active = false,
  mode = 'opener',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);
  const lastSizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const accentRgbRef = useRef<readonly [number, number, number]>([56, 189, 248]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const barCount = mode === 'bumper' ? 18 : 54;
    const barGap = mode === 'bumper' ? 4 : 3;

    // --- Optimization: Cache accent color ---
    const updateAccent = () => {
      const style = getComputedStyle(document.documentElement);
      accentRgbRef.current = parseAccentRgb(style.getPropertyValue('--accent-rgb'));
    };
    updateAccent();

    const mutationObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-theme') {
          updateAccent();
        }
      }
    });
    mutationObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // --- Optimization: ResizeObserver instead of per-frame reads ---
    const updateSize = () => {
      const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
      const w = Math.max(1, Math.floor(canvas.clientWidth));
      const h = Math.max(1, Math.floor(canvas.clientHeight));

      const last = lastSizeRef.current;
      if (last.w === w && last.h === h && last.dpr === dpr) return;
      lastSizeRef.current = { w, h, dpr };

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Initial size
    updateSize();

    const resizeObserver = new ResizeObserver(() => {
        updateSize();
    });
    resizeObserver.observe(canvas);

    // Also listen to window resize for DPR changes
    const onResize = () => updateSize();
    window.addEventListener('resize', onResize, { passive: true });

    const draw = () => {
      // Removed resizeToClient() call from animation loop

      const { w, h } = lastSizeRef.current;
      ctx.clearRect(0, 0, w, h);

      // Read from ref instead of DOM
      const [r, g, b] = accentRgbRef.current;

      const freq = active ? audioEngine.getMusicFrequencyData() : null;
      const energy = active ? audioEngine.getMusicEnergy() : 0;

      const glow = Math.max(0.12, Math.min(0.48, 0.12 + energy * 0.52));
      const base = Math.max(0.08, mode === 'bumper' ? 0.12 : 0.09);

      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${Math.min(0.92, base + glow)})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${Math.max(0.06, base * 0.55)})`);

      const totalGap = barGap * (barCount - 1);
      const barWidth = Math.max(2, Math.floor((w - totalGap) / barCount));
      const totalWidth = barWidth * barCount + totalGap;
      const left = Math.floor((w - totalWidth) / 2);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = gradient;
      ctx.shadowBlur = mode === 'bumper' ? 18 : 26;
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.45)`;

      tRef.current += 0.02;
      for (let i = 0; i < barCount; i++) {
        let v = 0.12;
        if (freq && freq.length) {
          const idx = Math.min(freq.length - 1, Math.floor((i / barCount) * freq.length));
          v = freq[idx] / 255;
        } else {
          v = 0.18 + 0.18 * Math.sin(tRef.current * 1.6 + i * 0.55);
        }

        const shaping = mode === 'bumper' ? 1.25 : 1.45;
        const eased = Math.pow(Math.max(0, v), shaping);
        const amp = mode === 'bumper' ? 0.8 : 1;
        const barHeight = Math.max(6, Math.floor((h * 0.86) * eased * amp));

        const x = left + i * (barWidth + barGap);
        const y = Math.floor(h - barHeight);
        const radius = Math.max(4, Math.min(18, Math.floor(barWidth * 0.7)));

        ctx.beginPath();
        roundRectPath(ctx, x, y, barWidth, barHeight, radius);
        ctx.fill();
      }

      ctx.restore();

      if (!reduceMotion) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      window.removeEventListener('resize', onResize as any);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, mode]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
};

export default AudioWaveform;
