import React, { useEffect, useMemo, useRef } from "react";

interface Vector2 {
  x: number;
  y: number;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const BubbleFooter: React.FC = () => {
  const footerRef = useRef<HTMLDivElement | null>(null);
  const smokeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dustCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const smokeParticlesRef = useRef<SmokeParticle[]>([]);
  const dustParticlesRef = useRef<DustParticle[]>([]);
  const tiltRef = useRef<Vector2>({ x: 0, y: 0 });
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);

  class DustParticle {
    x: number;
    y: number;
    size: number;
    baseX: number;
    baseY: number;
    density: number;

    constructor(width: number, height: number) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.baseX = this.x;
      this.baseY = this.y;
      this.size = Math.random() * 2 + 0.4;
      this.density = Math.random() * 30 + 1;
    }

    update(accel: Vector2) {
      this.x = this.baseX + accel.x * this.density;
      this.y = this.baseY + accel.y * this.density;
    }
  }

  class SmokeParticle {
    x: number;
    y: number;
    size: number;
    speedY: number;
    opacity: number;

    constructor(width: number) {
      this.x = Math.random() * width;
      this.y = 200;
      this.size = Math.random() * 40 + 20;
      this.speedY = Math.random() * 1 + 0.5;
      this.opacity = 1;
    }

    update() {
      this.y -= this.speedY;
      this.opacity -= 0.01;
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const footer = footerRef.current;
    const smokeCanvas = smokeCanvasRef.current;
    const dustCanvas = dustCanvasRef.current;
    const sCtx = smokeCanvas?.getContext("2d");
    const dCtx = dustCanvas?.getContext("2d");
    if (!footer || !smokeCanvas || !dustCanvas || !sCtx || !dCtx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dustCanvas.width = width;
      dustCanvas.height = height;
      smokeCanvas.width = width;
      smokeCanvas.height = 200;
    };

    resize();
    window.addEventListener("resize", resize);

    // seed particles
    dustParticlesRef.current = Array.from(
      { length: reducedMotion ? 30 : 100 },
      () => new DustParticle(width, height)
    );

    const handleMouse = (e: MouseEvent) => {
      tiltRef.current = {
        x: (e.clientX / width - 0.5) * 2 || 0,
        y: (e.clientY / height - 0.5) * 2 || 0,
      };
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (typeof e.gamma !== "number" || typeof e.beta !== "number") return;
      tiltRef.current = {
        x: e.gamma / 45,
        y: e.beta / 45,
      };
    };

    window.addEventListener("mousemove", handleMouse, { passive: true });
    window.addEventListener("deviceorientation", handleOrientation);

    const handleSmoke = () => {
      if (!footer.classList.contains("active")) return;
      const target = reducedMotion ? 10 : 50;
      if (smokeParticlesRef.current.length < target) {
        smokeParticlesRef.current.push(new SmokeParticle(width));
      }
    };

    const animate = () => {
      // dust
      dCtx.clearRect(0, 0, width, height);
      const accel = tiltRef.current;
      dustParticlesRef.current.forEach((p) => {
        p.update(accel);
        dCtx.fillStyle = "rgba(255,255,255,0.35)";
        dCtx.beginPath();
        dCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        dCtx.fill();
      });

      // smoke
      handleSmoke();
      sCtx.clearRect(0, 0, width, 200);
      smokeParticlesRef.current.forEach((p, idx) => {
        p.update();
        sCtx.fillStyle = `rgba(200,200,200,${p.opacity.toFixed(2)})`;
        sCtx.beginPath();
        sCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        sCtx.fill();
        if (p.opacity <= 0) {
          smokeParticlesRef.current.splice(idx, 1);
        }
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    if (!reducedMotion) {
      animate();
    }

    const onScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const nearBottom = scrollPos > docHeight - 300;
      const atBottom = scrollPos >= docHeight - 5;

      footer.classList.toggle("active", nearBottom);
      footer.classList.toggle("ignited", atBottom);
      if (nearBottom) smokeCanvas.style.opacity = "0.6";
      else smokeCanvas.style.opacity = "0";
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("deviceorientation", handleOrientation);
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion]);

  return (
    <>
      <style>{`
        :root {
          --vtw-bubble-bg: #050505;
          --vtw-bubble-accent: #00f2ff;
          --vtw-bubble-surface: rgba(15, 15, 15, 0.85);
          --vtw-bubble-text: #e0e0e0;
        }
        .bubble-footer * { box-sizing: border-box; }
        .bubble-footer canvas { touch-action: none; }
        .bubble-footer .dummy-spacer { height: 40vh; }
        .bubble-footer .footer-perspective {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 120px;
          perspective: 1200px;
          z-index: 50;
          pointer-events: none;
        }
        .bubble-footer .footer-main {
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 100%;
          background: var(--vtw-bubble-surface);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          transform-origin: bottom;
          transform: rotateX(-95deg) translateY(50px);
          transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.5s ease, background 0.5s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 5%;
          box-shadow: 0 -20px 50px rgba(0, 0, 0, 0.5);
          pointer-events: auto;
        }
        .bubble-footer .footer-perspective.active .footer-main {
          transform: rotateX(0deg) translateY(0);
        }
        .bubble-footer .footer-perspective.ignited .footer-main {
          background: rgba(30, 30, 30, 0.95);
          box-shadow: 0 -15px 40px rgba(0, 242, 255, 0.2),
            inset 0 1px 1px rgba(255, 255, 255, 0.2);
          border-top: 1px solid var(--vtw-bubble-accent);
        }
        .bubble-footer .brand-text {
          font-size: 1.4rem;
          font-weight: 900;
          text-transform: uppercase;
          color: var(--vtw-bubble-text);
          text-shadow:
            0 1px 0 #bbb,
            0 2px 0 #999,
            0 3px 0 #777,
            0 6px 1px rgba(0, 0, 0, 0.1),
            0 0 5px rgba(0, 0, 0, 0.1),
            0 1px 3px rgba(0, 0, 0, 0.3),
            0 3px 5px rgba(0, 0, 0, 0.2),
            0 5px 10px rgba(0, 0, 0, 0.25);
          letter-spacing: -1px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .bubble-footer .footer-perspective.ignited .brand-text {
          color: #fff;
          text-shadow: 0 0 20px var(--vtw-bubble-accent);
        }
        .bubble-footer .social-cluster {
          display: flex;
          gap: 25px;
          align-items: center;
        }
        .bubble-footer .icon-3d {
          width: 45px;
          height: 45px;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
        }
        .bubble-footer .icon-3d:hover {
          transform: translateZ(12px) rotateY(12deg) rotateX(8deg);
        }
        .bubble-footer .icon-3d svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.5));
        }
        .bubble-footer .dancer-container {
          position: relative;
          width: 40px;
          height: 60px;
          margin-left: 20px;
        }
        .bubble-footer .dancer {
          width: 100%;
          height: 100%;
          stroke: var(--vtw-bubble-accent);
          stroke-width: 3;
          fill: none;
          stroke-linecap: round;
          animation: vtw-dance 1s infinite alternate ease-in-out;
        }
        @keyframes vtw-dance {
          0% {
            transform: translateY(0) rotate(-5deg);
          }
          100% {
            transform: translateY(-10px) rotate(5deg);
          }
        }
        .bubble-footer .scroll-hint {
          font-family: "JetBrains Mono", monospace;
          font-size: 0.8rem;
          color: #777;
          margin-top: 1.2rem;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          animation: vtw-pulse 2s infinite;
        }
        @keyframes vtw-pulse {
          0%,
          100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.8;
          }
        }
        @media (max-width: 700px) {
          .bubble-footer .brand-text {
            font-size: 1.05rem;
          }
          .bubble-footer .icon-3d {
            width: 36px;
            height: 36px;
          }
          .bubble-footer .social-cluster {
            gap: 16px;
          }
          .bubble-footer .footer-main {
            padding: 0 1.6rem;
          }
        }
      `}</style>

      <div className="bubble-footer">
        <canvas
          ref={dustCanvasRef}
          className="fixed inset-0 w-full h-full pointer-events-none z-40"
        />

        <div
          className="footer-perspective"
          ref={footerRef}
          id="vtw-bubble-footer"
        >
          <canvas
            ref={smokeCanvasRef}
            className="absolute bottom-0 left-0 w-full h-[200px] pointer-events-none z-10 opacity-0 transition-opacity duration-500"
          />

          <div className="footer-main">
            <div className="brand-text">
              <img
                src="/logo-voicetowebsite.svg"
                alt="VoiceToWebsite logo"
                className="h-10 w-auto object-contain"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="hidden sm:inline">VoiceToWebsite</span>
            </div>

            <div className="social-cluster">
              <a
                className="icon-3d"
                href="https://youtube.com"
                aria-label="YouTube"
                target="_blank"
                rel="noreferrer"
              >
                <svg viewBox="0 0 100 100">
                  <rect
                    x="10"
                    y="20"
                    width="80"
                    height="60"
                    rx="15"
                    fill="#FF0000"
                  />
                  <path d="M40 35 L65 50 L40 65 Z" fill="white" />
                </svg>
              </a>
              <a
                className="icon-3d"
                href="https://www.tiktok.com"
                aria-label="TikTok"
                target="_blank"
                rel="noreferrer"
              >
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="#000" />
                  <path
                    d="M50 20 Q70 20 70 40 M50 20 V60 Q50 80 30 80"
                    stroke="#00f2ff"
                    strokeWidth="8"
                    fill="none"
                  />
                  <path
                    d="M50 20 Q70 20 70 40 M50 20 V60 Q50 80 30 80"
                    stroke="#ff0050"
                    strokeWidth="8"
                    fill="none"
                    transform="translate(2 2)"
                  />
                </svg>
              </a>
              <div className="icon-3d" aria-hidden>
                <svg viewBox="0 0 100 100">
                  <path
                    d="M20 80 L30 40 L50 20 L70 40 L80 80 L50 60 Z"
                    fill="white"
                  />
                  <circle cx="35" cy="50" r="3" fill="black" />
                  <circle cx="65" cy="50" r="3" fill="black" />
                </svg>
              </div>
            </div>

            <div className="dancer-container" aria-hidden>
              <svg className="dancer" viewBox="0 0 50 100">
                <circle cx="25" cy="20" r="8" />
                <path d="M25 28 V60 M10 40 H40 M25 60 L10 90 M25 60 L40 90" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BubbleFooter;
