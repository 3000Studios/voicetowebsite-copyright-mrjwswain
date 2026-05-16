import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, Rocket, Store } from "lucide-react";

import { Reveal } from "./Reveal";
import { useClickSound } from "./useClickSound";

const personas = [
  {
    id: "founder",
    icon: Rocket,
    eyebrow: "For solo founders",
    title: "Ship your first landing tonight.",
    body: "Stop wrestling with templates. Speak the business once and get a hosted homepage with real copy, conversion sections, and a fast checkout already wired.",
    bullets: ["Hosted subdomain in 60s", "50 commands / month", "Gemini-written copy"],
    cta: "Start with Starter",
    plan: "starter",
    accent: "from-cyan-300/40 to-cyan-300/0",
    chipClass: "border-cyan-300/30 bg-cyan-300/10 text-cyan-200",
    price: "$9.99",
  },
  {
    id: "local",
    icon: Store,
    eyebrow: "For local businesses",
    title: "Look credible on Google. Tonight.",
    body: "Tell us the trade, neighborhood, and the customer you want. We render a mobile-first site with services, reviews, and a contact form that actually delivers leads.",
    bullets: ["Custom domain ready", "150 commands / month", "Code export + premium sections"],
    cta: "Go Pro",
    plan: "pro",
    accent: "from-fuchsia-400/40 to-fuchsia-400/0",
    chipClass: "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-200",
    price: "$19.99",
  },
  {
    id: "agency",
    icon: Building2,
    eyebrow: "For agencies + resellers",
    title: "Multiply client output 10x.",
    body: "Run the studio on autopilot. 50 hosted sites, white-label dashboard, priority generation, and Gemini-powered copy you can hand off to clients without rewriting.",
    bullets: ["50 hosted sites", "500 commands / month", "Whitelabel + priority queue"],
    cta: "Unlock Ultimate",
    plan: "enterprise",
    accent: "from-indigo-400/40 to-indigo-400/0",
    chipClass: "border-indigo-300/30 bg-indigo-300/10 text-indigo-200",
    price: "$49.99",
  },
];

export const Personas: React.FC = () => {
  const click = useClickSound("tick");
  return (
    <section className="relative px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-white/55 backdrop-blur">
              Pick your lane
            </span>
            <h2 className="mt-6 font-display text-[clamp(2rem,4.6vw,3.4rem)] font-black leading-[1.05] tracking-tight">
              One engine. <span className="bg-linear-to-r from-cyan-200 to-fuchsia-300 bg-clip-text text-transparent">Three buyers.</span>
            </h2>
            <p className="mt-4 text-base text-white/60 sm:text-lg">
              Plans are priced for the build you actually need. Pick the lane, get the result, scale up when you grow.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {personas.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <article className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-linear-to-b from-white/[0.07] to-white/2 p-7 backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/25">
                <div className={`pointer-events-none absolute -top-32 -right-24 h-64 w-64 rounded-full bg-linear-to-br ${p.accent} blur-3xl transition group-hover:scale-125`} />
                <div className="relative flex h-full flex-col">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] ${p.chipClass}`}>
                      <p.icon className="h-3 w-3" /> {p.eyebrow}
                    </span>
                    <span className="font-display text-xl font-black tracking-tight text-white/90">{p.price}<span className="text-xs text-white/40">/mo</span></span>
                  </div>

                  <h3 className="mt-7 font-display text-3xl font-black leading-tight tracking-tight">{p.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/65">{p.body}</p>

                  <ul className="mt-6 space-y-2.5 text-sm text-white/75">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-cyan-300" /> {b}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 pt-6 border-t border-white/10">
                    <Link
                      to="/pricing"
                      state={{ focusPlan: p.plan }}
                      onClick={() => click()}
                      className="group/cta inline-flex items-center justify-between gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white/90 transition hover:border-cyan-300/50 hover:bg-white/10"
                    >
                      {p.cta}
                      <ArrowUpRight className="h-4 w-4 transition group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
