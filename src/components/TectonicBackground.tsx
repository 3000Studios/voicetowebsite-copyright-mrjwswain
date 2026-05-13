import React, { useEffect, useMemo, useRef } from "react";

const PARTICLE_COUNT = 18;

const TectonicBackground: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
        id: `particle-${index}`,
        size: 4 + ((index * 7) % 9),
        left: `${(index * 17) % 100}%`,
        top: `${(index * 23) % 100}%`,
        duration: `${12 + (index % 6) * 3}s`,
        delay: `${(index % 7) * 0.8}s`,
        opacity: 0.18 + (index % 5) * 0.08,
      })),
    []
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let frame = 0;

    const updateParallax = () => {
      frame = 0;
      root.style.setProperty(
        "--vtw-bg-shift",
        `${Math.max(-120, window.scrollY * -0.08)}px`
      );
      root.style.setProperty(
        "--vtw-bg-tilt",
        `${Math.min(24, window.scrollY * 0.02)}deg`
      );
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rootRef} className="vtw-background" aria-hidden="true">
      <div className="vtw-background__mesh" />
      <div className="vtw-background__aurora vtw-background__aurora--cyan" />
      <div className="vtw-background__aurora vtw-background__aurora--violet" />
      <div className="vtw-background__aurora vtw-background__aurora--magenta" />
      <div className="vtw-background__beam" />
      <div className="vtw-background__vignette" />
      <div className="vtw-background__particles">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="vtw-background__particle"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: particle.left,
              top: particle.top,
              animationDuration: particle.duration,
              animationDelay: particle.delay,
              opacity: particle.opacity,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TectonicBackground;
