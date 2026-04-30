import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";

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

type Stage =
  | "verifying"
  | "ready"
  | "creating-order"
  | "generating"
  | "done"
  | "error";

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

export const Success = () => {
  const [params] = useSearchParams();
  const sessionId = (params.get("session_id") || "").trim();
  const initialPlan = (params.get("plan") || "starter").trim().toLowerCase();
  const initialCadence =
    (params.get("cadence") || "month").trim().toLowerCase() === "year"
      ? "year"
      : "month";
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

  const plan = useMemo(
    () => session?.plan || initialPlan,
    [session?.plan, initialPlan],
  );

  useEffect(() => {
    const verify = async () => {
      if (!sessionId) {
        setError(
          "Missing session_id. Return to pricing and start checkout again.",
        );
        setStage("error");
        return;
      }

      try {
        const response = await fetch("/api/stripe-verify-session", {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data = (await response.json()) as SessionResponse;
        if (!response.ok)
          throw new Error(data.error || "Unable to verify checkout session.");

        setSession(data);
        setForm((current) => ({
          ...current,
          email: data.email || current.email,
        }));
        setStage("ready");
      } catch (verifyError) {
        setError(
          verifyError instanceof Error
            ? verifyError.message
            : "Unable to verify checkout session.",
        );
        setStage("error");
      }
    };

    void verify();
  }, [sessionId]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleGenerate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSiteUrl(null);

    if (
      !form.email ||
      !form.industry ||
      !form.business_description ||
      !form.style_preference
    ) {
      setError("Complete all four fields before generating your site.");
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
        launch_discount: "true",
      });
      const orderResponse = await fetch(`/api/order?${orderQuery.toString()}`, {
        method: "POST",
      });
      const orderData = (await orderResponse.json()) as OrderResponse;
      if (!orderResponse.ok)
        throw new Error(orderData.error || "Unable to create the order.");

      setOrderId(orderData.id);
      setStage("generating");

      const generateQuery = new URLSearchParams({ orderId: orderData.id });
      const generateResponse = await fetch(
        `/api/generate-site?${generateQuery.toString()}`,
        { method: "POST" },
      );
      const generateData = (await generateResponse.json()) as GenerateResponse;
      if (!generateResponse.ok)
        throw new Error(generateData.error || "Unable to generate the site.");

      setSiteUrl(generateData.siteUrl || `/api/site/${orderData.id}`);
      setStage("done");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while generating the site.",
      );
      setStage("error");
    }
  };

  const statusContent = {
    verifying: "Verifying your Stripe session…",
    ready: "Verified. Complete the setup details to start generation.",
    "creating-order": "Creating your order record…",
    generating: "Generating your site…",
    done: "Done. Your hosted site link is ready.",
    error: error || "Something went wrong.",
  };

  return (
    <div className="section-shell pt-14">
      <Helmet>
        <title>Checkout success — VoiceToWebsite</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="content-grid gap-10 lg:max-w-5xl">
        <div className="mx-auto w-full max-w-4xl rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_35px_120px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-8">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Post-purchase setup
            </div>

            <div className="space-y-3">
              <h1 className="section-title max-w-3xl">
                Payment received. Now we build your site.
              </h1>
              <p className="section-copy max-w-2xl">
                This page verifies your checkout, collects your business
                details, and generates your hosted starter site link.
              </p>
            </div>

            <div
              className={`rounded-3xl border px-4 py-4 text-sm ${stage === "error" ? "border-rose-400/30 bg-rose-400/10 text-rose-100" : stage === "done" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-50" : "border-white/10 bg-slate-950/60 text-slate-200"}`}
            >
              <div className="flex items-center gap-3">
                {stage === "verifying" ||
                stage === "creating-order" ||
                stage === "generating" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin text-indigo-300" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                )}
                <span>{statusContent[stage]}</span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Session
                </div>
                <div className="mt-2 break-all font-mono text-xs text-slate-200">
                  {sessionId || "missing"}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Plan
                </div>
                <div className="mt-2 text-base font-semibold capitalize text-white">
                  {plan}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="mt-8 grid gap-5">
            <label className="form-field">
              <span>Contact email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
                className="site-input"
              />
            </label>

            <label className="form-field">
              <span>Industry</span>
              <select
                value={form.industry}
                onChange={(event) =>
                  updateField("industry", event.target.value)
                }
                required
                className="site-input"
              >
                <option value="">Select an industry</option>
                {industries.map((industry) => (
                  <option key={industry.value} value={industry.value}>
                    {industry.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Business description</span>
              <textarea
                value={form.business_description}
                onChange={(event) =>
                  updateField("business_description", event.target.value)
                }
                placeholder="What do you sell, who is it for, and what should visitors do next?"
                required
                className="site-input min-h-32"
              />
            </label>

            <label className="form-field">
              <span>Style direction</span>
              <select
                value={form.style_preference}
                onChange={(event) =>
                  updateField("style_preference", event.target.value)
                }
                required
                className="site-input"
              >
                <option value="">Choose a style</option>
                {styles.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={
                  stage === "verifying" ||
                  stage === "creating-order" ||
                  stage === "generating"
                }
                className="hero-primary-button disabled:cursor-not-allowed disabled:opacity-60"
              >
                {stage === "creating-order" || stage === "generating"
                  ? "Working…"
                  : "Generate my website"}
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                to="/pricing"
                className="hero-secondary-button justify-center"
              >
                Back to pricing
              </Link>
            </div>

            <p className="text-xs leading-5 text-slate-400">
              All sales are final and non-refundable. You remain responsible for
              your site content, claims, and compliance.
            </p>
          </form>

          {siteUrl ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-[28px] border border-emerald-400/30 bg-emerald-400/10 p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100/80">
                    Your site is ready
                  </div>
                  <a
                    href={siteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-white underline decoration-emerald-300/40 underline-offset-4"
                  >
                    {siteUrl}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  {orderId ? (
                    <div className="mt-2 text-xs text-emerald-50/80">
                      Order ID: {orderId}
                    </div>
                  ) : null}
                </div>
                <Link
                  to={`/setup?provider=stripe&plan=${encodeURIComponent(plan)}&session_id=${encodeURIComponent(sessionId)}`}
                  className="hero-secondary-button justify-center border-emerald-300/30 text-emerald-50 hover:border-emerald-200/60"
                >
                  Continue to dashboard setup
                </Link>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
