import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import React, { useRef } from "react";
import { Mic, Sparkles, Globe, ArrowRight } from "lucide-react";

import { Reveal } from "./Reveal";

const steps = [
  {
    id: 1,
    icon: Mic,
    title: "Speak the brief",
    body: "Tap once and tell us the business, the customer, and the offer. Voice or type — 60 seconds is enough.",
  },
  {
    id: 2,
    icon: Sparkles,
    title: "Gemini drafts the homepage",
    body: "We render a hosted homepage with industry-tuned hero copy, services, proof, pricing, FAQ, and a contact section.",
  },
  {
    id: 3,
    icon: Globe,
    title: "You get a live link",
    body: "Delivered to your dashboard at voicetowebsite.com/sites/your-build. Custom domain on Pro and Ultimate.",
  },
];

export const HowItWorks: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.6], ["0%", "100%"]);

  return (
    <section ref={ref} className="relative px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-white/55 backdrop-blur">
              How it works
            </span>
            <h2 className="mt-6 font-display text-[clamp(2rem,4.6vw,3.4rem)] font-black leading-[1.05] tracking-tight">
              Three steps. <span className="bg-gradient-to-r from-cyan-200 to-fuchsia-300 bg-clip-text text-transparent">No templates.</span>
            </h2>
          </div>
        </Reveal>

        <div className="relative mt-16">
          {/* timeline track */}
          <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-white/10 md:block" />
          {!reduce && (
            <motion.div
              style={{ height: lineHeight }}
              className="pointer-events-none absolute left-1/2 top-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-cyan-300 via-fuchsia-400 to-transparent md:block"
            />
          )}

          <ul className="space-y-12 md:space-y-24">
            {steps.map((step, i) => {
              const left = i % 2 === 0;
              return (
                <li key={step.id} className="relative md:grid md:grid-cols-2 md:items-center md:gap-12">
                  <Reveal direction={left ? "right" : "left"} className={left ? "md:order-1" : "md:order-2"}>
                    <div className={`group relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.01] p-7 backdrop-blur-xl hover:border-cyan-300/30 transition ${left ? "md:mr-10" : "md:ml-10"}`}>
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-fuchsia-400 text-black shadow-[0_10px_36px_-10px_rgba(34,211,238,0.5)]">
                          <step.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">Step {String(step.id).padStart(2, "0")}</div>
                          <h3 className="font-display text-2xl font-black leading-tight">{step.title}</h3>
                        </div>
                      </div>
                      <p className="mt-5 text-sm leading-6 text-white/65">{step.body}</p>
                    </div>
                  </Reveal>

                  {/* center node */}
                  <div className={`relative hidden md:flex md:items-center md:justify-center ${left ? "md:order-2" : "md:order-1"}`}>
                    <span className="relative inline-flex h-5 w-5 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300/50" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.7)]" />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <Reveal delay={0.2}>
          <div className="mt-16 flex justify-center">
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white/90 hover:border-cyan-300/40 hover:text-white transition"
            >
              See what each plan ships <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
