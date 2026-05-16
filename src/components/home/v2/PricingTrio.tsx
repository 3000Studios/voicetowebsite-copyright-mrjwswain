import { motion } from "motion/react";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";

import { Reveal } from "./Reveal";
import { useClickSound } from "./useClickSound";

type Cadence = "month" | "year";

interface Tier {
  id: "starter" | "pro" | "enterprise";
  name: string;
  price: number;
  persona: string;
  headline: string;
  bullets: string[];
  featured?: boolean;
}

const tiers: Tier[] = [
  {
    id: "starter",
    name: "Starter",
    price: 9.99,
    persona: "For solo founders",
    headline: "Ship your first launch tonight.",
    bullets: [
      "50 commands per month",
      "Hosted on voicetowebsite.com/sites",
      "Gemini-written hero + sections",
      "Mobile-first responsive build",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 19.99,
    persona: "For local businesses",
    headline: "Look credible on Google. Today.",
    bullets: [
      "150 commands per month",
      "Custom domain ready",
      "Code export (React + Vite)",
      "Premium sections + no watermark",
      "Priority email support",
    ],
    featured: true,
  },
  {
    id: "enterprise",
    name: "Ultimate",
    price: 49.99,
    persona: "For agencies + resellers",
    headline: "Multiply client output 10x.",
    bullets: [
      "500 commands per month",
      "50 hosted sites included",
      "Whitelabel client dashboard",
      "Priority generation queue",
      "Early beta access",
    ],
  },
];

export const PricingTrio: React.FC = () => {
  const [cadence, setCadence] = useState<Cadence>("month");
  const click = useClickSound("tick");
  const ding = useClickSound("ding");

  return (
    <section id="pricing" className="relative px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-white/55 backdrop-blur">
              Pricing
            </span>
            <h2 className="mt-6 font-display text-[clamp(2rem,4.6vw,3.4rem)] font-black leading-[1.05] tracking-tight">
              Locked, honest pricing. <span className="bg-gradient-to-r from-cyan-200 to-fuchsia-300 bg-clip-text text-transparent">No tricks.</span>
            </h2>
            <p className="mt-4 text-base text-white/60 sm:text-lg">
              Pay monthly or save 20% on annual. Cancel anytime. No surprise upcharges.
            </p>

            <div className="mt-8 inline-flex rounded-full border border-white/12 bg-black/40 p-1 backdrop-blur">
              {(["month", "year"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    click();
                    setCadence(opt);
                  }}
                  className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] transition ${
                    cadence === opt
                      ? "bg-gradient-to-r from-cyan-300 to-fuchsia-300 text-black shadow-[0_10px_24px_-8px_rgba(34,211,238,0.5)]"
                      : "text-white/65 hover:text-white"
                  }`}
                >
                  {opt === "month" ? "Monthly" : "Annual · save 20%"}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {tiers.map((t, i) => {
            const monthly = t.price;
            const yearly = +(t.price * 12 * 0.8).toFixed(2);
            const displayed = cadence === "month" ? monthly : Math.round(yearly / 12 * 100) / 100;
            return (
              <Reveal key={t.id} delay={i * 0.08}>
                <motion.article
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 220, damping: 22 }}
                  className={`relative flex h-full flex-col overflow-hidden rounded-3xl border p-7 backdrop-blur-xl ${
                    t.featured
                      ? "border-cyan-300/40 bg-gradient-to-b from-cyan-300/10 via-white/[0.04] to-fuchsia-400/10 shadow-[0_30px_120px_-30px_rgba(34,211,238,0.4)]"
                      : "border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.01]"
                  }`}
                >
                  {t.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-400 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-black shadow-[0_10px_24px_-8px_rgba(34,211,238,0.5)]">
                      <Sparkles className="h-3 w-3" /> Most chosen
                    </div>
                  )}
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">{t.persona}</div>
                    <h3 className="mt-2 font-display text-3xl font-black tracking-tight">{t.name}</h3>
                    <p className="mt-2 text-sm text-white/65">{t.headline}</p>
                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="font-display text-5xl font-black tracking-tight">${displayed.toFixed(2)}</span>
                      <span className="text-sm text-white/45">/mo</span>
                    </div>
                    {cadence === "year" && (
                      <div className="mt-1 text-xs text-cyan-200/85">Billed ${yearly.toFixed(2)} annually</div>
                    )}
                  </div>

                  <ul className="mt-7 flex-1 space-y-3 text-sm text-white/80">
                    {t.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-cyan-300/15 text-cyan-200">
                          <Check className="h-3 w-3" />
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={`/pricing?plan=${t.id}&cadence=${cadence}`}
                    onClick={() => ding()}
                    className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-black uppercase tracking-[0.18em] transition ${
                      t.featured
                        ? "bg-gradient-to-r from-cyan-300 to-fuchsia-400 text-black hover:-translate-y-[1px] hover:shadow-[0_18px_60px_-10px_rgba(34,211,238,0.6)]"
                        : "border border-white/15 bg-white/5 text-white hover:border-cyan-300/40 hover:bg-white/10"
                    } active:translate-y-0`}
                  >
                    Choose {t.name}
                  </Link>
                </motion.article>
              </Reveal>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-white/45">
          Subscriptions billed by Stripe. Cancel anytime from your dashboard. See our <Link to="/refunds" className="underline hover:text-white">refund policy</Link>.
        </p>
      </div>
    </section>
  );
};
