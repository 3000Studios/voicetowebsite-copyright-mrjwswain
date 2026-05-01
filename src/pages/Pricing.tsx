import { PLAN_LIMITS, PlanType } from "@/constants/plans";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import React from "react";
import { Helmet } from "react-helmet-async";

const planOrder: PlanType[] = ["starter", "pro", "enterprise", "commands"];

const cadenceCopy = {
  month: "Billed monthly",
  year: "Billed annually with built-in discount",
} as const;

export const Pricing = () => {
  const [cadence, setCadence] = React.useState<"month" | "year">("month");
  const [submitting, setSubmitting] = React.useState<PlanType | null>(null);
  const [provider, setProvider] = React.useState<"stripe" | "paypal">("stripe");

  const handleUpgrade = async (plan: PlanType) => {
    setSubmitting(plan);
    try {
      if (plan === "free") {
        window.location.href = "/success?plan=starter&cadence=month";
        return;
      }

      const endpoint =
        provider === "stripe"
          ? "/api/create-checkout-session"
          : "/api/create-paypal-order";
      const query = new URLSearchParams({
        plan,
        cadence,
      }).toString();
      const response = await fetch(`${endpoint}?${query}`, {
        method: "POST",
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Checkout initialization failed.");
      }
      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      setSubmitting(null);
    }
  };

  const getDisplayedPrice = (plan: PlanType) => {
    const config = PLAN_LIMITS[plan];
    if (plan === "commands") return "$2.99";
    if (cadence === "year") return `$${Math.round(config.price * 12 * 0.8)}`;
    return `$${config.price}`;
  };

  return (
    <div className="section-shell pt-14">
      <Helmet>
        <title>Pricing — VoiceToWebsite</title>
        <meta
          name="description"
          content="Choose the VoiceToWebsite plan that fits your build volume, export needs, and delivery workflow."
        />
      </Helmet>

      <div className="content-grid gap-10">
        <div className="section-intro max-w-3xl text-center mx-auto">
          <span className="eyebrow justify-center">Pricing</span>
          <h1 className="section-title">
            Choose the plan that matches how many sites you need to launch.
          </h1>
          <p className="section-copy">
            All plans use the same premium purchase flow. You pay, complete the
            setup form, and receive a hosted starter site link.
          </p>
        </div>

        <div className="mx-auto inline-flex rounded-full border border-white/10 bg-white/4 p-2 backdrop-blur-xl">
          {(["month", "year"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCadence(option)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                cadence === option
                  ? "bg-indigo-500 text-white shadow-[0_0_24px_rgba(99,102,241,0.45)]"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {option === "month" ? "Monthly" : "Annual"}
            </button>
          ))}
        </div>

        <div className="mx-auto inline-flex rounded-full border border-white/10 bg-white/4 p-2 backdrop-blur-xl">
          {(["stripe", "paypal"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setProvider(option)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                provider === option
                  ? "bg-cyan-500 text-white shadow-[0_0_24px_rgba(34,211,238,0.45)]"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {option === "stripe" ? "Stripe" : "PayPal"}
            </button>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-4">
          {planOrder.map((plan, index) => {
            const config = PLAN_LIMITS[plan];
            const highlighted = plan === "pro";
            const enterprise = plan === "enterprise";
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
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-200/90">
                        {config.name}
                      </div>
                      <h2 className="mt-2 text-4xl font-bold text-white">
                        {getDisplayedPrice(plan)}
                      </h2>
                    </div>
                    {highlighted ? (
                      <span className="pricing-pill">Best fit</span>
                    ) : null}
                    {enterprise ? (
                      <span className="pricing-pill pricing-pill-dark">
                        Scale
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm leading-6 text-slate-300">
                    {config.description}
                  </p>
                </div>

                <div className="space-y-3 text-sm text-slate-300">
                  <div className="inline-flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {plan === "commands"
                      ? "One-time command pack for existing users"
                      : `${config.sites === Number.MAX_SAFE_INTEGER ? "Unlimited" : config.sites} hosted site builds`}
                  </div>
                  <div className="inline-flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {plan === "commands"
                      ? "Use any time after purchase"
                      : `${config.commands === Number.MAX_SAFE_INTEGER ? "Unlimited" : config.commands} commands per cycle`}
                  </div>
                  <div className="inline-flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {config.export
                      ? "GitHub export path included"
                      : "Hosted site delivery included"}
                  </div>
                  <div className="inline-flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {config.watermark
                      ? "Watermark stays on lower plans"
                      : "Watermark removed"}
                  </div>
                  <div className="inline-flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {plan === "commands"
                      ? "No recurring billing"
                      : cadenceCopy[cadence]}
                  </div>
                </div>

              <div className="space-y-4">
                <button
                  type="button"
                    onClick={() => handleUpgrade(plan)}
                    disabled={submitting === plan}
                    className="hero-primary-button w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting === plan
                      ? "Redirecting…"
                      : plan === "commands"
                        ? `Buy command pack (${provider})`
                        : `Choose ${config.name}`}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="text-xs leading-5 text-slate-400">
                    All sales are final and non-refundable. After checkout you
                    complete setup details before site generation starts.
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/4 p-6 text-sm leading-6 text-slate-300 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white">
            What happens next
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="font-semibold text-white">1. Secure checkout</div>
              <p className="mt-2">
                Stripe handles payment and returns you to the verified setup
                flow.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="font-semibold text-white">2. Short intake</div>
              <p className="mt-2">
                You enter your business description, industry, and style
                direction.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="font-semibold text-white">3. Hosted delivery</div>
              <p className="mt-2">
                The generator produces a live site link and stores the order for
                follow-up and support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
