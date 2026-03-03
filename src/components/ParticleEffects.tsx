import { memo, useMemo } from "react";

interface Particle {
  left: string;
  top: string;
  opacity: number;
  delay: string;
}

interface ParticleEffectsProps {
  className?: string;
}

// Simple seeded random function for consistent particles
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Memoized particle component to prevent unnecessary re-renders
const Particle = memo<{ particle: Particle; index: number }>(
  ({ particle, index }) => (
    <div
      key={index}
      className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
      style={{
        left: particle.left,
        top: particle.top,
        opacity: particle.opacity,
        animationDelay: particle.delay,
      }}
    />
  )
);

Particle.displayName = "Particle";

// Memoized particle effects component
const ParticleEffects = memo<ParticleEffectsProps>(({ className = "" }) => {
  // Memoize particle layout to prevent recalculation on every render
  const particles = useMemo(() => {
    // Use a fixed seed for consistent particle positions
    const seed = 42;
    return Array.from({ length: 50 }, (_, _index) => {
      const index = _index + seed;
      return {
        left: `${seededRandom(index) * 100}%`,
        top: `${seededRandom(index + 1000) * 100}%`,
        opacity: seededRandom(index + 2000) * 0.5 + 0.1,
        delay: `${seededRandom(index + 3000) * 3}s`,
      };
    });
  }, []); // Empty dependency array - particles are static

  return (
    <div className={`absolute inset-0 ${className}`}>
      {particles.map((particle, index) => (
        <Particle key={index} particle={particle} index={index} />
      ))}
    </div>
  );
});

ParticleEffects.displayName = "ParticleEffects";

export default ParticleEffects;
