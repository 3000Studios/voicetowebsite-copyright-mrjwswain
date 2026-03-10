import React, { useEffect, useRef, useState } from "react";

interface WallpaperConfig {
  type: "gradient" | "particle" | "geometric" | "organic" | "tech";
  colors: string[];
  animation: boolean;
  responsive: boolean;
}

const wallpaperConfigs: WallpaperConfig[] = [
  {
    type: "gradient",
    colors: ["#0a0e1a", "#0f172a", "#1e293b", "#334155"],
    animation: true,
    responsive: true,
  },
  {
    type: "particle",
    colors: ["#00f3ff", "#8b5cf6", "#ec4899", "#f59e0b"],
    animation: true,
    responsive: true,
  },
  {
    type: "geometric",
    colors: ["#1e3a8a", "#7c3aed", "#dc2626", "#059669"],
    animation: true,
    responsive: true,
  },
  {
    type: "organic",
    colors: ["#064e3b", "#065f46", "#047857", "#059669"],
    animation: true,
    responsive: true,
  },
  {
    type: "tech",
    colors: ["#1e293b", "#0f172a", "#020617", "#18181b"],
    animation: true,
    responsive: true,
  },
];

export const ResponsiveWallpaper: React.FC<{ configIndex?: number }> = ({
  configIndex = 0,
}) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const config = wallpaperConfigs[configIndex];

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !config.animation) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (config.type === "particle") {
        // Particle system
        for (let i = 0; i < 50; i++) {
          const x = ((Math.sin(time * 0.001 + i) + 1) * canvas.width) / 2;
          const y =
            ((Math.cos(time * 0.001 + i * 0.5) + 1) * canvas.height) / 2;
          const size = Math.sin(time * 0.002 + i) * 3 + 5;
          const color = config.colors[i % config.colors.length];

          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = color + "40";
          ctx.fill();
        }
      } else if (config.type === "geometric") {
        // Geometric patterns
        const gridSize = 50;
        for (let x = 0; x < canvas.width; x += gridSize) {
          for (let y = 0; y < canvas.height; y += gridSize) {
            const rotation = time * 0.001 + (x + y) * 0.01;
            ctx.save();
            ctx.translate(x + gridSize / 2, y + gridSize / 2);
            ctx.rotate(rotation);

            const colorIndex =
              Math.floor((x + y) / gridSize) % config.colors.length;
            ctx.strokeStyle = config.colors[colorIndex] + "30";
            ctx.lineWidth = 2;
            ctx.strokeRect(-gridSize / 2, -gridSize / 2, gridSize, gridSize);
            ctx.restore();
          }
        }
      } else if (config.type === "organic") {
        // Organic flowing shapes
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          const offsetX = Math.sin(time * 0.0005 + i) * 100;
          const offsetY = Math.cos(time * 0.0005 + i) * 100;

          for (let x = 0; x < canvas.width; x += 10) {
            const y =
              canvas.height / 2 +
              Math.sin((x + offsetX) * 0.01 + time * 0.001) * 100 +
              Math.cos((x + offsetY) * 0.005 + i) * 50;

            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.strokeStyle = config.colors[i % config.colors.length] + "20";
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }

      time += 16;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, config]);

  const getBackgroundStyle = () => {
    if (config.type === "gradient") {
      const gradient = `linear-gradient(135deg, ${config.colors.join(", ")})`;
      return {
        background: gradient,
        backgroundSize: "400% 400%",
        animation: config.animation
          ? "gradientShift 15s ease infinite"
          : "none",
      };
    }
    return {};
  };

  return (
    <div
      className="fixed inset-0 w-full h-full -z-10"
      style={getBackgroundStyle()}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.6 }}
      />
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
    </div>
  );
};

export default ResponsiveWallpaper;
