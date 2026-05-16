import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, Loader2, Mic, RefreshCw, Sparkles, Square, Type, X } from "lucide-react";

import { Reveal } from "./Reveal";
import { useClickSound } from "./useClickSound";

const SAMPLE_PROMPTS = [
  "Vintage coffee shop in Brooklyn with online ordering",
  "Law firm specializing in immigration with consultations",
  "Boutique fitness studio with class schedule and trial",
  "Wedding photographer with portfolio and inquiry form",
];

type Stage = "idle" | "generating" | "preview" | "error";

type PreviewResponse = {
  ok?: boolean;
  html?: string;
  industry?: string;
  geminiCopyUsed?: boolean;
  previewsUsedToday?: number;
  dailyLimit?: number;
  error?: string;
};

// Browser SpeechRecognition shims (TypeScript doesn't ship this in lib.dom yet)
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

export const LivePreviewTeaser: React.FC = () => {
  const [mode, setMode] = useState<"voice" | "type">("type");
  const [draft, setDraft] = useState(SAMPLE_PROMPTS[0]);
  const [stage, setStage] = useState<Stage>("idle");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewMeta, setPreviewMeta] = useState<{ used: number; limit: number; gemini: boolean } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const click = useClickSound("tick");
  const ding = useClickSound("ding");
  const reduce = useReducedMotion();
  const speechAvailable = !!getSpeechCtor();

  const generate = useCallback(async () => {
    if (stage === "generating") return;
    if (draft.trim().length < 12) {
      setErrorMsg("Make the brief a bit longer — 12 characters minimum.");
      setStage("error");
      return;
    }
    ding();
    setErrorMsg("");
    setStage("generating");
    try {
      const res = await fetch("/api/preview-generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brief: draft.trim() }),
      });
      const data = (await res.json()) as PreviewResponse;
      if (!res.ok || !data.ok || !data.html) {
        setErrorMsg(data.error || "Preview generation failed. Try a different brief.");
        setStage("error");
        return;
      }
      setPreviewHtml(data.html);
      setPreviewMeta({
        used: data.previewsUsedToday || 1,
        limit: data.dailyLimit || 3,
        gemini: !!data.geminiCopyUsed,
      });
      setStage("preview");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Network error.");
      setStage("error");
    }
  }, [draft, ding, stage]);

  const stopVoice = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    setRecording(false);
  }, []);

  const startVoice = useCallback(() => {
    const Ctor = getSpeechCtor();
    if (!Ctor) {
      setErrorMsg("Voice input isn't supported in this browser. Try typing instead.");
      setStage("error");
      return;
    }
    try {
      const rec = new Ctor();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.continuous = false;
      let buffer = "";
      rec.onresult = (event) => {
        let interim = "";
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result && result[0]) {
            interim += result[0].transcript;
          }
        }
        if (interim) {
          buffer = interim;
          setDraft(interim);
        }
      };
      rec.onerror = (e) => {
        setErrorMsg(`Voice error: ${e.error || "unknown"}. Try typing instead.`);
        setStage("error");
        setRecording(false);
      };
      rec.onend = () => {
        setRecording(false);
        if (buffer.trim().length >= 12) {
          // auto-generate on stop
          window.setTimeout(() => generate(), 200);
        }
      };
      rec.start();
      recognitionRef.current = rec;
      setRecording(true);
      click();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Could not start voice input.");
      setStage("error");
    }
  }, [click, generate]);

  useEffect(() => () => stopVoice(), [stopVoice]);

  // Inject HTML into the iframe via srcdoc-equivalent
  useEffect(() => {
    if (stage !== "preview" || !previewHtml || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(previewHtml);
    doc.close();
  }, [stage, previewHtml]);

  const reset = () => {
    click();
    setStage("idle");
    setPreviewHtml("");
    setPreviewMeta(null);
    setErrorMsg("");
  };

  return (
    <section id="live-preview" className="relative px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-white/55 backdrop-blur">
              Free preview · No card
            </span>
            <h2 className="mt-6 font-display text-[clamp(2rem,4.6vw,3.4rem)] font-black leading-[1.05] tracking-tight">
              See your homepage <span className="bg-linear-to-r from-cyan-200 to-fuchsia-300 bg-clip-text text-transparent">before you pay.</span>
            </h2>
            <p className="mt-4 text-base text-white/60 sm:text-lg">
              Speak the brief or pick a sample. We&apos;ll render a sandbox preview right here. Pay only when you want to host, export, or remove the watermark.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.15} className="mt-12">
          <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-linear-to-b from-white/6 to-white/1 p-1.5 backdrop-blur-2xl">
            <div className="rounded-[22px] bg-black/60 p-6 sm:p-8 lg:p-10">
              <AnimatePresence mode="wait">
                {stage !== "preview" && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex rounded-full border border-white/10 bg-black/60 p-1">
                        {(["type", "voice"] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              click();
                              setMode(opt);
                              if (opt === "type") stopVoice();
                            }}
                            disabled={opt === "voice" && !speechAvailable}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition disabled:opacity-40 disabled:cursor-not-allowed ${
                              mode === opt ? "bg-white text-black shadow-[0_8px_24px_-8px_rgba(255,255,255,0.5)]" : "text-white/65 hover:text-white"
                            }`}
                          >
                            {opt === "type" ? <Type className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                            {opt}
                          </button>
                        ))}
                      </div>
                      <div className="text-xs text-white/40">
                        Sandbox preview · No charge · No card
                      </div>
                    </div>

                    <div className="mt-6">
                      <label htmlFor="brief" className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-200/80">
                        Business brief
                      </label>
                      <div className="relative mt-2">
                        <textarea
                          id="brief"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          rows={3}
                          className="w-full resize-none rounded-2xl border border-white/12 bg-black/60 px-5 py-4 pr-14 text-base text-white placeholder:text-white/30 outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/15 transition"
                          placeholder="Describe the business, customer, and the one action you want visitors to take."
                          maxLength={1000}
                          disabled={stage === "generating"}
                        />
                        {mode === "voice" && (
                          <button
                            type="button"
                            onClick={() => {
                              if (recording) stopVoice();
                              else startVoice();
                            }}
                            className={`absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                              recording
                                ? "border-rose-300/50 bg-rose-400/20 text-rose-100 shadow-[0_0_24px_-4px_rgba(244,63,94,0.65)]"
                                : "border-white/15 bg-white/5 text-white/75 hover:border-cyan-300/40"
                            }`}
                            aria-label={recording ? "Stop recording" : "Start recording"}
                          >
                            {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            {recording && (
                              <span className="absolute -inset-1 animate-ping rounded-full bg-rose-400/40" />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-white/35">
                        <span>{draft.length} / 1000</span>
                        {mode === "voice" && (
                          <span>{speechAvailable ? (recording ? "Listening — speak now" : "Tap mic to speak") : "Voice unsupported in this browser"}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {SAMPLE_PROMPTS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            click();
                            setDraft(s);
                          }}
                          disabled={stage === "generating"}
                          className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
                            draft === s
                              ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                              : "border-white/10 bg-white/5 text-white/55 hover:border-white/25 hover:text-white"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    {errorMsg && stage === "error" && (
                      <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-3 text-sm text-rose-100">
                        {errorMsg}
                      </div>
                    )}

                    <div className="mt-7 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={generate}
                        disabled={stage === "generating" || draft.trim().length < 12}
                        className="group inline-flex items-center gap-2 rounded-full bg-linear-to-r from-cyan-300 to-fuchsia-400 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black shadow-[0_18px_60px_-12px_rgba(34,211,238,0.55)] transition hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {stage === "generating" ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                          </>
                        ) : (
                          <>
                            Generate preview <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                          </>
                        )}
                      </button>
                      <span className="text-xs text-white/45 inline-flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-cyan-300" /> Real Gemini · ~30-45s · 3 free per day
                      </span>
                    </div>
                  </motion.div>
                )}

                {stage === "preview" && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-100">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
                        </span>
                        Preview ready{previewMeta?.gemini ? " · Gemini copy" : " · template copy"}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={reset}
                          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white/80 hover:border-white/30 hover:text-white transition"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Try another brief
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const w = window.open("", "_blank");
                            if (w) {
                              w.document.open();
                              w.document.write(previewHtml);
                              w.document.close();
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white/80 hover:border-cyan-300/40 hover:text-white transition"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-2xl border border-white/12 bg-black shadow-[0_30px_90px_-20px_rgba(0,0,0,0.7)]">
                      <iframe
                        ref={iframeRef}
                        title="Generated preview"
                        sandbox="allow-scripts allow-same-origin"
                        className="block h-[720px] w-full bg-black"
                      />
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div className="rounded-2xl border border-white/10 bg-white/4 px-5 py-3 text-sm text-white/80">
                        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-200/80">Heads up</span>
                        <p className="mt-1">
                          This is a sandbox build with our watermark. Host it, get a custom domain, and remove the watermark for $9.99/mo — cancel anytime.
                          {previewMeta && (
                            <span className="ml-1 text-white/45">
                              · {previewMeta.used}/{previewMeta.limit} free previews used today.
                            </span>
                          )}
                        </p>
                      </div>
                      <Link
                        to="/pricing"
                        onClick={() => ding()}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-cyan-300 to-fuchsia-400 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black shadow-[0_18px_60px_-12px_rgba(34,211,238,0.55)] transition hover:-translate-y-px"
                      >
                        Host it for $9.99 <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!reduce && stage === "idle" && (
              <motion.div
                aria-hidden
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="pointer-events-none absolute -right-12 -top-10 hidden h-44 w-44 rotate-6 rounded-2xl border border-white/10 bg-[url('/vtw-wallpaper.png')] bg-cover bg-center opacity-50 lg:block"
              />
            )}
          </div>
        </Reveal>
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {stage === "generating" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
          >
            <div className="pointer-events-auto inline-flex items-center gap-3 rounded-full border border-white/15 bg-black/70 px-5 py-3 text-sm text-white shadow-[0_18px_50px_-10px_rgba(0,0,0,0.7)] backdrop-blur-xl">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
              Generating your preview — usually 30 seconds.
              <button
                type="button"
                onClick={() => {
                  setStage("idle");
                }}
                className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/70 hover:text-white"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
