import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import React, { useRef } from "react";

import { Reveal } from "./Reveal";

const tiles = [
  { title: "Stella Beauty Studio", category: "Beauty / Salon", img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80" },
  { title: "Iron Forge Athletics", category: "Fitness / Coaching", img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80" },
  { title: "Mason &amp; Co. Law", category: "Legal / Consultations", img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80" },
  { title: "Roastery 47", category: "Hospitality / Coffee", img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80" },
  { title: "Northwind Realty", category: "Real Estate", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80" },
  { title: "Aperture Studio", category: "Creative / Photo", img: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=80" },
];

export const Showcase: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x1 = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const x2 = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  return (
    <section ref={ref} className="relative px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-white/55 backdrop-blur">
              Recent builds
            </span>
            <h2 className="mt-6 font-display text-[clamp(2rem,4.6vw,3.4rem)] font-black leading-[1.05] tracking-tight">
              Sites we shipped <span className="bg-linear-to-r from-cyan-200 to-fuchsia-300 bg-clip-text text-transparent">this week.</span>
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t, i) => (
            <Reveal key={t.title} delay={(i % 3) * 0.1}>
              <motion.article
                style={reduce ? undefined : { x: i % 2 === 0 ? x1 : x2 }}
                className="group relative aspect-4/5 overflow-hidden rounded-3xl border border-white/10"
              >
                <img src={t.img} alt={t.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110 group-hover:rotate-[0.6deg]" />
                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-linear-to-tr from-cyan-400/0 via-cyan-400/0 to-cyan-300/0 opacity-0 transition group-hover:from-cyan-400/15 group-hover:to-fuchsia-400/20 group-hover:opacity-100" />
                <div className="relative z-10 flex h-full flex-col justify-end p-6">
                  <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-200/80">{t.category}</div>
                  <h3 className="mt-2 font-display text-2xl font-black leading-tight tracking-tight">{t.title}</h3>
                  <div className="mt-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/75 backdrop-blur opacity-0 transition group-hover:opacity-100">
                    View build
                  </div>
                </div>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
