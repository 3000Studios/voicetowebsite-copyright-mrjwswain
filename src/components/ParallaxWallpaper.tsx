import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface Particle3D {
  id: number;
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  speed: number;
  rotation: number;
  opacity: number;
}

interface FloatingObject {
  id: number;
  type: "cube" | "sphere" | "pyramid" | "torus";
  x: number;
  y: number;
  z: number;
  size: number;
  rotation: { x: number; y: number; z: number };
  color: string;
  speed: number;
}

const ParallaxWallpaper: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle3D[]>([]);
  const [objects, setObjects] = useState<FloatingObject[]>([]);
  const [scrollY, setScrollY] = useState(0);

  // Generate particles and objects
  useEffect(() => {
    const colors = [
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#f59e0b",
      "#10b981",
      "#06b6d4",
    ];
    const newParticles: Particle3D[] = [];

    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        z: Math.random() * 100,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 0.5 + 0.1,
        rotation: Math.random() * 360,
        opacity: Math.random() * 0.6 + 0.2,
      });
    }

    // Generate 3D objects
    const objectTypes: ("cube" | "sphere" | "pyramid" | "torus")[] = [
      "cube",
      "sphere",
      "pyramid",
      "torus",
    ];
    const objectColors = [
      "#fbbf24",
      "#f87171",
      "#a78bfa",
      "#60a5fa",
      "#34d399",
    ];
    const newObjects: FloatingObject[] = [];

    for (let i = 0; i < 15; i++) {
      newObjects.push({
        id: i,
        type: objectTypes[Math.floor(Math.random() * objectTypes.length)],
        x: Math.random() * 100,
        y: Math.random() * 100,
        z: Math.random() * 50 - 25,
        size: Math.random() * 40 + 20,
        rotation: {
          x: Math.random() * 360,
          y: Math.random() * 360,
          z: Math.random() * 360,
        },
        color: objectColors[Math.floor(Math.random() * objectColors.length)],
        speed: Math.random() * 0.3 + 0.1,
      });
    }

    // Set both states in a single update using setTimeout to avoid cascading renders
    setTimeout(() => {
      setParticles(newParticles);
      setObjects(newObjects);
    }, 0);
  }, []);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const renderObject = (obj: FloatingObject) => {
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      left: `${obj.x}%`,
      top: `${obj.y}%`,
      width: `${obj.size}px`,
      height: `${obj.size}px`,
      transform: `
        translateZ(${obj.z}px)
        rotateX(${obj.rotation.x + scrollY * 0.1}deg)
        rotateY(${obj.rotation.y + mousePosition.x * 0.05}deg)
        rotateZ(${obj.rotation.z + mousePosition.y * 0.05}deg)
        translateX(${(mousePosition.x - window.innerWidth / 2) * 0.02}px)
        translateY(${(mousePosition.y - window.innerHeight / 2) * 0.02}px)
      `,
      opacity: 0.3,
      pointerEvents: "none",
      transition: "transform 0.3s ease-out",
    };

    switch (obj.type) {
      case "cube":
        return (
          <div
            key={obj.id}
            style={{
              ...baseStyle,
              background: `linear-gradient(45deg, ${obj.color}, transparent)`,
              border: `2px solid ${obj.color}`,
              boxShadow: `0 0 20px ${obj.color}`,
            }}
          />
        );
      case "sphere":
        return (
          <div
            key={obj.id}
            style={{
              ...baseStyle,
              background: `radial-gradient(circle, ${obj.color}, transparent)`,
              borderRadius: "50%",
              boxShadow: `0 0 30px ${obj.color}`,
            }}
          />
        );
      case "pyramid":
        return (
          <div
            key={obj.id}
            style={{
              ...baseStyle,
              width: 0,
              height: 0,
              borderLeft: `${obj.size / 2}px solid transparent`,
              borderRight: `${obj.size / 2}px solid transparent`,
              borderBottom: `${obj.size}px solid ${obj.color}`,
              background: "transparent",
              filter: `drop-shadow(0 0 20px ${obj.color})`,
            }}
          />
        );
      case "torus":
        return (
          <div
            key={obj.id}
            style={{
              ...baseStyle,
              border: `${obj.size / 4}px solid ${obj.color}`,
              borderRadius: "50%",
              background: "transparent",
              boxShadow: `0 0 25px ${obj.color}, inset 0 0 25px ${obj.color}`,
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{
        background: `
          radial-gradient(ellipse at top left, rgba(59, 130, 246, 0.15), transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(139, 92, 246, 0.15), transparent 50%),
          radial-gradient(ellipse at center, rgba(236, 72, 153, 0.1), transparent 70%),
          linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)
        `,
        zIndex: -1,
      }}
    >
      {/* Gradient overlays */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px,
            rgba(59, 130, 246, 0.3) 0%,
            transparent 50%)
          `,
        }}
      />

      {/* Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: particle.color,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            transform: `
              translateZ(${particle.z}px)
              translateX(${(mousePosition.x - window.innerWidth / 2) * particle.speed * 0.05}px)
              translateY(${(mousePosition.y - window.innerHeight / 2) * particle.speed * 0.05}px)
              translateY(${scrollY * particle.speed * 0.1}px)
            `,
          }}
          animate={{
            rotate: particle.rotation + 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20 + particle.id,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* 3D Objects */}
      {objects.map((obj) => renderObject(obj))}

      {/* Animated grid lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          opacity: 0.1,
          transform: `translateY(${scrollY * 0.05}px)`,
        }}
      >
        <defs>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Floating gradient orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.4), transparent)",
          filter: "blur(60px)",
          left: "10%",
          top: "20%",
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-80 h-80 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(236, 72, 153, 0.3), transparent)",
          filter: "blur(50px)",
          right: "15%",
          bottom: "30%",
          transform: `translate(${-mousePosition.x * 0.015}px, ${-mousePosition.y * 0.015}px)`,
        }}
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.4, 0.3, 0.4],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
        }}
      />
    </div>
  );
};

export default ParallaxWallpaper;
