import { MediaFrame, SectionHeader, Waveform } from "@/components/BrandSystem";
import { trackEvent } from "@/lib/analytics";
import { Globe, Sparkles, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { PlaygroundGenerator } from "./PlaygroundGenerator";

export function CinematicHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationId = 0;
    let particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; opacity: number }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(window.innerHeight, 760);
      particles = Array.from({ length: window.innerWidth < 768 ? 36 : 72 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.42,
        vy: (Math.random() - 0.5) * 0.42,
        size: Math.random() * 1.8 + 0.8,
        opacity: Math.random() * 0.42 + 0.18,
      }));
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(53, 226, 255, ${p.opacity})`;
        ctx.fill();
        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 135) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(124, 124, 255, ${0.12 * (1 - dist / 135)})`;
            ctx.stroke();
          }
        });
      });
      animationId = requestAnimationFrame(animate);
    };

    resize();
    animate();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const item = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] as const } },
  };

  return (
    <section className="relative -mt-24 min-h-screen overflow-hidden pt-24">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-70" />
      <div className="absolute inset-0 responsive-wallpaper opacity-80" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#03040a] to-transparent" />

      <motion.div
        className="content-grid relative z-10 grid min-h-[calc(100vh-6rem)] items-center gap-12 py-16 lg:grid-cols-[0.94fr_1.06fr]"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } } }}
      >
        <div className="space-y-8 text-center lg:text-left">
          <motion.div variants={item} className="flex justify-center lg:justify-start">
            <Waveform />
          </motion.div>
          <motion.div variants={item}>
            <SectionHeader
              title={<>Speak your site into existence.</>}
            />
          </motion.div>
          <motion.div variants={item} className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            {[{ icon: Zap, text: "Fast generation" }, { icon: Globe, text: "Cloudflare delivery" }, { icon: Sparkles, text: "SEO-ready output" }].map(({ icon: Icon, text }) => (
              <div key={text} className="glass-card flex items-center justify-center gap-2 rounded-full px-4 py-3 lg:justify-start">
                <Icon className="h-4 w-4 text-cyan-200" />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div variants={item}>
          <MediaFrame className="p-3 sm:p-5">
            <div className="hero-browser-bar">
              <span className="hero-browser-dot bg-rose-400" />
              <span className="hero-browser-dot bg-amber-300" />
              <span className="hero-browser-dot bg-emerald-300" />
              <span className="ml-3 truncate text-xs text-slate-400">voicetowebsite.com/live-generator</span>
            </div>
            <PlaygroundGenerator variant="hero" />
          </MediaFrame>
          <div className="mt-4 flex flex-col items-center gap-3">
            <Link
              to="/examples"
              className="hero-secondary-button px-8 py-4 text-base"
              onClick={() => trackEvent("demo_watched", { location: "cinematic_hero" })}
            >
              View examples
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
