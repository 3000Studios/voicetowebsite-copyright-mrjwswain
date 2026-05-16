import { motion, AnimatePresence } from "motion/react";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ArrowRight } from "lucide-react";

import { Reveal } from "./Reveal";
import { useClickSound } from "./useClickSound";

const items = [
  {
    q: "How fast does the homepage actually generate?",
    a: "Most builds finish in 45–60 seconds. The bottleneck is the Gemini copy pass; the layout and media selection happen in parallel.",
  },
  {
    q: "Is the AI real, or is it just templates with my words pasted in?",
    a: "Real. We use Google's Gemini to write the headline, hero subtext, services, proof points, testimonials, and FAQ from your brief. The structural skeleton is a tuned template; the words and tone come from the AI.",
  },
  {
    q: "Can I export the code?",
    a: "Yes, on Pro and Ultimate. You get a clean React + Vite export you can deploy anywhere. Starter is hosted-only on our subdomain.",
  },
  {
    q: "Is there a free trial?",
    a: "There is a free sandbox preview — you can generate a watermarked preview without paying. Hosting, exporting, and removing the watermark require a plan.",
  },
];

export const FaqTeaser: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);
  const click = useClickSound("tick");

  return (
    <section className="relative px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <div className="lg:sticky lg:top-32">
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-white/55 backdrop-blur">
              Frequently asked
            </span>
            <h2 className="mt-6 font-display text-[clamp(2rem,4.6vw,3.4rem)] font-black leading-[1.05] tracking-tight">
              Quick answers. <span className="bg-linear-to-r from-cyan-200 to-fuchsia-300 bg-clip-text text-transparent">Before you buy.</span>
            </h2>
            <p className="mt-4 max-w-md text-base text-white/60 sm:text-lg">
              Honest answers about the engine, the pricing, and what you actually get. Want the long version?{" "}
              <Link to="/faq" className="underline transition hover:text-white">
                Read the full FAQ
              </Link>
              .
            </p>
            <Link
              to="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white/90 hover:border-cyan-300/40 hover:text-white transition"
            >
              Ask us anything <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <ul className="space-y-3">
            {items.map((it, i) => {
              const isOpen = open === i;
              return (
                <li key={it.q} className="overflow-hidden rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={() => {
                      click();
                      setOpen(isOpen ? null : i);
                    }}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-white/[0.06]"
                  >
                    <span className="font-display text-base font-black leading-tight sm:text-lg">{it.q}</span>
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }} className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white/5">
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <p className="px-6 pb-6 text-sm leading-7 text-white/70">{it.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
};
