import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  PartyPopper,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { parseResponse } from "../lib/api";
import { motion } from "motion/react";
import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";

import { trackEvent, trackPurchase } from "@/lib/analytics";
import { Reveal } from "@/components/home/v2/Reveal";

type SessionResponse = {
  ok?: boolean;
  email?: string | null;
  plan?: string | null;
  mode?: string;
  status?: string;
  payment_status?: string;
  error?: string;
};

type OrderResponse = { id: string; status: string; error?: string };
type GenerateResponse = {
  orderId: string;
  status: string;
  siteUrl?: string;
  error?: string;
};

type Stage = "verifying" | "ready" | "creating-order" | "generating" | "done" | "error";

const industries = [
  { value: "saas", label: "SaaS / Software" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "fitness", label: "Fitness / Coaching" },
  { value: "restaurant", label: "Restaurant / Hospitality" },
  { value: "law", label: "Law Firm" },
  { value: "real-estate", label: "Real Estate" },
  { value: "medical", label: "Medical / Clinic" },
  { value: "creative", label: "Creative / Portfolio" },
  { value: "services", label: "Local Services" },
];

const styles = [
  { value: "dark-premium", label: "Dark & Premium" },
  { value: "clean-minimal", label: "Clean & Minimal" },
  { value: "bold-energetic", label: "Bold & Energetic" },
  { value: "warm-trustworthy", label: "Warm & Trustworthy" },
];

const flowSteps = [
  { label: "Payment verified", caption: "Stripe session confirmed" },
  { label: "Brief collected", caption: "Industry + style" },
  { label: "Site generated", caption: "Gemini copy + layout" },
];

const stageToStep: Record<Stage, number> = {
  verifying: 0,
  ready: 1,
  "creating-order": 2,
  generating: 2,
  done: 3,
  error: 0,
};

export const Success = () => {
  const [params] = useSearchParams();
  const sessionId = (params.get("session_id") || "").trim();
  const initialPlan = (params.get("plan") || "starter").trim().toLowerCase();
  const initialCadence =
    (params.get("cadence") || "month").trim().toLowerCase() === "year" ? "year" : "month";

  const [stage, setStage] = useState<Stage>("verifying");
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    industry: "",
    business_description: "",
    style_preference: "",
  });

  useEffect(() => {
    const storedStyle = localStorage.getItem("vtw_preview_style") || "";
    const mapped =
      storedStyle === "Minimal"
        ? "clean-minimal"
        : storedStyle === "Bold"
          ? "bold-energetic"
          : storedStyle === "Luxury"
            ? "dark-premium"
            : "";
    if (mapped) setForm((current) => ({ ...current, style_preference: mapped }));
    // pre-fill description if hero handed off a brief
    try {
      const handoff = sessionStorage.getItem("vtw_hero_brief");
      if (handoff && handoff.trim().length >= 8) {
        setForm((current) => ({ ...current, business_description: handoff.trim() }));
      }
    } catch {
      /* fine */
    }
  }, []);

  const plan = useMemo(() => session?.plan || initialPlan, [session?.plan, initialPlan]);

  useEffect(() => {
    const verify = async () => {
      if (!sessionId) {
        setError("Missing session_id. Return to pricing and start checkout again.");
        setStage("error");
        return;
      }
      try {
        const response = await fetch("/api/stripe-verify-session", {
          method: "POST",
          headers: { accept: "application/json", "content-type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data = await parseResponse<SessionResponse>(response);
        if (!response.ok) throw new Error(data.error || "Unable to verify checkout session.");
        trackEvent("checkout_completed", { provider: "stripe", plan: data.plan });
        if (data.plan && sessionId) {
          trackPurchase({ transactionId: sessionId, plan: data.plan, cadence: initialCadence });
        }
        setSession(data);
        setForm((current) => ({ ...current, email: data.email || current.email }));
        setStage("ready");
      } catch (verifyError) {
        setError(verifyError instanceof Error ? verifyError.message : "Unable to verify checkout session.");
        setStage("error");
      }
    };
    void verify();
  }, [sessionId, initialCadence]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleGenerate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSiteUrl(null);

    if (!form.email || !form.industry || !form.business_description || !form.style_preference) {
      setError("Fill in all four fields before generating your site.");
      setStage("error");
      return;
    }

    try {
      setStage("creating-order");
      const orderQuery = new URLSearchParams({
        stripe_session_id: sessionId,
        email: form.email,
        industry: form.industry,
        business_description: form.business_description,
        style_preference: form.style_preference,
        plan,
        cadence: initialCadence,
      });
      const orderResponse = await fetch(`/api/order?${orderQuery.toString()}`, { method: "POST" });
      const orderData = await parseResponse<OrderResponse>(orderResponse);
      if (!orderResponse.ok) throw new Error(orderData.error || "Unable to create the order.");

      setOrderId(orderData.id);
      trackEvent("user_onboarding_started", { plan, orderId: orderData.id });
      setStage("generating");

      const generateQuery = new URLSearchParams({ orderId: orderData.id });
      const generateResponse = await fetch(`/api/generate-site?${generateQuery.toString()}`, { method: "POST" });
      const generateData = await parseResponse<GenerateResponse>(generateResponse);
      if (!generateResponse.ok) throw new Error(generateData.error || "Unable to generate the site.");

      setSiteUrl(generateData.siteUrl || `/api/site/${orderData.id}`);
      setStage("done");
      trackEvent("site_generation_success", { orderId: orderData.id, plan });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong while generating the site.");
      setStage("error");
    }
  };

  const isWorking = stage === "verifying" || stage === "creating-order" || stage === "generating";
  const currentStep = stageToStep[stage];

  return (
    <>
      <Helmet>
        <title>Welcome aboard — VoiceToWebsite</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* HERO */}
      <section className="relative px-5 pt-28 pb-10 sm:px-8 lg:px-12 lg:pt-40">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-emerald-100">
              <ShieldCheck className="h-3 w-3" /> Payment received
            </span>
            <h1 className="mt-6 font-display text-[clamp(2.4rem,5.5vw,4.4rem)] font-black leading-[0.98] tracking-tight">
              Welcome to{" "}
              <span className="bg-linear-to-r from-cyan-200 to-fuchsia-300 bg-clip-text text-transparent">
                VoiceToWebsite.
              </span>
            </h1>
            <p className="mt-5 text-base leading-7 text-white/70 sm:text-lg">
              You're on the <strong className="capitalize text-white">{plan}</strong> plan. Three quick fields and we'll generate your hosted site in under a minute.
            </p>
          </div>
        </Reveal>
      </section>

      {/* STEPPER */}
      <section className="relative px-5 sm:px-8 lg:px-12">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <ol className="flex items-center justify-between gap-2 sm:gap-4">
              {flowSteps.map((s, i) => {
                const reached = currentStep > i;
                const active = currentStep === i + 1;
                return (
                  <li key={s.label} className="flex flex-1 items-center gap-2">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-black ${
                        reached
                          ? "border-emerald-300/60 bg-emerald-400/20 text-emerald-100"
                          : active
                            ? "border-cyan-300/70 bg-cyan-400/15 text-cyan-100"
                            : "border-white/15 bg-white/5 text-white/50"
                      }`}
                    >
                      {reached ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                          reached || active ? "text-white" : "text-white/45"
                        }`}
                      >
                        {s.label}
                      </div>
                      <div className="hidden text-[10px] text-white/45 sm:block">{s.caption}</div>
                    </div>
                    {i < flowSteps.length - 1 && (
                      <div className={`hidden h-px flex-1 ${reached ? "bg-emerald-300/40" : "bg-white/10"} sm:block`} />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </Reveal>
      </section>

      {/* STATUS + FORM CARD */}
      <section className="relative px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <Reveal>
          <div className="mx-auto max-w-3xl overflow-hidden rounded-4xl border border-white/12 bg-linear-to-b from-white/6 to-white/2 p-7 backdrop-blur-2xl sm:p-10">
            {/* Status banner */}
            <div
              role="status"
              aria-live="polite"
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                stage === "error"
                  ? "border-rose-400/40 bg-rose-500/10 text-rose-100"
                  : stage === "done"
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                    : "border-cyan-300/30 bg-cyan-400/8 text-cyan-100"
              }`}
            >
              {isWorking ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : stage === "done" ? (
                <PartyPopper className="h-4 w-4 shrink-0" />
              ) : stage === "error" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 opacity-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              )}
              <span>
                {stage === "verifying" && "Verifying your Stripe session…"}
                {stage === "ready" && "Verified. Tell us about your business below."}
                {stage === "creating-order" && "Creating your order…"}
                {stage === "generating" && "Generating your site — this usually takes 30-45 seconds."}
                {stage === "done" && "Done. Your hosted site is ready below."}
                {stage === "error" && (error || "Something went wrong.")}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">Session</div>
                <div className="mt-1 break-all font-mono text-xs text-white/80">{sessionId || "—"}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">Plan</div>
                <div className="mt-1 font-display text-lg font-black capitalize tracking-tight">{plan}</div>
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleGenerate} className="mt-8 grid gap-5">
              <label className="block">
                <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 mb-2">
                  Contact email
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:bg-black/50"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 mb-2">
                    Industry
                  </span>
                  <select
                    value={form.industry}
                    onChange={(event) => updateField("industry", event.target.value)}
                    required
                    className="w-full appearance-none rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
                  >
                    <option value="">Pick an industry</option>
                    {industries.map((industry) => (
                      <option key={industry.value} value={industry.value} className="bg-black">
                        {industry.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 mb-2">
                    Style direction
                  </span>
                  <select
                    value={form.style_preference}
                    onChange={(event) => updateField("style_preference", event.target.value)}
                    required
                    className="w-full appearance-none rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
                  >
                    <option value="">Pick a style</option>
                    {styles.map((style) => (
                      <option key={style.value} value={style.value} className="bg-black">
                        {style.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 mb-2">
                  What does your business do?
                </span>
                <textarea
                  value={form.business_description}
                  onChange={(event) => updateField("business_description", event.target.value)}
                  placeholder="What do you sell, who is it for, and what should visitors do next?"
                  required
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:bg-black/50"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={isWorking}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-cyan-300 to-fuchsia-400 px-7 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:-translate-y-px hover:shadow-[0_18px_60px_-12px_rgba(232,121,249,0.6)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {stage === "generating" ? "Generating…" : stage === "creating-order" ? "Working…" : "Generate my website"}
                  {!isWorking && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />}
                </button>
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white/85 hover:border-cyan-300/40 hover:text-white transition"
                >
                  Back to pricing
                </Link>
              </div>

              <p className="text-[10px] leading-5 text-white/45">
                All sales are final. You remain responsible for your site content, claims, and compliance with applicable law.
              </p>
            </form>

            {/* SUCCESS PANEL */}
            {siteUrl && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 overflow-hidden rounded-3xl border border-emerald-400/40 bg-linear-to-br from-emerald-400/15 to-cyan-300/10 p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-100/80">
                      Your site is live
                    </div>
                    <a
                      href={siteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2 break-all font-display text-xl font-black tracking-tight text-white underline decoration-emerald-300/40 underline-offset-4 hover:decoration-emerald-200"
                    >
                      {siteUrl}
                      <ExternalLink className="h-4 w-4 shrink-0" />
                    </a>
                    {orderId && <div className="mt-2 font-mono text-[10px] text-white/55">Order: {orderId}</div>}
                  </div>
                  <Link
                    to={`/setup?provider=stripe&plan=${encodeURIComponent(plan)}&session_id=${encodeURIComponent(sessionId)}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-black hover:-translate-y-px transition"
                  >
                    Open dashboard <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </Reveal>

        {/* WHAT'S NEXT */}
        <Reveal delay={0.1}>
          <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              { title: "Customize", body: "Open the dashboard to tweak copy, swap sections, or change colors." },
              { title: "Connect a domain", body: "Pro and Ultimate plans support custom domains in Settings → Domain." },
              { title: "Share + measure", body: "Drop your link in Google Business, social bios, and email signatures." },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl border border-white/10 bg-white/4 p-5 backdrop-blur-xl">
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/80">Next</div>
                <div className="mt-2 font-display text-lg font-black tracking-tight">{c.title}</div>
                <p className="mt-1.5 text-xs leading-5 text-white/65">{c.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>
    </>
  );
};
