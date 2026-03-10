import { motion, useReducedMotion } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";

type ShapeType = "pyramid" | "sphere" | "torus";

interface FloatingShape {
  id: number;
  type: ShapeType;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  zLayer: number;
  floatY: number;
  floatX: number;
}

const SHAPE_COLORS = [
  "rgba(59, 130, 246, 0.35)",
  "rgba(139, 92, 246, 0.35)",
  "rgba(34, 211, 238, 0.3)",
  "rgba(251, 191, 36, 0.25)",
  "rgba(16, 185, 129, 0.3)",
];

const SHAPE_COUNT_FULL = 18;
const SHAPE_COUNT_REDUCED = 6;

function buildShapes(count: number): FloatingShape[] {
  // Validate input to prevent performance issues
  if (!Number.isInteger(count) || count < 0) {
    console.warn(
      "[HomeWireframeBackground] Invalid shape count, using default"
    );
    count = SHAPE_COUNT_REDUCED;
  }
  if (count > 50) {
    console.warn(
      "[HomeWireframeBackground] Shape count too high, limiting to 50"
    );
    count = 50;
  }

  const list: FloatingShape[] = [];
  const types: ShapeType[] = ["pyramid", "sphere", "torus"];
  for (let i = 0; i < count; i++) {
    list.push({
      id: i,
      type: types[i % 3],
      x: (i * 7 + 13) % 94,
      y: (i * 11 + 7) % 88,
      size: 24 + (i % 5) * 18,
      color: SHAPE_COLORS[i % SHAPE_COLORS.length],
      duration: 12 + (i % 8) * 2,
      delay: (i * 0.8) % 6,
      zLayer: i % 3,
      floatY: (i % 2 === 0 ? 1 : -1) * (15 + (i % 20)),
      floatX: (i % 3 === 0 ? 1 : -1) * (8 + (i % 12)),
    });
  }
  return list;
}

export const HomeWireframeBackground: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const reduceMotion = useReducedMotion();
  const mountMark = useRef<string | null>(null);
  const perfSampleRef = useRef({ frameCount: 0, lastLog: 0 });

  const shapes = useMemo(
    () => buildShapes(reduceMotion ? SHAPE_COUNT_REDUCED : SHAPE_COUNT_FULL),
    [reduceMotion]
  );

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Performance monitoring: mark mount and sample render timing */
  useEffect(() => {
    const markName = "vtw-wireframe-mount";
    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark(markName);
      mountMark.current = markName;
    }
    return () => {
      if (
        mountMark.current &&
        typeof performance !== "undefined" &&
        performance.measure
      ) {
        try {
          // Use current time as end mark for valid measurement
          performance.measure("vtw-wireframe-lifetime", mountMark.current);
          // Clean up marks to prevent memory leak
          performance.clearMarks(mountMark.current);
          performance.clearMeasures("vtw-wireframe-lifetime");
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  useEffect(() => {
    if (typeof performance === "undefined" || !performance.now) return;
    const start = performance.now();
    perfSampleRef.current.frameCount += 1;

    const id = requestAnimationFrame(() => {
      const elapsed = performance.now() - start;
      const { frameCount, lastLog } = perfSampleRef.current;
      const isDev =
        typeof process !== "undefined" &&
        process.env &&
        process.env.NODE_ENV === "development";
      if (
        isDev &&
        frameCount % 60 === 0 &&
        performance.now() - lastLog > 5000
      ) {
        perfSampleRef.current.lastLog = performance.now();
        const metrics = {
          renderTimeMs: Math.round(elapsed * 100) / 100,
          frameCount,
          reducedMotion: Boolean(reduceMotion),
          shapeCount: shapes.length,
        };
        console.warn("[HomeWireframeBackground] perf sample", metrics);
        if (typeof window !== "undefined") {
          (
            window as unknown as { __VTW_WIREFRAME_PERF__?: unknown }
          ).__VTW_WIREFRAME_PERF__ = metrics;
        }
      }
    });
    return () => cancelAnimationFrame(id);
  }, [scrollY, reduceMotion, shapes.length]);

  return (
    <div
      className={`fixed inset-0 w-full h-full overflow-hidden pointer-events-none vtw-particle-layer ${reduceMotion ? "vtw-reduce-motion" : ""}`}
      style={{ zIndex: 0 }}
      data-reduce-motion={reduceMotion ? "true" : "false"}
      aria-hidden
    >
      {/* Full-page gradient — no tint/filter */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            linear-gradient(180deg, #0a0e1a 0%, #0f172a 35%, #0f172a 70%, #0a0e1a 100%),
            radial-gradient(ellipse 90% 70% at 50% 0%, rgba(59, 130, 246, 0.12), transparent 55%),
            radial-gradient(ellipse 70% 60% at 90% 80%, rgba(139, 92, 246, 0.08), transparent 50%),
            radial-gradient(ellipse 60% 50% at 10% 60%, rgba(34, 211, 238, 0.06), transparent 50%)
          `,
        }}
      />

      {/* Wireframe grid — no scroll transform when reduced motion */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          opacity: 0.22,
          transform: reduceMotion
            ? undefined
            : `translateY(${scrollY * 0.04}px)`,
        }}
      >
        <defs>
          <pattern
            id="home-grid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="rgba(34, 211, 238, 0.5)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#home-grid)" />
      </svg>

      {/* Floating shapes: triangles (pyramid) and circles (sphere, torus) — passthrough, random back-to-front float */}
      {shapes.map((s) => (
        <motion.div
          key={s.id}
          className="absolute"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            pointerEvents: "none",
            mixBlendMode: "screen",
            zIndex: 1 + s.zLayer,
          }}
          initial={{ opacity: 0.4, y: 0, x: 0 }}
          animate={
            reduceMotion
              ? { opacity: 0.4 }
              : {
                  opacity: [0.35, 0.55, 0.35],
                  y: [0, s.floatY, 0],
                  x: [0, s.floatX, 0],
                }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: s.duration,
                  delay: s.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        >
          {s.type === "pyramid" && (
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${s.size / 2}px solid transparent`,
                borderRight: `${s.size / 2}px solid transparent`,
                borderBottom: `${s.size}px solid ${s.color}`,
                filter: "drop-shadow(0 0 8px rgba(34,211,238,0.2))",
              }}
            />
          )}
          {s.type === "sphere" && (
            <div
              style={{
                width: s.size,
                height: s.size,
                borderRadius: "50%",
                background: `radial-gradient(circle at 30% 30%, ${s.color}, transparent)`,
                border: `1px solid ${s.color}`,
                boxShadow: `0 0 12px ${s.color}`,
              }}
            />
          )}
          {s.type === "torus" && (
            <div
              style={{
                width: s.size,
                height: s.size,
                borderRadius: "50%",
                border: `${Math.max(2, s.size / 6)}px solid ${s.color}`,
                background: "transparent",
                boxShadow: `0 0 10px ${s.color}, inset 0 0 10px ${s.color}`,
              }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default HomeWireframeBackground;
