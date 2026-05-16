import { motion, useReducedMotion } from "motion/react";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mic, Type } from "lucide-react";

import { Reveal } from "./Reveal";
import { useClickSound } from "./useClickSound";

const SAMPLE_PROMPTS = [
  "Vintage coffee shop in Brooklyn with online ordering",
  "Law firm specializing in immigration with consultations",
  "Boutique fitness studio with class schedule and trial",
  "Wedding photographer with portfolio and inquiry form",
];

export const LivePreviewTeaser: React.FC = () => {
  const [mode, setMode] = useState<"voice" | "type">("type");
  const [draft, setDraft] = useState(SAMPLE_PROMPTS[0]);
  const click = useClickSound("tick");
  const ding = useClickSound("ding");
  const reduce = useReducedMotion();

  return (
    <section id="live-preview" className="relative px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-white/55 backdrop-blur">
              Free preview
            </span>
            <h2 className="mt-6 font-display text-[clamp(2rem,4.6vw,3.4rem)] font-black leading-[1.05] tracking-tight">
              See your homepage <span className="bg-gradient-to-r from-cyan-200 to-fuchsia-300 bg-clip-text text-transparent">before you pay.</span>
            </h2>
            <p className="mt-4 text-base text-white/60 sm:text-lg">
              Speak the brief or pick a sample. We&apos;ll render a sandbox preview at no cost. Pay only when you want to host, export, or remove the watermark.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.15} className="mt-12">
          <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-gradient-to-b from-white/[0.06] to-white/[0.01] p-1.5 backdrop-blur-2xl">
            <div className="rounded-[22px] bg-black/60 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-full border border-white/10 bg-black/60 p-1">
                  {(["type", "voice"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        click();
                        setMode(opt);
                      }}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition ${
                        mode === opt ? "bg-white text-black shadow-[0_8px_24px_-8px_rgba(255,255,255,0.5)]" : "text-white/65 hover:text-white"
                      }`}
                    >
                      {opt === "type" ? <Type className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-white/40">
                  Sandbox preview · No charge · Sign in to host
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="brief" className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-200/80">
                  Business brief
                </label>
                <textarea
                  id="brief"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-2xl border border-white/12 bg-black/60 px-5 py-4 text-base text-white placeholder:text-white/30 outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/15 transition"
                  placeholder="Describe the business, customer, and the one action you want visitors to take."
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {SAMPLE_PROMPTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      click();
                      setDraft(s);
                    }}
                    className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
                      draft === s
                        ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                        : "border-white/10 bg-white/5 text-white/55 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to={`/setup?provider=preview&brief=${encodeURIComponent(draft)}`}
                  onClick={() => ding()}
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-400 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black shadow-[0_18px_60px_-12px_rgba(34,211,238,0.55)] hover:-translate-y-[1px] active:translate-y-0 transition"
                >
                  Generate preview <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
                <span className="text-xs text-white/45">~ 47 seconds. Free. No card.</span>
              </div>
            </div>

            {/* faux preview tile */}
            {!reduce && (
              <motion.div
                aria-hidden
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="pointer-events-none absolute -right-12 -top-10 hidden h-44 w-44 rotate-6 rounded-2xl border border-white/10 bg-[url('/vtw-wallpaper.png')] bg-cover bg-center opacity-50 lg:block"
              />
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
};
