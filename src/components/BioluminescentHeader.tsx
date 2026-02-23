import React, { useCallback, useEffect, useRef, useState } from "react";
import { SHARED_NAV_ITEMS } from "../constants/navigation";

interface BioluminescentHeaderProps {
  className?: string;
}

const BioluminescentHeader: React.FC<BioluminescentHeaderProps> = ({
  className = "",
}) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const wavePathsRef = useRef<(SVGPathElement | null)[]>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const phaseRef = useRef(0);
  const isMountedRef = useRef(true);

  const [scrollY, setScrollY] = useState(0);
  const [isNavVisible, setIsNavVisible] = useState(false);

  // Wave configuration
  const waveConfig = [
    { color: "#00f2ff", amp: 60, freq: 0.02, speed: 0.05 },
    { color: "#bc13fe", amp: 40, freq: 0.015, speed: 0.03 },
    { color: "#ff00bd", amp: 80, freq: 0.01, speed: 0.02 },
  ];

  const createWavePath = useCallback(
    (
      amplitude: number,
      frequency: number,
      phase: number,
      offset: number,
      width: number = 1440
    ) => {
      let path = `M 0 ${160 + offset}`;
      const step = Math.max(10, Math.floor(width / 144)); // Adaptive step based on width
      for (let x = 0; x <= width; x += step) {
        const y = 160 + Math.sin(x * frequency + phase) * amplitude;
        path += ` L ${x} ${y}`;
      }
      return path;
    },
    []
  );

  // Animation loop - separated from frequently changing values
  useEffect(() => {
    const animate = () => {
      // Check if component is still mounted
      if (!isMountedRef.current) return;

      phaseRef.current += 0.05;

      // Adjust amplitude based on scroll (lifting off)
      const liftFactor = Math.max(0, 1 - scrollY / 400);

      wavePathsRef.current.forEach((path, i) => {
        // Add null checks to prevent race conditions
        if (!path || !waveConfig[i] || !isMountedRef.current) return;

        const config = waveConfig[i];
        const dynamicAmp =
          config.amp *
          liftFactor *
          (1 + Math.sin(phaseRef.current * 0.5) * 0.2);

        try {
          const d = createWavePath(
            dynamicAmp,
            config.freq,
            phaseRef.current * config.speed * 10,
            i * 10,
            window.innerWidth || 1440
          );
          path.setAttribute("d", d);
          path.setAttribute("stroke", config.color);
          path.setAttribute("style", `opacity: ${0.4 + liftFactor * 0.6}`);
        } catch (error) {
          console.warn("Wave path update failed:", error);
        }
      });

      // Only request next frame if component is still mounted
      if (isMountedRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      isMountedRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [scrollY, createWavePath]);

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);

      const threshold = window.innerHeight * 0.6;
      const progress = Math.min(currentScrollY / threshold, 1);

      // Latex Header Lift
      if (headerRef.current) {
        headerRef.current.style.transform = `translateY(-${progress * 100}%)`;
      }

      // Text Tension Effect
      if (titleRef.current) {
        titleRef.current.style.transform = `scale(${1 + progress * 0.5}) translateY(${progress * -50}px)`;
        titleRef.current.style.filter = `blur(${progress * 20}px) brightness(${1 + progress * 2})`;
        titleRef.current.style.opacity = String(1 - progress);
      }

      // Nav Reveal
      setIsNavVisible(progress > 0.8);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Navigation menu items
  const navItems = SHARED_NAV_ITEMS;

  return (
    <>
      <style>{`
        .bioluminescent-header-container {
          position: relative;
          width: 100%;
          height: 80vh;
          background: #0a0a0a;
          overflow: hidden;
          pointer-events: auto;
          transition: transform 0.8s cubic-bezier(0.7, 0, 0.3, 1);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          z-index: 1;
        }

        .bioluminescent-header-container::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 50% 20%, rgba(255,255,255,0.05) 0%, transparent 50%);
          pointer-events: none;
        }

        .hero-text {
          position: relative;
          z-index: 12;
          text-align: center;
          transform: scale(1);
          transition: transform 0.5s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
          pointer-events: auto;
        }

        .hero-text h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(3rem, 15vw, 12rem);
          line-height: 0.8;
          margin-bottom: 1rem;
          filter: drop-shadow(0 0 15px rgba(0,242,255,0.3));
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: -2px;
        }

        .hero-text span {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 10px;
          color: #00f2ff;
          display: block;
          margin-top: 20px;
          font-weight: 300;
        }

        .wave-container {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 40%;
          z-index: 11;
        }

        .synth-waves {
          width: 100%;
          height: 100%;
          filter: blur(2px) contrast(1.2);
        }

        .wave-path {
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          transition: stroke 0.3s ease;
        }

        .nav-reveal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 5%;
          z-index: 50;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
          background: rgba(5, 5, 5, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          pointer-events: auto;
        }

        .nav-reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .nav-reveal .logo {
          font-size: 1.2rem;
          letter-spacing: -1px;
          font-weight: 800;
          text-transform: uppercase;
          font-family: 'Syne', sans-serif;
          color: #ffffff;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
          font-family: 'IBM Plex Mono', monospace;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 2px;
        }

        .nav-links a {
          color: white;
          text-decoration: none;
          position: relative;
          transition: color 0.3s ease;
        }

        .nav-links a:hover {
          color: #00f2ff;
        }

        .nav-links a::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: #00f2ff;
          transition: width 0.3s ease;
        }

        .nav-links a:hover::after {
          width: 100%;
        }

        .scroll-indicator {
          position: absolute;
          bottom: 40px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          opacity: 0.5;
          animation: pulse 2s infinite;
          left: 50%;
          transform: translateX(-50%);
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: translateX(-50%) translateY(0); }
          50% { opacity: 1; transform: translateX(-50%) translateY(10px); }
        }

        @keyframes smash {
          0% { transform: scale(1.5); filter: brightness(5) blur(20px); }
          100% { transform: scale(1); filter: brightness(1) blur(0px); }
        }

        .smash-effect {
          animation: smash 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @media (max-width: 768px) {
          .nav-links {
            gap: 1rem;
            font-size: 0.65rem;
          }

          .hero-text h1 {
            font-size: clamp(2rem, 12vw, 8rem);
          }

          .hero-text span {
            font-size: 0.8rem;
            letter-spacing: 6px;
          }
        }
      `}</style>

      {/* Navigation that appears on scroll */}
      <nav
        className={`nav-reveal ${isNavVisible ? "visible" : ""}`}
        ref={navRef}
      >
        <div className="logo">VoiceToWebsite.com</div>
        <div className="nav-links" role="navigation">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              aria-label={`Navigate to ${item.label}`}
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Bioluminescent Header */}
      <header
        className={`bioluminescent-header-container smash-effect ${className}`}
        ref={headerRef}
      >
        <div className="hero-text">
          <h1 ref={titleRef}>VOICE</h1>
          <span>Transform Your Ideas Into Reality</span>
        </div>

        <div className="wave-container">
          <svg
            className="synth-waves"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            {waveConfig.map((_, index) => (
              <path
                key={index}
                ref={(el) => {
                  if (wavePathsRef.current) {
                    wavePathsRef.current[index] = el;
                  }
                }}
                className="wave-path"
                d=""
              />
            ))}
          </svg>
        </div>

        <div className="scroll-indicator">Drag Down to Stretch</div>
      </header>
    </>
  );
};

export default BioluminescentHeader;
