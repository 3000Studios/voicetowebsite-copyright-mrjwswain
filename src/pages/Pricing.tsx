import { PLAN_LIMITS, PlanType } from "@/constants/plans";
import { parseResponse, ApiError } from "../lib/api";
import { GOOGLE_AI_STUDIO_APP_URL } from "@/constants/integrations";
import { trackEvent } from "@/lib/analytics";
import { ArrowRight, CheckCircle2, PlayCircle, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { motion } from "motion/react";
import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const planOrder: PlanType[] = ["starter", "pro", "enterprise", "commands"];

export const Pricing = () => {
  const [cadence, setCadence] = React.useState<"month" | "year">("month");
  const [submitting, setSubmitting] = React.useState<PlanType | null>(null);

  const handleUpgrade = async (plan: PlanType) => {
    trackEvent("pricing_cta_clicked", { plan, cadence });
    setSubmitting(plan);
    try {
      if (plan === "free") {
        window.location.href = "/examples";
        return;
      }

      const query = new URLSearchParams({ plan, cadence }).toString();
      const response = await fetch(`/api/create-checkout-session?${query}`, { method: "POST" });
      trackEvent("checkout_started", { plan, cadence });
      const data = await parseResponse<{ url?: string; error?: string }>(response);

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Stripe checkout initialization failed.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      setSubmitting(null);
    }
  };

  const getDisplayedPrice = (plan: PlanType) => {
    const config = PLAN_LIMITS[plan];
    if (plan === "commands") return `$${config.price.toFixed(2)}`;
    if (cadence === "year") return `$${(config.price * 12 * 0.8).toFixed(2)}`;
    return `$${config.price.toFixed(2)}`;
  };

  const getSlashPrice = (_plan: PlanType): string | null => null;

  return (
    <div className="section-shell pt-14">
      <Helmet>
        <title>Pricing — VoiceToWebsite</title>
        <meta name="description" content="Choose the VoiceToWebsite plan that fits your build volume, export needs, and delivery workflow." />
        <link rel="canonical" href="https://voicetowebsite.com/pricing" />
      </Helmet>

      <div className="content-grid gap-10">
        <div className="section-intro max-w-4xl text-center mx-auto">
          <span className="eyebrow justify-center">Pricing</span>
          <h1 className="section-title">Choose the plan that matches how many sites you need to launch.</h1>
          <p className="section-copy">
            One free sandbox preview, then paid delivery for hosted sites. Annual billing saves 20%.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-4xl border border-white/10 bg-white/4 p-6 backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-2 text-cyan-200">
              <PlayCircle className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-[0.28em]">60-second build</span>
            </div>
            <video
              src="/videos/voice-to-website-demo.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="aspect-video w-full rounded-3xl border border-white/10 object-cover"
            />
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Watch the generator move from voice brief to live site structure before you buy.
            </p>
          </div>

          <div className="rounded-4xl border border-white/10 bg-white/4 p-6 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">Billing mode</span>
              <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-1">
                {(["month", "year"] as const).map((option) => {
                  const active = cadence === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCadence(option)}
                      className={`rounded-full px-5 py-2 text-sm font-semibold transition ${active ? "bg-indigo-500 text-white shadow-[0_0_24px_rgba(99,102,241,0.35)]" : "text-slate-300 hover:text-white"}`}
                    >
                      {option === "month" ? "Monthly" : "Annual"}
                    </button>
                  );
                })}
              </div>
              {cadence === "year" ? <span className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-200">Annual saves 20%</span> : null}
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="mb-3 flex items-center gap-2 text-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-[0.24em]">Command definition</span>
              </div>
              <p className="text-sm leading-6 text-slate-300">
                One command equals one layout change, copy rewrite, section add, or media swap. No hidden math.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <InfoCard title="Starter" body="$9.99/mo. 50 commands." />
              <InfoCard title="Pro" body="$19.99/mo. Exports + 150 commands." />
              <InfoCard title="Ultimate" body="$49.99/mo. 500 commands." />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-4">
          {planOrder.map((plan, index) => {
            const config = PLAN_LIMITS[plan];
            const highlighted = plan === "pro";
            const enterprise = plan === "enterprise";
            const slash = getSlashPrice(plan);

            return (
              <motion.div
                key={plan}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.06 }}
                className={`pricing-card ${highlighted ? "pricing-card-featured" : ""} ${enterprise ? "pricing-card-enterprise" : ""}`}
              >
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-200/90">
                        {config.name}
                      </div>
                      <div className="mt-2 flex items-end gap-3">
                        <h2 className="text-4xl font-bold text-white">{getDisplayedPrice(plan)}</h2>
                        {slash ? <span className="pb-1 text-sm text-slate-400 line-through">{slash}</span> : null}
                      </div>
                    </div>
                    {highlighted ? <span className="pricing-pill">Best fit</span> : null}
                    {enterprise ? <span className="pricing-pill pricing-pill-dark">Scale</span> : null}
                  </div>

                  <p className="text-sm leading-6 text-slate-300">{config.description}</p>
                </div>

                <div className="space-y-3 text-sm text-slate-300">
                  <FeatureLine label={plan === "commands" ? "One-time command pack" : `${config.hostedSites} hosted sites`} />
                  <FeatureLine label={plan === "commands" ? "Use any time after purchase" : `${config.commandsPerCycle} commands per cycle`} />
                  <FeatureLine label={config.canExportCode ? "GitHub export path included" : "Hosted site delivery included"} />
                  <FeatureLine label={config.removeWatermark ? "Watermark-free delivery" : "Branded delivery on free tier"} />
                  <FeatureLine label={plan === "commands" ? "No recurring billing" : cadence === "year" ? "Annual billing, save 20%" : "Monthly billing"} />
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => handleUpgrade(plan)}
                    disabled={submitting === plan}
                    className="hero-primary-button w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting === plan ? "Redirecting…" : plan === "commands" ? "Buy command pack" : `Choose ${config.name}`}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="text-xs leading-5 text-slate-400">
                    By purchasing, you agree to the <Link to="/terms" className="underline">Terms</Link>, <Link to="/privacy" className="underline">Privacy Policy</Link>, and <Link to="/refunds" className="underline">Refund Policy</Link>.
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="rounded-4xl border border-white/10 bg-white/4 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-cyan-200">
            <Wand2 className="h-4 w-4" />
            <h3 className="text-lg font-semibold text-white">What happens next</h3>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <InfoCard title="1. Secure checkout" body="Choose a provider, pay, and return to setup." />
            <InfoCard title="2. Short intake" body="Describe the business, industry, and style." />
            <InfoCard title="3. Hosted delivery" body="The generator produces a live site link and stores the order." />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/examples" className="hero-secondary-button">
              Try the sandbox
            </Link>
            <Link to="/features" className="hero-secondary-button">
              See generator features
            </Link>
            <a href={GOOGLE_AI_STUDIO_APP_URL} target="_blank" rel="noreferrer" className="hero-secondary-button">
              Open AI Studio app
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureLine = ({ label }: { label: string }) => (
  <div className="inline-flex items-center gap-3">
    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
    <span>{label}</span>
  </div>
);

const InfoCard = ({ title, body }: { title: string; body: string }) => (
  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
    <div className="font-semibold text-white">{title}</div>
    <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
  </div>
);
