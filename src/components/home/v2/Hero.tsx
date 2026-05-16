import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, Mic, MicOff, Sparkles, Square } from "lucide-react";

import { useClickSound } from "./useClickSound";

const ROTATING_VERBS = ["Speak it.", "Describe it.", "Imagine it.", "Whisper it.", "Pitch it."];

const SAMPLE_PROMPTS = [
  "Vintage coffee shop in Brooklyn with online ordering",
  "Immigration law firm with consultation booking",
  "Boutique fitness studio with class schedule",
  "Wedding photographer with portfolio + inquiry form",
  "Mobile dog grooming serving Atlanta suburbs",
];

// Browser SpeechRecognition shims (TypeScript doesn't ship this in lib.dom)
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
interface SpeechRecognitionCtor {
  new (): SpeechRecognitionLike;
}
function getSpeechCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export const Hero: React.FC = () => {
  const reduce = useReducedMotion();
  const click = useClickSound("ding");
  const tick = useClickSound("tick");
  const navigate = useNavigate();

  const [verbIdx, setVerbIdx] = useState(0);
  const [draft, setDraft] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [speechErr, setSpeechErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const speechAvailable = !!getSpeechCtor();

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setVerbIdx((i) => (i + 1) % ROTATING_VERBS.length), 2200);
    return () => window.clearInterval(id);
  }, [reduce]);

  // Rotating placeholder when input is empty
  useEffect(() => {
    if (draft) return;
    const id = window.setInterval(() => setPlaceholderIdx((i) => (i + 1) % SAMPLE_PROMPTS.length), 3500);
    return () => window.clearInterval(id);
  }, [draft]);

  const startRecording = useCallback(() => {
    const Ctor = getSpeechCtor();
    if (!Ctor) {
      setSpeechErr("Voice input needs Chrome, Edge, or Safari. Type your brief instead.");
      return;
    }
    setSpeechErr(null);
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const text = last?.[0]?.transcript || "";
      setDraft(text.trim());
    };
    rec.onerror = (e) => {
      setSpeechErr(e.error === "not-allowed" ? "Microphone permission denied." : "Voice input stopped.");
      setRecording(false);
    };
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    try {
      rec.start();
      setRecording(true);
      tick();
    } catch {
      setSpeechErr("Could not start recording.");
    }
  }, [tick]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setRecording(false);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (submitting) return;
    const brief = draft.trim() || SAMPLE_PROMPTS[placeholderIdx];
    if (brief.length < 8) {
      setSpeechErr("Make the brief a bit longer — at least 8 characters.");
      return;
    }
    click();
    setSubmitting(true);
    // Stash for the live-preview section to pick up + scroll there
    try {
      sessionStorage.setItem("vtw_hero_brief", brief);
    } catch {
      /* fine */
    }
    const target = document.getElementById("live-preview");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      // give the user a moment to see the scroll before re-enabling
      window.setTimeout(() => setSubmitting(false), 800);
    } else {
      navigate(`/pricing?brief=${encodeURIComponent(brief)}`);
    }
  };

  const useSample = () => {
    setDraft(SAMPLE_PROMPTS[placeholderIdx]);
    inputRef.current?.focus();
    tick();
  };

  return (
    <section
      className="relative isolate overflow-hidden px-5 pt-28 pb-20 sm:px-8 lg:px-12 lg:pt-44 lg:pb-28"
      aria-labelledby="hero-headline"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-px h-24 bg-linear-to-b from-cyan-300/10 to-transparent" />

      <div className="mx-auto max-w-5xl text-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200 backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5" /> Gemini-powered. 60-second build.
        </motion.div>

        <motion.h1
          id="hero-headline"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-7 max-w-4xl font-display text-[clamp(2.8rem,7vw,5.6rem)] font-black leading-[0.92] tracking-tight"
        >
          <span className="block">
            <AnimatePresence mode="wait">
              <motion.span
                key={ROTATING_VERBS[verbIdx]}
                initial={reduce ? false : { opacity: 0, y: 12, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0)" }}
                exit={reduce ? undefined : { opacity: 0, y: -12, filter: "blur(8px)" }}
                transition={{ duration: 0.5 }}
                className="inline-block bg-linear-to-r from-cyan-200 via-cyan-300 to-fuchsia-300 bg-clip-text text-transparent"
              >
                {ROTATING_VERBS[verbIdx]}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="mt-3 block text-white/95">We ship the website.</span>
        </motion.h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8"
        >
          Speak a 60-second business brief. Get a hosted, mobile-ready homepage with real Gemini copy in under a minute. From $9.99/month.
        </motion.p>

        {/* VOICE-FIRST INPUT */}
        <motion.form
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onSubmit={handleSubmit}
          className="relative mx-auto mt-10 max-w-3xl"
        >
          <div className="absolute -inset-px rounded-4xl bg-linear-to-r from-cyan-300/40 via-fuchsia-400/40 to-cyan-300/40 opacity-60 blur-md motion-reduce:hidden" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-4xl border border-white/15 bg-black/55 p-2 backdrop-blur-2xl shadow-[0_30px_120px_-20px_rgba(34,211,238,0.35)]">
            <div className="flex items-start gap-2 rounded-3xl bg-black/40 p-3 sm:p-4">
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                aria-label={recording ? "Stop voice input" : "Start voice input"}
                aria-pressed={recording}
                disabled={!speechAvailable}
                title={speechAvailable ? "Speak your brief" : "Voice input requires Chrome, Edge, or Safari"}
                className={`group relative shrink-0 inline-flex h-14 w-14 items-center justify-center rounded-2xl border transition ${
                  recording
                    ? "border-rose-300/50 bg-rose-500/15 text-rose-100"
                    : "border-white/15 bg-linear-to-br from-cyan-300/30 to-fuchsia-400/30 text-white hover:border-cyan-300/60"
                } ${!speechAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {recording ? (
                  <>
                    <span className="absolute inset-0 rounded-2xl border-2 border-rose-300/60 motion-reduce:hidden animate-ping" />
                    <Square className="h-5 w-5 fill-current" />
                  </>
                ) : speechAvailable ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </button>
              <label htmlFor="hero-brief" className="sr-only">
                Describe your business
              </label>
              <textarea
                id="hero-brief"
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                rows={2}
                placeholder={recording ? "Listening…" : SAMPLE_PROMPTS[placeholderIdx]}
                className="min-h-14 w-full resize-none rounded-2xl bg-transparent px-2 py-3 text-left text-base leading-6 text-white placeholder:text-white/40 outline-none sm:text-lg"
              />
              <button
                type="submit"
                disabled={submitting}
                className="group hidden shrink-0 sm:inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-cyan-300 to-fuchsia-400 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:-translate-y-px hover:shadow-[0_18px_60px_-12px_rgba(34,211,238,0.6)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />}
                {submitting ? "Building" : "Build it"}
              </button>
            </div>
            {/* mobile submit + helper row */}
            <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-1">
              <button
                type="button"
                onClick={useSample}
                className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45 hover:text-cyan-200 transition"
              >
                Try: "{SAMPLE_PROMPTS[placeholderIdx].slice(0, 32)}…"
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="sm:hidden inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-300 to-fuchsia-400 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-black"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                {submitting ? "Building" : "Build"}
              </button>
            </div>
          </div>
          {speechErr && (
            <p role="alert" className="mt-3 text-center text-xs text-rose-200">{speechErr}</p>
          )}
        </motion.form>

        {/* Secondary CTAs + trust */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs"
        >
          <Link
            to="/pricing"
            onClick={() => tick()}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-4 py-2 font-bold uppercase tracking-[0.22em] text-white/85 hover:border-cyan-300/40 hover:text-white transition"
          >
            See pricing <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            to="/examples"
            onClick={() => tick()}
            className="text-xs font-bold uppercase tracking-[0.22em] text-white/55 hover:text-cyan-200 transition"
          >
            See built examples
          </Link>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.85 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[10px] uppercase tracking-[0.28em] text-white/45"
        >
          <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Stripe secured</span>
          <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> Hosted on Cloudflare</span>
          <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-fuchsia-300" /> Mobile-first build</span>
          <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Cancel anytime</span>
        </motion.div>
      </div>
    </section>
  );
};
