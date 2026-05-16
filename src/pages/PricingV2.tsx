import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Building2, Check, Rocket, Sparkles, Store, X } from "lucide-react";

import { Reveal } from "@/components/home/v2/Reveal";
import { useClickSound } from "@/components/home/v2/useClickSound";
import { parseResponse } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

type Cadence = "month" | "year";
type PlanId = "starter" | "pro" | "enterprise";

interface Tier {
  id: PlanId;
  name: string;
  price: number;
  persona: string;
  icon: typeof Rocket;
  headline: string;
  story: string;
  bullets: string[];
  featured?: boolean;
  accent: string;
  badge?: string;
}

const tiers: Tier[] = [
  {
    id: "starter",
    name: "Starter",
    price: 9.99,
    persona: "For solo founders",
    icon: Rocket,
    headline: "Ship your first launch tonight.",
    story:
      "You have an idea and zero patience for templates. Speak it, get a hosted homepage with real copy and conversion sections in under a minute.",
    bullets: [
      "50 commands per month",
      "Hosted on voicetowebsite.com/sites",
      "Gemini-written hero, services, FAQ",
      "Mobile-first responsive build",
      "Standard generation queue",
      "Email support",
    ],
    accent: "from-cyan-300/40 to-cyan-300/0",
  },
  {
    id: "pro",
    name: "Pro",
    price: 19.99,
    persona: "For local businesses",
    icon: Store,
    headline: "Look credible on Google. Today.",
    story:
      "You run the salon, the gym, the law firm. You don't have time for a 6-week web project. Get a custom-domain site that actually delivers leads.",
    bullets: [
      "150 commands per month",
      "Custom domain ready",
      "Code export (React + Vite)",
      "Premium sections + no watermark",
      "Priority generation queue",
      "Priority email support",
    ],
    accent: "from-fuchsia-400/45 to-fuchsia-400/0",
    featured: true,
    badge: "Most chosen",
  },
  {
    id: "enterprise",
    name: "Ultimate",
    price: 49.99,
    persona: "For agencies + resellers",
    icon: Building2,
    headline: "Multiply client output 10x.",
    story:
      "You run a studio. Your bottleneck is content and delivery. Hand off 50 sites this quarter with a whitelabel dashboard and a priority queue.",
    bullets: [
      "500 commands per month",
      "50 hosted sites included",
      "Whitelabel client dashboard",
      "Priority generation queue",
      "Early beta access to new engines",
      "Direct line for account help",
    ],
    accent: "from-indigo-400/45 to-indigo-400/0",
  },
];

const featureMatrix: Array<{ label: string; starter: string | boolean; pro: string | boolean; enterprise: string | boolean }> = [
  { label: "Commands per month", starter: "50", pro: "150", enterprise: "500" },
  { label: "Hosted sites", starter: "1", pro: "5", enterprise: "50" },
  { label: "Custom domain", starter: false, pro: true, enterprise: true },
  { label: "Code export", starter: false, pro: true, enterprise: true },
  { label: "Remove watermark", starter: false, pro: true, enterprise: true },
  { label: "Whitelabel dashboard", starter: false, pro: false, enterprise: true },
  { label: "Priority queue", starter: false, pro: true, enterprise: true },
  { label: "Gemini-powered copy", starter: true, pro: true, enterprise: true },
  { label: "Mobile-first build", starter: true, pro: true, enterprise: true },
  { label: "Email support", starter: "Standard", pro: "Priority", enterprise: "Direct line" },
];

const faqs = [
  {
    q: "Can I switch plans mid-cycle?",
    a: "Yes. Upgrades take effect immediately and we prorate the difference. Downgrades take effect at the next renewal so you keep what you paid for.",
  },
  {
    q: "What counts as a command?",
    a: "One command = one structural change to a generated site: a layout rewrite, a section add, a copy regenerate, or a media swap. Loading and viewing your hosted site is free.",
  },
  {
    q: "What happens if I run out of commands?",
    a: "You can buy a $2.99 add-on pack for 10 more commands, or upgrade your plan. We never auto-charge over your plan limit.",
  },
  {
    q: "Is my generated site really mine?",
    a: "On Pro and Ultimate, yes — you get a license to use and export the code for your own business. Starter output stays hosted on our subdomain.",
  },
  {
    q: "What's the refund policy?",
    a: "Subscription fees are non-refundable once billed. See the full Refund Policy for the exceptions we honor (duplicate charges, service outages, billing errors).",
  },
];

export const PricingV2: React.FC = () => {
  const [params] = useSearchParams();
  const [cadence, setCadence] = useState<Cadence>((params.get("cadence") as Cadence) || "month");
  const [submitting, setSubmitting] = useState<PlanId | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const click = useClickSound("tick");
  const ding = useClickSound("ding");

  const focusPlan = useMemo(() => {
    const p = params.get("plan")?.toLowerCase();
    return p === "starter" || p === "pro" || p === "enterprise" ? (p as PlanId) : null;
  }, [params]);

  const handleCheckout = async (plan: PlanId) => {
    if (submitting) return;
    ding();
    setErrMsg(null);
    setSubmitting(plan);
    trackEvent("pricing_cta_clicked", { plan, cadence });
    try {
      const r = await fetch(`/api/create-checkout-session?plan=${plan}&cadence=${cadence}`, { method: "POST" });
      const data = await parseResponse<{ url?: string; error?: string }>(r);
      trackEvent("checkout_started", { plan, cadence });
      if (!r.ok || !data.url) {
        throw new Error(data.error || "Checkout failed. Try again or contact support.");
      }
      window.location.href = data.url;
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : "Checkout failed.");
      setSubmitting(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Pricing — VoiceToWebsite</title>
        <meta
          name="description"
          content="Locked monthly pricing for VoiceToWebsite: Starter $9.99, Pro $19.99, Ultimate $49.99. Real Gemini copy. Mobile-first. Cancel anytime."
        />
        <link rel="canonical" href="https://voicetowebsite.com/pricing" />
      </Helmet>

      {/* HERO */}
      <section className="relative px-5 pt-32 pb-12 sm:px-8 lg:px-12 lg:pt-44 lg:pb-20">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-200 backdrop-blur">
              <Sparkles className="h-3 w-3" /> Locked, honest pricing
            </span>
            <h1 className="mt-7 font-display text-[clamp(2.6rem,6vw,4.6rem)] font-black leading-[0.96] tracking-tight">
              Pay for what you ship. <span className="bg-linear-to-r from-cyan-200 to-fuchsia-300 bg-clip-text text-transparent">Nothing more.</span>
            </h1>
            <p className="mt-5 text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
              $9.99 / $19.99 / $49.99 a month. Annual saves 20%. No "launch discount" gotcha. Cancel anytime.
            </p>

            <div className="mt-9 inline-flex rounded-full border border-white/12 bg-black/40 p-1 backdrop-blur">
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
                      ? "bg-linear-to-r from-cyan-300 to-fuchsia-300 text-black shadow-[0_10px_24px_-8px_rgba(34,211,238,0.5)]"
                      : "text-white/65 hover:text-white"
                  }`}
                >
                  {opt === "month" ? "Monthly" : "Annual · save 20%"}
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* PLAN CARDS */}
      <section className="relative px-5 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          {tiers.map((t, i) => {
            const monthly = t.price;
            const annual = +(t.price * 12 * 0.8).toFixed(2);
            const displayed = cadence === "month" ? monthly : Math.round((annual / 12) * 100) / 100;
            const Icon = t.icon;
            const isFocused = focusPlan === t.id;
            return (
              <Reveal key={t.id} delay={i * 0.08}>
                <article
                  className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border p-7 backdrop-blur-xl transition ${
                    t.featured
                      ? "border-cyan-300/40 bg-linear-to-b from-cyan-300/10 via-white/4 to-fuchsia-400/10 shadow-[0_30px_120px_-30px_rgba(34,211,238,0.4)]"
                      : "border-white/10 bg-linear-to-b from-white/6 to-white/1"
                  } ${isFocused ? "ring-2 ring-cyan-300/60" : ""}`}
                >
                  <div className={`pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-linear-to-br ${t.accent} blur-3xl`} />
                  {t.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-cyan-300 to-fuchsia-400 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-black shadow-[0_10px_24px_-8px_rgba(34,211,238,0.5)]">
                      <Sparkles className="h-3 w-3" /> {t.badge}
                    </div>
                  )}

                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8 text-white/85">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">{t.persona}</div>
                        <h3 className="font-display text-3xl font-black tracking-tight">{t.name}</h3>
                      </div>
                    </div>

                    <p className="mt-5 text-base font-semibold leading-6 text-white/85">{t.headline}</p>
                    <p className="mt-2 text-sm leading-6 text-white/60">{t.story}</p>

                    <div className="mt-7 flex items-baseline gap-2">
                      <span className="font-display text-5xl font-black tracking-tight">${displayed.toFixed(2)}</span>
                      <span className="text-sm text-white/45">/mo</span>
                    </div>
                    {cadence === "year" && (
                      <div className="mt-1 text-xs text-cyan-200/85">Billed ${annual.toFixed(2)} annually · save ${((monthly * 12) - annual).toFixed(2)}</div>
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

                  <button
                    type="button"
                    onClick={() => handleCheckout(t.id)}
                    disabled={!!submitting}
                    className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-black uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      t.featured
                        ? "bg-linear-to-r from-cyan-300 to-fuchsia-400 text-black hover:-translate-y-px hover:shadow-[0_18px_60px_-10px_rgba(34,211,238,0.6)]"
                        : "border border-white/15 bg-white/5 text-white hover:border-cyan-300/40 hover:bg-white/10"
                    }`}
                  >
                    {submitting === t.id ? "Redirecting…" : `Choose ${t.name}`} <ArrowRight className="h-4 w-4" />
                  </button>
                </article>
              </Reveal>
            );
          })}
        </div>

        {errMsg && (
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-rose-400/40 bg-rose-500/10 px-5 py-3 text-center text-sm text-rose-100">
            {errMsg}
          </div>
        )}

        <p className="mx-auto mt-6 max-w-3xl text-center text-xs text-white/45">
          Secure Stripe checkout · Cancel anytime · By purchasing you agree to the{" "}
          <Link to="/terms" className="underline hover:text-white">Terms</Link>,{" "}
          <Link to="/privacy" className="underline hover:text-white">Privacy</Link>, and{" "}
          <Link to="/refunds" className="underline hover:text-white">Refund Policy</Link>.
        </p>
      </section>

      {/* COMPARISON TABLE */}
      <section className="relative px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-white/55 backdrop-blur">
                Compare
              </span>
              <h2 className="mt-6 font-display text-[clamp(1.8rem,4vw,2.8rem)] font-black leading-tight tracking-tight">
                Side by side. <span className="bg-linear-to-r from-cyan-200 to-fuchsia-300 bg-clip-text text-transparent">No fine print.</span>
              </h2>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="mt-10">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-5 py-4 text-left font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">Feature</th>
                      {tiers.map((t) => (
                        <th key={t.id} className="px-5 py-4 text-center">
                          <div className="font-display text-lg font-black">{t.name}</div>
                          <div className="text-xs text-white/45">${t.price}/mo</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {featureMatrix.map((row, i) => (
                      <tr key={row.label} className={i % 2 === 0 ? "bg-white/1.5" : ""}>
                        <td className="px-5 py-3.5 text-white/80">{row.label}</td>
                        {(["starter", "pro", "enterprise"] as const).map((k) => {
                          const v = row[k];
                          return (
                            <td key={k} className="px-5 py-3.5 text-center text-white/80">
                              {typeof v === "boolean" ? (
                                v ? <Check className="mx-auto h-4 w-4 text-cyan-300" /> : <X className="mx-auto h-4 w-4 text-white/25" />
                              ) : (
                                <span className="font-medium">{v}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* TRUST BAND */}
      <section className="relative px-5 py-16 sm:px-8 lg:px-12">
        <Reveal>
          <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-linear-to-br from-white/5 to-white/1 p-8 backdrop-blur-xl lg:p-12">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-200">Secure</div>
                <div className="mt-2 font-display text-xl font-black">Stripe-powered checkout</div>
                <p className="mt-2 text-sm text-white/55">Your card never touches our servers. Full PCI compliance.</p>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-fuchsia-200">Cancel anytime</div>
                <div className="mt-2 font-display text-xl font-black">No long-term contract</div>
                <p className="mt-2 text-sm text-white/55">One click in your dashboard ends the next renewal.</p>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-emerald-200">Honest pricing</div>
                <div className="mt-2 font-display text-xl font-black">No surprise upcharges</div>
                <p className="mt-2 text-sm text-white/55">$9.99 / $19.99 / $49.99 locked. We never bait-and-switch.</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="relative px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="lg:sticky lg:top-32">
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-white/55 backdrop-blur">
                Pricing FAQ
              </span>
              <h2 className="mt-6 font-display text-[clamp(2rem,4.6vw,3rem)] font-black leading-tight tracking-tight">
                Real answers. <span className="bg-linear-to-r from-cyan-200 to-fuchsia-300 bg-clip-text text-transparent">No fluff.</span>
              </h2>
              <p className="mt-4 max-w-md text-base text-white/60">
                Need the full FAQ?{" "}
                <Link to="/faq" className="underline hover:text-white">Read it here</Link>
                . Need a human?{" "}
                <Link to="/contact" className="underline hover:text-white">Email us</Link>.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <ul className="space-y-3">
              {faqs.map((f) => (
                <li key={f.q} className="rounded-2xl border border-white/10 bg-white/4 p-6 backdrop-blur-xl">
                  <div className="font-display text-base font-black leading-tight sm:text-lg">{f.q}</div>
                  <p className="mt-2 text-sm leading-7 text-white/70">{f.a}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </>
  );
};
