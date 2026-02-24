import React, { useEffect, useRef, useState } from "react";

interface VitreousLogoProps {
  className?: string;
  size?: number;
  inline?: boolean;
  alt?: string;
}

const VitreousLogo: React.FC<VitreousLogoProps> = ({
  className = "",
  size = 56,
  inline = false,
  alt = "VoiceToWebsite 3D Vitreous Logo",
}) => {
  const logoRef = useRef<HTMLDivElement>(null);
  const [shards, setShards] = useState<
    Array<{ id: number; style: React.CSSProperties }>
  >([]);

  useEffect(() => {
    // Generate glass shards
    const generatedShards = Array.from({ length: 8 }, (_, i) => {
      const shardSize = Math.random() * 150 + 50;
      return {
        id: i,
        style: {
          width: `${shardSize}px`,
          height: `${shardSize}px`,
          top: `${Math.random() * 100 - 50}%`,
          left: `${Math.random() * 100 - 50}%`,
          transform: `rotate(${Math.random() * 360}deg) translateZ(${Math.random() * -200}px)`,
        },
      };
    });
    setShards(generatedShards);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!logoRef.current) return;

      const x = (window.innerWidth / 2 - e.pageX) / 25;
      const y = (window.innerHeight / 2 - e.pageY) / 25;
      logoRef.current.style.transform = `rotateY(${-x}deg) rotateX(${y}deg)`;
    };

    const handleMouseLeave = () => {
      if (!logoRef.current) return;
      logoRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const scale = size / 56; // Base size is 56px
  const fontSize = clamp(2 * scale, 8 * scale, 6 * scale);

  function clamp(min: number, max: number, value: number) {
    return Math.max(min, Math.min(max, value));
  }

  return (
    <>
      <style>{`
        .vitreous-logo-wrapper {
          position: relative;
          transform-style: preserve-3d;
          animation: vitreous-float-up-out 6s ease-in-out infinite alternate;
          cursor: pointer;
          transform-origin: center;
        }

        .vitreous-logo-text {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: ${fontSize}rem;
          text-transform: uppercase;
          letter-spacing: -0.05em;
          position: relative;
          color: rgba(255, 255, 255, 0.05);
          text-align: center;
          line-height: 0.9;
          user-select: none;
          transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .vitreous-logo-text::before,
        .vitreous-logo-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
        }

        .vitreous-logo-text::after {
          z-index: 2;
          color: transparent;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0) 40%,
            rgba(255, 255, 255, 0.8) 50%,
            rgba(255, 255, 255, 0) 60%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          animation: vitreous-gloss-streak 4s linear infinite;
          filter: drop-shadow(0 0 15px rgba(0, 242, 255, 0.4));
        }

        .vitreous-logo-text-shadow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: ${fontSize}rem;
          text-transform: uppercase;
          letter-spacing: -0.05em;
          color: transparent;
          z-index: -2;
          transform: translateZ(-50px) translateY(20px);
          text-shadow: 
            0 1px 0 rgba(255,255,255,0.1),
            0 2px 0 rgba(255,255,255,0.08),
            0 10px 30px rgba(0,0,0,0.8);
          animation: vitreous-shadow-shift 6s ease-in-out infinite alternate;
          opacity: 0.5;
        }

        .vitreous-status-badge {
          display: block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.5em;
          margin-top: 1rem;
          opacity: 0.6;
          transform: translateZ(30px);
          animation: vitreous-text-pulse 2s ease-in-out infinite;
        }

        .vitreous-glass-shard {
          position: absolute;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255,255,255,0.05);
          pointer-events: none;
          z-index: -1;
        }

        .vitreous-logo-wrapper:hover .vitreous-logo-text {
          transform: scale(1.05) translateZ(20px);
          transition: transform 0.3s ease;
        }

        @keyframes vitreous-float-up-out {
          0% {
            transform: rotateX(10deg) rotateY(-10deg) translateY(20px);
            opacity: 0.7;
          }
          100% {
            transform: rotateX(-10deg) rotateY(10deg) translateY(-20px) translateZ(50px);
            opacity: 1;
          }
        }

        @keyframes vitreous-gloss-streak {
          0% { background-position: -100% 0; }
          100% { background-position: 100% 0; }
        }

        @keyframes vitreous-shadow-shift {
          0% {
            transform: translateZ(-60px) translateY(30px) skewX(5deg);
            filter: blur(8px);
          }
          100% {
            transform: translateZ(-40px) translateY(10px) skewX(-5deg);
            filter: blur(12px);
          }
        }

        @keyframes vitreous-text-pulse {
          0%, 100% { opacity: 0.3; letter-spacing: 0.5em; }
          50% { opacity: 1; letter-spacing: 0.7em; }
        }

        @media (max-width: 600px) {
          .vitreous-logo-text-shadow {
            display: none;
          }
        }
      `}</style>

      <div
        className={`vitreous-logo-wrapper ${inline ? "" : "shrink-0"} ${className}`.trim()}
        ref={logoRef}
        aria-label={alt}
        style={{ perspective: "1500px" }}
      >
        {/* Main 3D Text */}
        <h1 className="vitreous-logo-text" data-text="VOICE TO WEBSITE">
          VOICE TO WEBSITE
        </h1>

        {/* Shadow Layer */}
        <div className="vitreous-logo-text-shadow">VOICE TO WEBSITE</div>

        {/* Status Badge */}
        <div style={{ textAlign: "center" }}>
          <span className="vitreous-status-badge">
            Processing Sound &bull; Rendering UI
          </span>
        </div>

        {/* Glass Shards */}
        {shards.map((shard) => (
          <div
            key={shard.id}
            className="vitreous-glass-shard"
            style={shard.style}
          />
        ))}
      </div>
    </>
  );
};

export default VitreousLogo;
