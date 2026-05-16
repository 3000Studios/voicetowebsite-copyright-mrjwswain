import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, KeyRound, Loader2, Lock, ShieldCheck, Sparkles, User } from "lucide-react";

import { parseResponse } from "../lib/api";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { PLAN_LIMITS, PlanType } from "@/constants/plans";
import { trackEvent } from "@/lib/analytics";
import { Reveal } from "@/components/home/v2/Reveal";

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const onboardingSteps = [
  { label: "Sign in", caption: "Account verified" },
  { label: "Confirm details", caption: "Username + contact" },
  { label: "Open dashboard", caption: "Start building" },
];

export const Setup = () => {
  const { user, isReady, isLoggedIn } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const provider = (params.get("provider") || "stripe").toLowerCase();
  const plan = (params.get("plan") || "").toLowerCase() as PlanType;
  const sessionId = params.get("session_id") || "";

  const [username, setUsername] = useState(user?.profile?.username || user?.displayName || "");
  const [phone, setPhone] = useState("");
  const [pendingSite, setPendingSite] = useState<{
    prompt?: string;
    brief?: { businessName?: string; industry?: string; primaryCta?: string };
    variationName?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planConfig = useMemo(() => PLAN_LIMITS[plan], [plan]);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("vtw_pending_site");
      if (stored) setPendingSite(JSON.parse(stored));
    } catch {
      setPendingSite(null);
    }
  }, []);

  const verifyStripe = async () => {
    const res = await fetch("/api/stripe-verify-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await parseResponse<{ ok?: boolean; email?: string; plan?: string; error?: string }>(res);
    if (!res.ok || !data?.ok) throw new Error(data?.error || "Verification failed");
    return data as { email: string; plan: string };
  };

  const onSave = async () => {
    if (!user) return;
    if (!username.trim()) {
      setError("Pick a username so we can label your sites.");
      return;
    }
    if (!planConfig) {
      setError("Missing plan. Return to pricing and start checkout again.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (provider === "stripe") {
        const verified = await verifyStripe();
        if ((verified.email || "").toLowerCase() !== (user.email || "").toLowerCase()) {
          throw new Error("The email on this purchase doesn't match your login. Sign in with the same email used at checkout.");
        }
        if (verified.plan !== plan) {
          throw new Error("Plan mismatch. Please retry checkout from Pricing.");
        }
      } else if (provider === "paypal") {
        const paypalToken = params.get("token") || params.get("subscription_id");
        if (!paypalToken) {
          throw new Error("PayPal return token missing. Please retry checkout from Pricing.");
        }
      } else {
        throw new Error("Unknown provider. Please retry checkout from Pricing.");
      }

      const accessKey = (await sha256Hex(`${user.uid}:${provider}:${sessionId}:${plan}`))
        .slice(0, 24)
        .toUpperCase();

      if (!db) throw new Error("Firestore is not ready. Refresh and try again.");
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          username: username.trim(),
          email: user.email || "",
          phone: phone.trim(),
          plan,
          tokens:
            planConfig.commandsPerCycle === Number.MAX_SAFE_INTEGER
              ? 999999
              : planConfig.commandsPerCycle,
          accessKey,
          pendingSitePrompt: pendingSite?.prompt || "",
          pendingSiteBusinessName: pendingSite?.brief?.businessName || "",
          pendingSiteVariation: pendingSite?.variationName || "",
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      trackEvent("user_onboarding_completed", { plan, provider });
      navigate("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Setup failed");
    } finally {
      setSaving(false);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-32">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <section className="relative px-5 pt-28 pb-20 sm:px-8 lg:px-12 lg:pt-44 lg:pb-32">
        <Reveal>
          <div className="mx-auto max-w-2xl rounded-4xl border border-white/12 bg-linear-to-b from-white/6 to-white/2 p-10 text-center backdrop-blur-2xl sm:p-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-amber-100">
              <Lock className="h-3 w-3" /> One step left
            </span>
            <h1 className="mt-6 font-display text-[clamp(2.2rem,5vw,3.6rem)] font-black leading-[1.02] tracking-tight">
              Sign in to attach your subscription.
            </h1>
            <p className="mt-4 text-base leading-7 text-white/65">
              Use the same email you paid with so we can link your{" "}
              <strong className="capitalize text-white">{plan || "new"}</strong> plan to your account.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to={`/signin?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-cyan-300 to-fuchsia-400 px-7 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:-translate-y-px hover:shadow-[0_18px_60px_-15px_rgba(232,121,249,0.5)]"
              >
                Sign in <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white/85 hover:border-cyan-300/40 hover:text-white transition"
              >
                Back to pricing
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    );
  }

  const currentStep = 1; // signed in, on the confirm-details step

  return (
    <>
      {/* HERO */}
      <section className="relative px-5 pt-28 pb-8 sm:px-8 lg:px-12 lg:pt-40">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/8 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-100">
              <ShieldCheck className="h-3 w-3" /> Almost there
            </span>
            <h1 className="mt-6 font-display text-[clamp(2.4rem,5.5vw,4.4rem)] font-black leading-[0.98] tracking-tight">
              Confirm your details to{" "}
              <span className="bg-linear-to-r from-cyan-200 to-fuchsia-300 bg-clip-text text-transparent">
                unlock your dashboard.
              </span>
            </h1>
            <p className="mt-5 text-base leading-7 text-white/65 sm:text-lg">
              You're on the <strong className="capitalize text-white">{planConfig?.name || plan}</strong> plan. We bind your purchase to your login and generate a private access key.
            </p>
          </div>
        </Reveal>
      </section>

      {/* STEPPER */}
      <section className="relative px-5 sm:px-8 lg:px-12">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <ol className="flex items-center justify-between gap-2 sm:gap-4">
              {onboardingSteps.map((s, i) => {
                const reached = currentStep > i;
                const active = currentStep === i;
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
                      <div className={`text-[11px] font-bold uppercase tracking-[0.18em] ${reached || active ? "text-white" : "text-white/45"}`}>
                        {s.label}
                      </div>
                      <div className="hidden text-[10px] text-white/45 sm:block">{s.caption}</div>
                    </div>
                    {i < onboardingSteps.length - 1 && (
                      <div className={`hidden h-px flex-1 ${reached ? "bg-emerald-300/40" : "bg-white/10"} sm:block`} />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </Reveal>
      </section>

      {/* CARD */}
      <section className="relative px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <Reveal>
          <div className="mx-auto max-w-2xl overflow-hidden rounded-4xl border border-white/12 bg-linear-to-b from-white/6 to-white/2 p-7 backdrop-blur-2xl sm:p-10">
            {/* Plan summary */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">Plan</div>
                <div className="mt-1 font-display text-lg font-black tracking-tight">{planConfig?.name || plan || "—"}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">Provider</div>
                <div className="mt-1 font-display text-lg font-black tracking-tight capitalize">{provider}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">Commands / cycle</div>
                <div className="mt-1 font-display text-lg font-black tracking-tight">
                  {planConfig?.commandsPerCycle === Number.MAX_SAFE_INTEGER ? "Unlimited" : planConfig?.commandsPerCycle ?? "—"}
                </div>
              </div>
            </div>

            {planConfig?.description && (
              <p className="mt-5 text-sm leading-6 text-white/65">{planConfig.description}</p>
            )}

            {/* Form */}
            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 mb-2">
                  Username
                </span>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden="true" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="w-full rounded-2xl border border-white/12 bg-black/40 pl-11 pr-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:bg-black/50"
                    placeholder="your-handle"
                  />
                </div>
              </label>

              <label className="block">
                <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 mb-2">
                  Phone <span className="font-normal normal-case tracking-normal text-white/35">(optional)</span>
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  className="w-full rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:bg-black/50"
                  placeholder="+1 (555) 000-0000"
                />
              </label>

              {pendingSite && (
                <div className="rounded-2xl border border-cyan-300/30 bg-cyan-400/8 p-5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/80">Carrying over your preview</div>
                  <div className="mt-2 font-display text-lg font-black tracking-tight">
                    {pendingSite.brief?.businessName || "Generated site"}
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    {pendingSite.brief?.industry || "custom"} · {pendingSite.variationName || "variation"} · {pendingSite.brief?.primaryCta || "primary CTA"}
                  </div>
                  {pendingSite.prompt && (
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/50">{pendingSite.prompt}</p>
                  )}
                </div>
              )}

              {error && (
                <div role="alert" className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={() => !saving && onSave()}
                disabled={saving}
                className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-cyan-300 to-fuchsia-400 px-7 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:-translate-y-px hover:shadow-[0_18px_60px_-12px_rgba(232,121,249,0.6)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Finalizing…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Enter dashboard
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
                <KeyRound className="h-3 w-3" /> Binds purchase to login · generates access key
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
};
