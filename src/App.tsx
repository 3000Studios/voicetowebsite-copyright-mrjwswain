import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BACKGROUND_TUNNEL, INTRO_SONG, INTRO_VIDEO, NAV_LINKS } from "./constants";
import { NavigationLink } from "./types";
import { audioEngine } from "./services/audioEngine";
import WarpTunnel from "./components/WarpTunnel";
import AudioWaveform from "./components/AudioWaveform";
import siteConfig from "./site-config.json";

const SEEN_KEY = "vtw-v2-seen";
const AUDIO_OPTOUT_KEY = "vtw-audio-optout";

const hasSeenV2 = () => {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch (_) {
    return false;
  }
};

const markSeenV2 = () => {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch (_) {}
};

const hasAudioOptedOut = () => {
  try {
    return localStorage.getItem(AUDIO_OPTOUT_KEY) === "1";
  } catch (_) {
    return false;
  }
};

const setAudioOptOut = (optOut: boolean) => {
  try {
    if (optOut) localStorage.setItem(AUDIO_OPTOUT_KEY, "1");
    else localStorage.removeItem(AUDIO_OPTOUT_KEY);
  } catch (_) {}
};

const buildInstantOutline = (prompt: string) => {
  const text = (prompt || "").trim();
  const lower = text.toLowerCase();

  const sections = [
    "Hero + CTA",
    "How it works (5 steps)",
    "Use cases (tabs)",
    "Feature blocks",
    "Social proof",
    "Pricing preview",
    "FAQ",
    "Footer (Trust + Status)",
  ];

  if (lower.includes("booking")) sections.splice(2, 0, "Booking + availability");
  if (lower.includes("portfolio") || lower.includes("gallery")) sections.splice(2, 0, "Portfolio / reel");
  if (lower.includes("ecommerce") || lower.includes("store")) sections.splice(2, 0, "Products + bundles");
  if (lower.includes("blog")) sections.splice(6, 0, "Blog hub (topic clusters)");

  return {
    title: text ? `Preview: ${text}` : "Preview (instant)",
    sections,
  };
};

const App: React.FC = () => {
  const copy = siteConfig?.copy;

  const seen = hasSeenV2();
  const [phase, setPhase] = useState<"opener" | "site">(seen ? "site" : "opener");
  const [openerCollapsed, setOpenerCollapsed] = useState(seen);
  const [showBumper, setShowBumper] = useState(seen);
  const [isWarping, setIsWarping] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const [tryPrompt, setTryPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [demoCategory, setDemoCategory] = useState<"saas" | "local" | "ecommerce" | "creator" | "portfolio" | "agency">(
    "saas"
  );
  const [demoTone, setDemoTone] = useState<"default" | "luxury" | "bold" | "playful" | "minimal">("default");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [generatedSiteId, setGeneratedSiteId] = useState("");
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState("");
  const [generatedLayout, setGeneratedLayout] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);

  const reduceMotion = useReducedMotion();

  const [activeUseCase, setActiveUseCase] = useState<"creators" | "agencies" | "local" | "ecommerce" | "wordpress">(
    "creators"
  );

  const secretTapRef = useRef<number[]>([]);
  const handleSecretTap = () => {
    const now = Date.now();
    const taps = secretTapRef.current.filter((t) => now - t < 1500);
    taps.push(now);
    secretTapRef.current = taps;
    if (taps.length >= 6) window.location.href = "/the3000.html";
  };

  useEffect(() => {
    if (!showBumper) return;
    const timer = window.setTimeout(() => setShowBumper(false), 1400);
    return () => window.clearTimeout(timer);
  }, [showBumper]);

  useEffect(() => {
    try {
      document.documentElement.dataset.vtwPhase = phase;
    } catch (_) {}
    return () => {
      try {
        delete document.documentElement.dataset.vtwPhase;
      } catch (_) {}
    };
  }, [phase]);

  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    if (hasAudioOptedOut()) return;

    let disposed = false;
    let removeUnlockListeners = () => {};
    let starting = false;

    const tryStart = async () => {
      if (starting) return false;
      starting = true;
      await audioEngine.enable();
      const ok = await audioEngine.playMusic(INTRO_SONG);
      starting = false;
      if (disposed) return ok;
      if (ok) setIsAudioPlaying(true);
      return ok;
    };

    tryStart().then((ok) => {
      if (disposed) return;
      if (ok) return;

      const onGesture = () => {
        tryStart().then((ok2) => {
          if (ok2) removeUnlockListeners();
        });
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") onGesture();
      };

      window.addEventListener("pointerdown", onGesture, { capture: true });
      window.addEventListener("keydown", onKeyDown, { capture: true });
      removeUnlockListeners = () => {
        window.removeEventListener("pointerdown", onGesture, true);
        window.removeEventListener("keydown", onKeyDown, true);
      };
    });

    return () => {
      disposed = true;
      removeUnlockListeners();
    };
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join("");
      setTryPrompt(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (_) {}
    };
  }, []);

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (!isListening) {
      setIsListening(true);
      try {
        recognition.start();
      } catch (_) {}
      return;
    }
    try {
      recognition.stop();
    } catch (_) {}
  };

  useEffect(() => {
    // Detect admin session to enable admin-only actions like publishing.
    fetch("/api/config/status")
      .then((res) => setIsAdmin(res.ok))
      .catch(() => setIsAdmin(false));
  }, []);

  const generateSitePreview = async (overridePrompt?: string) => {
    const prompt = String(overridePrompt ?? tryPrompt).trim();
    if (!prompt) {
      setGenerateError("Add a prompt first (voice or typing).");
      return;
    }
    if (overridePrompt) setTryPrompt(prompt);
    setIsGenerating(true);
    setGenerateError("");
    setPublishResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tone: demoTone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Generate failed (HTTP ${res.status})`);
      setGeneratedSiteId(String(data?.siteId || ""));
      setGeneratedPreviewUrl(String(data?.previewUrl || ""));
      setGeneratedLayout(data?.layout || null);
    } catch (err: any) {
      setGenerateError(err?.message || "Generate failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const runInstantDemo = async () => {
    const fallback = demoPresets[demoCategory].chips[0] || demoPresets[demoCategory].placeholder;
    await generateSitePreview(fallback);
  };

  const publishGenerated = async () => {
    if (!generatedSiteId) return;
    setIsPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: generatedSiteId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Publish failed (HTTP ${res.status})`);
      setPublishResult(data);
    } catch (err: any) {
      setPublishResult({ error: err?.message || "Publish failed." });
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleAudio = async () => {
    await audioEngine.enable();
    if (isAudioPlaying) {
      audioEngine.stopMusic();
      setIsAudioPlaying(false);
      setAudioOptOut(true);
      return;
    }
    setAudioOptOut(false);
    const ok = await audioEngine.playMusic(INTRO_SONG);
    setIsAudioPlaying(ok);
  };

  const enterSite = () => {
    markSeenV2();
    setOpenerCollapsed(true);
    setPhase("site");
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" && event.key !== " ") return;

      if (phase === "opener" && !openerCollapsed) {
        event.preventDefault();
        enterSite();
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (phase !== "opener" || openerCollapsed) return;
      if (event.deltaY > 0) enterSite();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel as any);
    };
  }, [phase, openerCollapsed]);

  const handleTileClick = (link: NavigationLink) => {
    markSeenV2();
    audioEngine.playImpact();
    if (reduceMotion) {
      window.location.href = link.url;
      return;
    }
    setTimeout(() => {
      audioEngine.playSwoosh();
      setIsWarping(true);
      audioEngine.playWarp();
    }, 220);
    setTimeout(() => {
      window.location.href = link.url;
    }, 1100);
  };

  const preview = useMemo(() => buildInstantOutline(tryPrompt), [tryPrompt]);

  const useCases = {
    creators: {
      label: "Creators",
      prompt: "Build a creator portfolio with a reel section and email capture.",
      bullets: ["Publish faster", "Capture emails", "Monetize content"],
      template: "Creator Portfolio",
      integration: "YouTube + Newsletter",
    },
    agencies: {
      label: "Agencies",
      prompt: "Create an agency homepage with services, case studies, and a contact form.",
      bullets: ["Ship client sites", "Reuse templates", "Reduce revisions"],
      template: "Agency Landing",
      integration: "CRM + Scheduling",
    },
    local: {
      label: "Local",
      prompt: "Create a landing page for a barber shop with booking and pricing.",
      bullets: ["Rank locally", "Drive calls", "Book appointments"],
      template: "Local Service",
      integration: "Maps + Booking",
    },
    ecommerce: {
      label: "Ecommerce",
      prompt: "Design an ecommerce storefront with bundles, reviews, and FAQs.",
      bullets: ["Bundles + upsells", "Fast pages", "Trust-first checkout"],
      template: "Storefront",
      integration: "Stripe + PayPal",
    },
    wordpress: {
      label: "WordPress",
      prompt: "Create a WordPress migration landing page with SEO checklist and pricing.",
      bullets: ["Migration plan", "SEO cleanup", "Performance lift"],
      template: "WP Migration",
      integration: "Analytics + Redirects",
    },
  } as const;

  const demoPresets: Record<typeof demoCategory, { label: string; placeholder: string; chips: string[] }> = {
    saas: {
      label: "SaaS",
      placeholder: "Build a landing page for an AI customer support tool with pricing, FAQ, and integrations...",
      chips: ["B2B SaaS landing with pricing", "Add integrations + security", "Make it minimal and fast"],
    },
    local: {
      label: "Local",
      placeholder: "Create a website for a mobile car wash with booking, pricing, and service areas...",
      chips: ["Mobile car wash + booking", "Add service areas + reviews", "Make it bold and conversion-first"],
    },
    ecommerce: {
      label: "Ecommerce",
      placeholder: "Create a storefront for premium coffee beans with bundles, subscriptions, and FAQs...",
      chips: ["Coffee store + bundles", "Add subscriptions + upsells", "Make it luxury black + gold"],
    },
    creator: {
      label: "Creator",
      placeholder: "Build a creator homepage with a reel, newsletter capture, and brand partnerships...",
      chips: ["Creator reel + newsletter", "Add brand kit + partnerships", "Make it playful neon"],
    },
    portfolio: {
      label: "Portfolio",
      placeholder: "Create a portfolio for a UI designer with case studies and a contact form...",
      chips: ["Designer portfolio + case studies", "Add testimonials + process", "Make it clean and minimal"],
    },
    agency: {
      label: "Agency",
      placeholder: "Create an agency homepage with services, case studies, and an inquiry form...",
      chips: ["Agency + services + case studies", "Add lead magnet + booking", "Make it bold and premium"],
    },
  };

  const active = useCases[activeUseCase];

  const seedDemoPrompt = (prompt: string) => {
    setTryPrompt(prompt);
    try {
      localStorage.setItem("vtw-demo-prefill", JSON.stringify({ prompt, ts: Date.now() }));
    } catch (_) {}
  };

  return (
    <div className="relative min-h-screen bg-black select-none overflow-x-hidden">
      <WarpTunnel isVisible={!reduceMotion && isWarping} />

      {/* Background atmosphere */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-20 brightness-50">
          <source src={BACKGROUND_TUNNEL} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-black" />
      </div>

      {/* Returning visitor bumper */}
      <AnimatePresence>
        {showBumper && phase === "site" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[220] grid place-items-center bg-black/80 backdrop-blur-md"
          >
            <div className="text-center px-6">
              <div className="font-orbitron tracking-[0.5em] text-white/70 text-xs">VOICETOWEBSITE</div>
              <div className="mt-5 grid place-items-center" aria-hidden="true">
                <AudioWaveform active={isAudioPlaying} mode="bumper" className="vt-waveform vt-waveform-bumper" />
              </div>
              <div className="mt-5 text-white/40 text-sm">Systems nominal</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent audio control */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-16 right-4 z-[160] flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-full shadow-2xl"
      >
        <button
          type="button"
          onClick={toggleAudio}
          className="flex items-center gap-2"
          aria-label={isAudioPlaying ? "Stop soundtrack" : "Play soundtrack"}
        >
          <div className={`w-2.5 h-2.5 rounded-full ${isAudioPlaying ? "bg-cyan-400 animate-pulse" : "bg-white/20"}`} />
          <span className="font-orbitron text-[10px] tracking-[0.2em] text-white/60 uppercase whitespace-nowrap">
            {isAudioPlaying ? "SOUND ON" : "SOUND OFF"}
          </span>
        </button>
        <input
          aria-label="Soundtrack volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-20 accent-white h-1 bg-white/20 rounded-lg appearance-none"
        />
      </motion.div>

      {/* Hidden 3000 entry */}
      <button
        type="button"
        onClick={handleSecretTap}
        aria-label="Open 3000 portal"
        className="fixed top-3 left-3 z-[160] h-8 w-8 rounded-full border border-white/10 bg-white/5 opacity-0 backdrop-blur-md transition-opacity hover:opacity-25 focus:opacity-40"
      >
        <span className="sr-only">3000</span>
      </button>

      {/* Opener / hero */}
      <motion.section
        id="opener"
        className="relative z-10 w-full overflow-hidden"
        animate={{ minHeight: openerCollapsed ? 520 : "100vh" }}
        transition={{ duration: 0.9, ease: "circInOut" }}
      >
        <div className="absolute inset-0 z-0 pointer-events-none">
          <video
            autoPlay
            muted
            loop
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-700 ${openerCollapsed ? "opacity-20" : "opacity-40"}`}
          >
            <source src={INTRO_VIDEO} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
        </div>

        {!openerCollapsed && (
          <button
            type="button"
            onClick={enterSite}
            className="fixed top-28 right-4 z-[170] px-4 py-2 rounded-full border border-white/15 bg-black/40 backdrop-blur-md text-white/80 hover:text-white hover:border-white/30 transition"
          >
            Skip intro (Esc / Space)
          </button>
        )}

        <div className="relative z-10 w-full">
          <AnimatePresence mode="wait" initial={false}>
            {!openerCollapsed ? (
              <motion.div
                key="opener"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, clipPath: "circle(140% at 50% 50%)" }}
                animate={
                  reduceMotion
                    ? { opacity: 1, transition: { duration: 0.35 } }
                    : {
                        opacity: 1,
                        y: 0,
                        clipPath: "circle(140% at 50% 50%)",
                        transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
                      }
                }
                exit={
                  reduceMotion
                    ? { opacity: 0, transition: { duration: 0.2 } }
                    : {
                        opacity: 0,
                        y: -8,
                        clipPath: "circle(0% at 50% 18%)",
                        transition: { duration: 0.85, ease: [0.65, 0, 0.35, 1] },
                      }
                }
              >
                <div className="relative w-full h-screen overflow-hidden">
                  <div className="absolute inset-0 flex md:grid md:grid-cols-5 overflow-x-auto md:overflow-hidden snap-x snap-mandatory">
                    {NAV_LINKS.map((link) => (
                      <button
                        key={link.id}
                        type="button"
                        onClick={() => handleTileClick(link)}
                        className="relative h-full w-screen md:w-full flex-shrink-0 md:flex-shrink border-r border-white/10 overflow-hidden group snap-center"
                        aria-label={`Open ${link.label}`}
                      >
                        <video muted loop playsInline autoPlay className="absolute inset-0 w-full h-full object-cover">
                          <source src={link.videoUrl} type="video/mp4" />
                        </video>
                        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/70 to-black" />
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500"
                          style={{ background: link.themeColor }}
                          aria-hidden="true"
                        />
                        <div className="relative z-10 h-full w-full grid place-items-center text-center px-7 md:px-5">
                          <div>
                            <div className="font-orbitron text-[11px] md:text-[10px] tracking-[0.5em] text-white/75 uppercase">
                              {link.label}
                            </div>
                            <p className="mt-5 text-white/60 text-base md:text-sm leading-relaxed max-w-[22rem] mx-auto">
                              {link.description}
                            </p>
                            <div className="mt-8 inline-flex items-center justify-center gap-2 text-white/70 text-xs uppercase tracking-[0.35em]">
                              Enter <span aria-hidden="true">&rarr;</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
                    <div className="font-orbitron text-[11px] tracking-[0.5em] text-white/60 uppercase">
                      Voice-first web engineering
                    </div>
                    <h1 className="mt-5 vtw-metallic-heading font-orbitron font-black text-3xl md:text-6xl tracking-[0.18em] uppercase">
                      Voice To Website
                    </h1>
                    <p className="mt-6 text-white/65 text-base md:text-lg max-w-2xl leading-relaxed">
                      Click a panel to enter. Press Space to peel into the full site.
                    </p>
                  </div>

                  <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/85 to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
                </div>

                <div className="px-6 pt-8 pb-14 flex flex-wrap gap-3 justify-center">
                  <button
                    type="button"
                    onClick={enterSite}
                    className="px-5 py-3 rounded-full bg-white text-black font-bold"
                  >
                    Enter site
                  </button>
                  <a
                    className="px-5 py-3 rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white hover:text-black transition font-bold"
                    href="/demo"
                  >
                    Try the demo now
                  </a>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="hero"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
                }}
                exit={{ opacity: 0 }}
              >
                <div className="page" id="home">
                  <section className="section hero">
                    <p className="eyebrow" id="eyebrow">
                      {copy?.eyebrow || "Home"}
                    </p>
                    <h1 className="vt-h1" id="headline">
                      {copy?.headline || "Voice to Website Builder — Speak It. Ship It."}
                    </h1>
                    <p className="subhead" id="subhead">
                      {copy?.subhead ||
                        "Turn voice into a complete, responsive, SEO-ready website with pages, copy, templates, and one-click publish — then keep improving with admin-safe sandbox edits."}
                    </p>
                    <div className="cta-row">
                      <a className="btn btn-primary" href="/demo" id="cta">
                        {copy?.cta || "Start Free Voice Build"}
                      </a>
                      <a className="btn btn-ghost" href="/demo#video">
                        Watch 60-Second Demo
                      </a>
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={runInstantDemo}
                        disabled={isGenerating}
                        aria-busy={isGenerating}
                      >
                        {isGenerating ? "Generating..." : "Run instant demo"}
                      </button>
                      <a className="btn btn-ghost" href="/license.html">
                        Get licensed download
                      </a>
                    </div>
                    <div className="trust-strip" role="note">
                      {copy?.metric1 ? <span id="metric1">{copy.metric1}</span> : null}
                      {copy?.metric2 ? <span id="metric2">{copy.metric2}</span> : null}
                      {copy?.metric3 ? <span id="metric3">{copy.metric3}</span> : null}
                    </div>
                    {copy?.price ? (
                      <p className="muted" id="price" style={{ marginTop: "0.9rem" }}>
                        {copy.price}
                      </p>
                    ) : null}

                    <div className="vt-grid" style={{ marginTop: "1.6rem" }}>
                      <div className="feature-card">
                        <h3>Voice → Full Website (live)</h3>
                        <p className="muted">
                          Speak a prompt, generate a real multi-page preview, then publish (admin).
                        </p>
                        <div className="prompt-shell">
                          <label className="prompt-label" htmlFor="tryCommand">
                            Command
                          </label>
                          <textarea
                            id="tryCommand"
                            rows={3}
                            value={tryPrompt}
                            onChange={(e) => setTryPrompt(e.target.value)}
                            placeholder={demoPresets[demoCategory].placeholder}
                          />
                          <div className="prompt-actions" style={{ justifyContent: "space-between" }}>
                            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                              <label className="sr-only" htmlFor="demoCategory">
                                Category
                              </label>
                              <select
                                id="demoCategory"
                                value={demoCategory}
                                onChange={(e) => setDemoCategory(e.target.value as any)}
                                style={{
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  color: "white",
                                  borderRadius: 999,
                                  padding: "0.6rem 0.9rem",
                                }}
                              >
                                {(Object.keys(demoPresets) as Array<keyof typeof demoPresets>).map((k) => (
                                  <option key={k} value={k}>
                                    {demoPresets[k].label}
                                  </option>
                                ))}
                              </select>
                              <label className="sr-only" htmlFor="demoTone">
                                Tone
                              </label>
                              <select
                                id="demoTone"
                                value={demoTone}
                                onChange={(e) => setDemoTone(e.target.value as any)}
                                style={{
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  color: "white",
                                  borderRadius: 999,
                                  padding: "0.6rem 0.9rem",
                                }}
                              >
                                <option value="default">Default</option>
                                <option value="bold">Bold</option>
                                <option value="luxury">Luxury</option>
                                <option value="minimal">Minimal</option>
                                <option value="playful">Playful</option>
                              </select>
                            </div>
                          </div>
                          <div className="prompt-actions">
                            <button className="btn btn-ghost" type="button" onClick={toggleListening}>
                              {isListening ? "Stop mic" : "Mic"}
                            </button>
                            <button
                              className="btn btn-primary"
                              type="button"
                              onClick={() => {
                                seedDemoPrompt(tryPrompt);
                                window.location.href = "/demo";
                              }}
                            >
                              Open demo with this
                            </button>
                            <button
                              className="btn btn-ghost"
                              type="button"
                              onClick={() => generateSitePreview()}
                              disabled={isGenerating}
                              aria-busy={isGenerating}
                            >
                              {isGenerating ? "Generating..." : "Generate live preview"}
                            </button>
                            <button
                              className="btn btn-ghost"
                              type="button"
                              onClick={runInstantDemo}
                              disabled={isGenerating}
                              aria-busy={isGenerating}
                            >
                              {isGenerating ? "Building..." : "Instant build"}
                            </button>
                          </div>
                        </div>
                        {generateError && (
                          <div className="muted" role="status" style={{ marginTop: "0.65rem", color: "#fca5a5" }}>
                            {generateError}
                          </div>
                        )}
                        <div className="vt-grid" style={{ marginTop: "0.9rem" }}>
                          {demoPresets[demoCategory].chips.map((chip) => (
                            <button
                              key={chip}
                              className="choice-card"
                              type="button"
                              onClick={() => seedDemoPrompt(chip)}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="feature-card">
                        <h3>Preview</h3>
                        <p className="muted">Instant outline + live AI preview URL.</p>
                        <div className="preview-card">
                          <div className="preview-title">{generatedSiteId ? "Generated preview" : preview.title}</div>
                          {generatedSiteId ? (
                            <div className="muted" style={{ marginTop: "0.35rem" }}>
                              Site ID: {generatedSiteId}
                            </div>
                          ) : null}
                          {generatedPreviewUrl ? (
                            <a
                              className="btn btn-ghost"
                              href={generatedPreviewUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ marginTop: "0.75rem" }}
                            >
                              Open preview
                            </a>
                          ) : null}
                          {isAdmin && generatedSiteId ? (
                            <button
                              className="btn btn-primary"
                              type="button"
                              onClick={publishGenerated}
                              disabled={isPublishing}
                              style={{ marginTop: "0.75rem" }}
                            >
                              {isPublishing ? "Publishing..." : "Publish to R2 (admin)"}
                            </button>
                          ) : null}
                          {publishResult ? (
                            <pre
                              className="muted"
                              style={{
                                marginTop: "0.75rem",
                                whiteSpace: "pre-wrap",
                                background: "rgba(0,0,0,0.35)",
                                padding: "0.75rem",
                                borderRadius: 12,
                                border: "1px solid rgba(255,255,255,0.08)",
                              }}
                            >
                              {JSON.stringify(publishResult, null, 2)}
                            </pre>
                          ) : null}
                          <ul className="preview-list">
                            {generatedLayout?.pages?.length
                              ? generatedLayout.pages.map((p: any) => (
                                  <li key={p.slug || p.title}>{p.title || p.slug}</li>
                                ))
                              : preview.sections.slice(0, 8).map((s) => <li key={s}>{s}</li>)}
                          </ul>
                        </div>
                      </div>

                      <div className="feature-card">
                        <h3>Live website demo</h3>
                        <p className="muted">End-to-end, in one screen. This is the selling point.</p>
                        <div
                          style={{
                            borderRadius: 18,
                            overflow: "hidden",
                            border: "1px solid rgba(255,255,255,0.10)",
                            background: "rgba(0,0,0,0.25)",
                            minHeight: 360,
                          }}
                        >
                          {generatedPreviewUrl ? (
                            <iframe
                              title="Generated preview"
                              src={generatedPreviewUrl}
                              style={{ width: "100%", height: 420, border: 0 }}
                            />
                          ) : (
                            <iframe
                              title="Sandbox"
                              src="/sandbox.html"
                              style={{ width: "100%", height: 420, border: 0 }}
                            />
                          )}
                        </div>
                        <div className="muted" style={{ marginTop: "0.65rem" }}>
                          Tip: generate a preview, then open Admin to apply sandbox edits safely.
                        </div>
                        <div className="prompt-actions" style={{ marginTop: "0.65rem" }}>
                          <a className="btn btn-ghost" href="/admin/">
                            Admin sandbox
                          </a>
                          <a className="btn btn-primary" href="/demo">
                            Full demo
                          </a>
                          <a className="btn btn-ghost" href="/license.html">
                            Licensed kit
                          </a>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {openerCollapsed && (
        <main className="page relative z-10">
          <section className="section">
            <h2>How it works</h2>
            <p className="subhead">Five steps. One safety gate. Infinite iteration.</p>
            <div className="vt-grid">
              {[
                ["Speak prompt", "Voice or type commands anywhere."],
                ["Generate structure", "Pages + sections + internal links."],
                ["Apply design system", "Tokens + components + motion."],
                ["Write copy + SEO", "Titles, meta, schema, headings."],
                ["Publish + optimize", "Performance defaults + reports."],
              ].map(([t, d], idx) => (
                <article className="feature-card" key={t}>
                  <div className="pill">{idx + 1}</div>
                  <h3>{t}</h3>
                  <p className="muted">{d}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="section">
            <h2>Use cases</h2>
            <p className="subhead">Creator, agency, local, ecommerce, WordPress migration.</p>
            <div className="toggle-row" role="tablist" aria-label="Use cases">
              {(Object.keys(useCases) as Array<keyof typeof useCases>).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`pill-toggle ${activeUseCase === key ? "is-active" : ""}`}
                  role="tab"
                  id={`use-case-tab-${key}`}
                  aria-controls="use-cases-panel"
                  aria-selected={activeUseCase === key}
                  tabIndex={activeUseCase === key ? 0 : -1}
                  onClick={() => setActiveUseCase(key)}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                    event.preventDefault();
                    const keys = Object.keys(useCases) as Array<keyof typeof useCases>;
                    const idx = keys.indexOf(activeUseCase);
                    if (idx < 0) return;
                    const dir = event.key === "ArrowRight" ? 1 : -1;
                    const next = keys[(idx + dir + keys.length) % keys.length];
                    setActiveUseCase(next);
                  }}
                >
                  {useCases[key].label}
                </button>
              ))}
            </div>

            <div
              className="vt-grid"
              id="use-cases-panel"
              role="tabpanel"
              tabIndex={0}
              aria-labelledby={`use-case-tab-${activeUseCase}`}
              style={{ marginTop: "1rem" }}
            >
              <article className="feature-card">
                <h3>{active.label} wins</h3>
                <ul className="preview-list">
                  {active.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </article>
              <article className="feature-card">
                <h3>Template</h3>
                <p className="muted">{active.template}</p>
                <h3 style={{ marginTop: "0.65rem" }}>Integration</h3>
                <p className="muted">{active.integration}</p>
              </article>
              <article className="feature-card">
                <h3>Build this now</h3>
                <p className="muted">{active.prompt}</p>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => {
                    seedDemoPrompt(active.prompt);
                    window.location.href = "/demo";
                  }}
                >
                  Open demo
                </button>
              </article>
            </div>
          </section>

          <section className="section">
            <h2>Generative Studio Reel</h2>
            <p className="subhead">
              Luminous, voice-led UI compositions. These are generated patterns you can deploy or remix.
            </p>
            <div className="reel-grid">
              {[
                "https://cdn.coverr.co/videos/coverr-abstract-liquid-gold-8020/1080p.mp4",
                "https://cdn.coverr.co/videos/coverr-futuristic-network-9220/1080p.mp4",
                "https://cdn.coverr.co/videos/coverr-abstract-paint-1720/1080p.mp4",
              ].map((src) => (
                <div className="reel-card" key={src}>
                  <video src={src} autoPlay muted loop playsInline />
                  <div className="reel-caption">Generated motion layer</div>
                </div>
              ))}
            </div>
          </section>

          <section className="section">
            <h2>Feature blocks</h2>
            <p className="subhead">The load-bearing parts.</p>
            <div className="vt-grid">
              {[
                ["Voice layout generation", "Turn intent into sections and hierarchy."],
                ["Auto copy + tone", "Benefit-driven copy with microcopy."],
                ["SEO + schema", "FAQ, Product, Video, Article scaffolding."],
                ["Performance defaults", "Lazy-load, caching, reduced motion."],
                ["A/B suggestions", "Ideas based on funnel friction."],
                ["Monetization kit", "Subscriptions, Store, App Store, affiliates."],
              ].map(([t, d]) => (
                <article className="feature-card" key={t}>
                  <h3>{t}</h3>
                  <p className="muted">{d}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="section">
            <h2>Pricing preview</h2>
            <p className="subhead">Free -&gt; Starter -&gt; Growth -&gt; Enterprise.</p>
            <div className="vt-grid">
              {[
                ["Free", "$0", "1 demo build"],
                ["Starter", "$79/mo", "Weekly license key + 1 site"],
                ["Growth", "$249/mo", "Monthly license keys"],
                ["Enterprise", "$699/mo", "Unlimited sites + seats"],
              ].map(([t, p, d]) => (
                <article className="feature-card" key={t}>
                  <h3>{t}</h3>
                  <div className="metric-lg" style={{ fontSize: "2.4rem" }}>
                    {p}
                  </div>
                  <p className="muted">{d}</p>
                  <a className="btn btn-ghost" href="/pricing">
                    Compare plans
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section className="section">
            <h2>Store + App Store</h2>
            <p className="subhead">Products, templates, integrations, and kits.</p>
            <div className="vt-grid">
              <article className="feature-card">
                <h3>Store</h3>
                <p className="muted">Hardware + digital bundles, upsells.</p>
                <a className="btn btn-primary" href="/store">
                  Open store
                </a>
              </article>
              <article className="feature-card">
                <h3>App Store</h3>
                <p className="muted">Templates + integrations + bots.</p>
                <a className="btn btn-ghost" href="/appstore">
                  Open App Store
                </a>
              </article>
              <article className="feature-card">
                <h3>Partners</h3>
                <p className="muted">Affiliates, agencies, integrators.</p>
                <a className="btn btn-ghost" href="/partners">
                  Partner program
                </a>
              </article>
            </div>
          </section>

          <section className="section">
            <h2>Live + blog</h2>
            <p className="subhead">Replays become SEO pages with Video schema.</p>
            <div className="vt-grid">
              <article className="feature-card">
                <h3>Live</h3>
                <p className="muted">Live builds + replays.</p>
                <a className="btn btn-primary" href="/livestream">
                  Go live
                </a>
              </article>
              <article className="feature-card">
                <h3>Blog</h3>
                <p className="muted">Topic clusters and resources.</p>
                <a className="btn btn-ghost" href="/blog">
                  Open blog
                </a>
              </article>
              <article className="feature-card">
                <h3>Trust + status</h3>
                <p className="muted">Security posture and incidents.</p>
                <a className="btn btn-ghost" href="/trust">
                  Trust Center
                </a>
              </article>
            </div>
          </section>

          <section className="section">
            <h2>FAQ</h2>
            <div className="vt-accordion">
              <details className="accordion-item">
                <summary>Do I own my site and content?</summary>
                <p className="muted">Yes. Your pages and copy are yours.</p>
              </details>
              <details className="accordion-item">
                <summary>How does Plan -&gt; Apply -&gt; Rollback work?</summary>
                <p className="muted">
                  You preview changes first, confirm explicitly, then apply. Undo restores the last change.
                </p>
              </details>
              <details className="accordion-item">
                <summary>Does this hurt performance?</summary>
                <p className="muted">No. Lazy-load, caching, and reduced motion are built in.</p>
              </details>
            </div>
          </section>
        </main>
      )}

      <style>{`
        .bg-radial-gradient {
          background: radial-gradient(circle at center, transparent 0%, black 100%);
        }
      `}</style>
    </div>
  );
};

export default App;
