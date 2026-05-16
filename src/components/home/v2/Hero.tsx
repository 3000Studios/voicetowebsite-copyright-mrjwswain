import { motion, useReducedMotion } from "motion/react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mic, PlayCircle, Sparkles } from "lucide-react";

import { useClickSound } from "./useClickSound";

const ROTATING_VERBS = ["Speak it.", "Describe it.", "Imagine it.", "Whisper it.", "Pitch it."];

export const Hero: React.FC = () => {
  const reduce = useReducedMotion();
  const click = useClickSound("ding");
  const tick = useClickSound("tick");
  const [verbIdx, setVerbIdx] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setVerbIdx((i) => (i + 1) % ROTATING_VERBS.length), 2200);
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <section className="relative isolate overflow-hidden px-5 pt-32 pb-24 sm:px-8 lg:px-12 lg:pt-48 lg:pb-32">
      {/* edge framing */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-px h-24 bg-linear-to-b from-cyan-300/10 to-transparent" />

      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        <div className="relative">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5" /> Gemini-powered. 60-second build.
          </motion.div>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 font-display text-[clamp(2.8rem,7vw,5.6rem)] font-black leading-[0.92] tracking-tight"
          >
            <span className="block text-white">
              <span className="relative inline-block">
                <motion.span
                  key={ROTATING_VERBS[verbIdx]}
                  initial={reduce ? false : { opacity: 0, y: 12, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0)" }}
                  exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
                  transition={{ duration: 0.5 }}
                  className="inline-block bg-linear-to-r from-cyan-200 via-cyan-300 to-fuchsia-300 bg-clip-text text-transparent"
                >
                  {ROTATING_VERBS[verbIdx]}
                </motion.span>
              </span>
            </span>
            <span className="mt-3 block text-white/95">We ship the website.</span>
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-7 max-w-xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8"
          >
            VoiceToWebsite turns a 60-second business brief into a hosted, conversion-ready homepage. Real Gemini copy, live media,
            mobile-first layout, paid in $9.99 / $19.99 / $49.99 plans.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/pricing"
              onClick={() => click()}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-linear-to-r from-cyan-300 via-cyan-300 to-fuchsia-400 px-6 py-3.5 text-sm font-black uppercase tracking-[0.18em] text-black shadow-[0_18px_60px_-12px_rgba(34,211,238,0.55)] transition hover:translate-y-[-2px] hover:shadow-[0_22px_70px_-10px_rgba(34,211,238,0.7)] active:translate-y-0"
            >
              <span className="absolute inset-0 -translate-x-full bg-white/30 mask-[linear-gradient(90deg,transparent,white,transparent)] transition group-hover:translate-x-full" />
              <span className="relative z-10 inline-flex items-center gap-2">
                Start a build <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
            <a
              href="#live-preview"
              onClick={(e) => {
                tick();
                const el = document.getElementById("live-preview");
                if (el) {
                  e.preventDefault();
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white/85 backdrop-blur hover:border-cyan-300/40 hover:text-white transition"
            >
              <PlayCircle className="h-4 w-4 text-cyan-300 transition group-hover:scale-110" /> Try free preview
            </a>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs uppercase tracking-[0.24em] text-white/45"
          >
            <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Stripe secured</span>
            <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> Hosted on Cloudflare</span>
            <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-fuchsia-300" /> Mobile-first</span>
          </motion.div>
        </div>

        {/* hero device mock */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex justify-center lg:justify-end"
        >
          <div className="relative w-full max-w-md">
            <motion.div
              animate={reduce ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="relative rounded-[34px] border border-white/15 bg-linear-to-br from-white/10 via-white/5 to-transparent p-1 shadow-[0_40px_120px_-24px_rgba(0,0,0,0.7)]"
            >
              <div className="rounded-[28px] overflow-hidden bg-black">
                <div className="relative aspect-9/16 w-full">
                  <video
                    src="/videos/voice-to-website-demo.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster="/vtw-wallpaper.png"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-black/30" />
                  <div className="absolute inset-0 flex items-end p-6">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-cyan-200 backdrop-blur">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
                        </span>
                        Live build
                      </div>
                      <div className="font-display text-2xl font-black leading-tight text-white">
                        “Build a luxury spa website with booking.”
                      </div>
                      <div className="text-xs text-white/60">Generated in 47 seconds. Hosted at voicetowebsite.com/sites/&hellip;</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="absolute -left-6 top-10 hidden rounded-2xl border border-cyan-300/30 bg-black/70 px-4 py-3 text-xs text-white/80 backdrop-blur-xl sm:block"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-200">Brief</div>
              <div className="mt-1 max-w-[180px] leading-5">A premium spa with hot stone, facials, online booking.</div>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="absolute -right-4 bottom-12 hidden rounded-2xl border border-fuchsia-300/30 bg-black/70 px-4 py-3 text-xs text-white/80 backdrop-blur-xl sm:block"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-fuchsia-200">Engine</div>
              <div className="mt-1 inline-flex items-center gap-2"><Mic className="h-3 w-3 text-fuchsia-200" /> Gemini 2.0 Flash</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
