import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import AudioWaveform from "./components/AudioWaveform";
import BioluminescentHeader from "./components/BioluminescentHeader";
import BubbleFooter from "./components/BubbleFooter";
import ErrorBoundary from "./components/ErrorBoundary";
import MonolithNav from "./components/MonolithNav";
import SiteLogo from "./components/SiteLogo";
import WarpTunnel from "./components/WarpTunnel";
import { FALLBACK_INTRO_SONG, HOME_VIDEO, INTRO_SONG } from "./constants";
import { SHARED_NAV_ITEMS } from "./constants/navigation";
import { audioEngine } from "./services/audioEngine";
import siteConfig from "./site-config.json";

type PricingTier = {
  name: string;
  pages: string;
  price: string;
  desc: string;
  highlight?: boolean;
  features: string[];
};

const NAV_MENU_ITEMS = SHARED_NAV_ITEMS;

const PARTICLE_LAYOUT = [
  { left: "15%", top: "20%", delay: "0.1s", opacity: 0.3 },
  { left: "85%", top: "10%", delay: "1.2s", opacity: 0.6 },
  { left: "45%", top: "85%", delay: "2.3s", opacity: 0.4 },
  { left: "25%", top: "55%", delay: "0.8s", opacity: 0.5 },
  { left: "75%", top: "35%", delay: "3.1s", opacity: 0.2 },
  { left: "55%", top: "15%", delay: "1.7s", opacity: 0.7 },
  { left: "35%", top: "75%", delay: "2.9s", opacity: 0.3 },
  { left: "65%", top: "65%", delay: "0.5s", opacity: 0.6 },
  { left: "5%", top: "45%", delay: "2.1s", opacity: 0.4 },
  { left: "95%", top: "25%", delay: "1.4s", opacity: 0.5 },
  { left: "40%", top: "40%", delay: "3.4s", opacity: 0.2 },
  { left: "60%", top: "80%", delay: "0.3s", opacity: 0.8 },
  { left: "20%", top: "90%", delay: "2.6s", opacity: 0.3 },
  { left: "80%", top: "5%", delay: "1.9s", opacity: 0.6 },
  { left: "50%", top: "50%", delay: "0.7s", opacity: 0.4 },
  { left: "30%", top: "30%", delay: "3.2s", opacity: 0.5 },
  { left: "70%", top: "70%", delay: "1.1s", opacity: 0.3 },
  { left: "10%", top: "60%", delay: "2.4s", opacity: 0.7 },
  { left: "90%", top: "40%", delay: "0.9s", opacity: 0.4 },
  { left: "48%", top: "12%", delay: "2.8s", opacity: 0.6 },
];

const PRICING_TIERS: PricingTier[] = [
  {
    name: "Solo",
    pages: "1 Page",
    price: "$49",
    desc: "For single landing pages or personal brands.",
    features: [
      "Custom Domain",
      "SSL Certificate",
      "Basic SEO",
      "Email Support",
    ],
  },
  {
    name: "Business",
    pages: "5 Pages",
    price: "$199",
    desc: "A full presence for your growing company.",
    highlight: true,
    features: [
      "Everything in Solo",
      "Advanced Analytics",
      "Priority Support",
      "Custom Integrations",
      "API Access",
    ],
  },
  {
    name: "Enterprise",
    pages: "Unlimited",
    price: "$499",
    desc: "Maximum power and white-label options.",
    features: [
      "Everything in Business",
      "White-label Options",
      "Dedicated Support",
      "Custom Development",
      "SLA Guarantee",
    ],
  },
];

const EnhancedTypography = () => (
  <section className="mt-20 space-y-12">
    {/* Font Showcase */}
    <div className="text-center">
      <h2 className="text-4xl md:text-6xl font-black mb-8 bg-gradient-to-r from-white via-cyan-400 to-white bg-clip-text text-transparent">
        Typography Excellence
      </h2>
      <div className="grid md:grid-cols-3 gap-8 text-left">
        <div className="p-6 rounded-xl border border-white/10 bg-white/5">
          <h3 className="text-3xl font-bold text-white mb-4 font-outfit">
            Outfit
          </h3>
          <p className="text-white/60 leading-relaxed">
            Modern geometric sans-serif perfect for headlines and bold
            statements.
          </p>
        </div>
        <div className="p-6 rounded-xl border border-white/10 bg-white/5">
          <h3 className="text-3xl font-normal text-white mb-4 font-inter">
            Inter
          </h3>
          <p className="text-white/60 leading-relaxed">
            Clean, readable typeface optimized for user interfaces and body
            text.
          </p>
        </div>
        <div className="p-6 rounded-xl border border-white/10 bg-white/5">
          <h3 className="text-3xl font-mono text-white mb-4 font-jetbrains">
            JetBrains
          </h3>
          <p className="text-white/60 leading-relaxed">
            Developer-focused monospace font for code and technical content.
          </p>
        </div>
      </div>
    </div>
  </section>
);

const App: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const heroHeadline =
    siteConfig?.copy?.headline?.trim() ||
    "Launch production-ready sites with one spoken command.";
  const heroSubhead =
    siteConfig?.copy?.subhead?.trim() ||
    "Voice-to-website automation that builds, tests, and deploys in minutes—no handoffs, no guesswork.";
  const audioPlayingRef = useRef(false);
  const musicManuallyStoppedRef = useRef(false);

  // Core State
  const [tryPrompt, setTryPrompt] = useState("");
  const [flowPhase, setFlowPhase] = useState<
    "ready" | "listening" | "confirm" | "generating" | "result"
  >("ready");
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState("");
  const [generatedSiteId, setGeneratedSiteId] = useState("");
  const [generateError, setGenerateError] = useState("");
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isNavFaded, setIsNavFaded] = useState(false);
  const [activeTierIndex, setActiveTierIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const FALLBACK_PREVIEW_URL = "/demo";

  const recognitionRef = useRef<any>(null);
  const flowPhaseRef = useRef(flowPhase);
  const navMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    flowPhaseRef.current = flowPhase;
  }, [flowPhase]);

  useEffect(() => {
    const onScroll = () => {
      setIsNavFaded(window.scrollY > 18);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!isNavMenuOpen) return;
      if (navMenuRef.current?.contains(event.target as Node)) return;
      setIsNavMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsNavMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNavMenuOpen]);

  const startThemeSong = useCallback(async (overrideManualStop = false) => {
    if (musicManuallyStoppedRef.current && !overrideManualStop) return false;
    await audioEngine.enable();
    audioEngine.unmuteMusicIfNeeded();

    // Try primary track; if it fails (blocked/404), fall back to the bundled loop.
    let ok = await audioEngine.playMusic(INTRO_SONG);
    if (!ok) {
      ok = await audioEngine.playMusic(FALLBACK_INTRO_SONG);
    }
    audioPlayingRef.current = ok;
    setIsMusicPlaying(ok);
    return ok;
  }, []);

  const stopThemeSong = useCallback(() => {
    musicManuallyStoppedRef.current = true;
    audioEngine.stopMusic();
    audioPlayingRef.current = false;
    setIsMusicPlaying(false);
  }, []);

  // Initialize speech recognition once; start only when user explicitly taps CTA.
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
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
    recognition.onend = () => {
      if (flowPhaseRef.current === "listening") setFlowPhase("confirm");
    };
    recognition.onerror = () => {
      if (flowPhaseRef.current === "listening") {
        setFlowPhase("ready");
      }
    };
    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (_) {}
    };
  }, []);

  // Audio Control
  useEffect(() => {
    // Set optimal volume for immediate autoplay
    audioEngine.setVolume(0.4);
  }, []);

  // AGGRESSIVE AUTOPLAY - Play music immediately on page load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hostname = (window.location.hostname || "").toLowerCase();
    const isVoiceToWebsiteHost = /(^|\.)voicetowebsite\.com$/.test(hostname);
    const allowDevHost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(
      hostname
    );
    if (!isVoiceToWebsiteHost && !allowDevHost) return;

    let cancelled = false;

    const tryStart = async () => {
      if (cancelled) return;
      // Force start the song immediately
      await startThemeSong();
    };

    const onFirstGesture = async () => {
      if (audioPlayingRef.current) return;
      // Force start on first user interaction if blocked
      await startThemeSong();
    };

    // Multiple attempts for immediate autoplay
    const attemptAutoplay = async () => {
      if (cancelled) return;

      // Try immediately
      try {
        await startThemeSong();
      } catch (error) {
        console.log("Autoplay blocked, will retry on user interaction");
      }

      // Try again after a short delay (some browsers allow delayed autoplay)
      setTimeout(() => {
        if (!cancelled && !audioPlayingRef.current) {
          tryStart().catch(() => {});
        }
      }, 500);

      // Try one more time after page load
      setTimeout(() => {
        if (!cancelled && !audioPlayingRef.current) {
          tryStart().catch(() => {});
        }
      }, 1500);
    };

    // Start aggressive autoplay attempts
    attemptAutoplay();

    // Fallback: retry on first user interaction
    document.addEventListener("pointerdown", onFirstGesture, {
      capture: true,
      once: true,
    });
    document.addEventListener("keydown", onFirstGesture, {
      capture: true,
      once: true,
    });

    // Also try on page visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (
        !cancelled &&
        !audioPlayingRef.current &&
        !musicManuallyStoppedRef.current &&
        document.visibilityState === "visible"
      ) {
        tryStart().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("pointerdown", onFirstGesture, true);
      document.removeEventListener("keydown", onFirstGesture, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startThemeSong]);

  // Actions
  const startListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setGenerateError(
        "Voice capture is not available in this browser. Use Chrome or Edge."
      );
      return;
    }
    setGenerateError("");
    setTryPrompt("");
    setFlowPhase("listening");
    try {
      recognition.start();
    } catch (_) {
      setFlowPhase("ready");
      setGenerateError(
        "Microphone could not start. Check browser permissions."
      );
    }
  };

  const stopMic = () => {
    try {
      recognitionRef.current.stop();
    } catch (_) {}
    setFlowPhase("confirm");
  };

  const resetFlow = () => {
    setFlowPhase("ready");
    setTryPrompt("");
    setGeneratedPreviewUrl("");
    setGeneratedSiteId("");
    setGenerateError("");
    audioEngine.stopMusic();
    audioPlayingRef.current = false;
    setIsMusicPlaying(false);
  };

  const generateSite = async () => {
    if (!tryPrompt.trim()) return;

    setFlowPhase("generating");
    setGenerateError("");

    // Play the song as requested
    await startThemeSong();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: tryPrompt, tone: "default" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.error || `Generate failed (HTTP ${res.status})`);

      const siteId = String(data?.siteId || "");
      const previewPath =
        String(data?.previewUrl || "").trim() ||
        (siteId ? `/preview/${siteId}` : "");
      let previewUrl = "";
      try {
        previewUrl = previewPath
          ? new URL(previewPath, window.location.origin).toString()
          : "";
      } catch (_) {
        previewUrl = previewPath;
      }

      setGeneratedSiteId(siteId);
      setGeneratedPreviewUrl(previewUrl || FALLBACK_PREVIEW_URL);
      setFlowPhase("result");
    } catch (err: any) {
      setGenerateError(err?.message || "Generate failed.");
      setFlowPhase("confirm");
    } finally {
    }
  };

  const activeTier = PRICING_TIERS[activeTierIndex];

  const shiftTier = useCallback((direction: number) => {
    setActiveTierIndex((prev) => {
      const next =
        (prev + direction + PRICING_TIERS.length) % PRICING_TIERS.length;
      return next;
    });
  }, []);

  const handleTierTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    setTouchStartX(event.changedTouches[0]?.clientX ?? null);
  };

  const handleTierTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (touchStartX == null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = endX - touchStartX;
    if (delta > 40) shiftTier(-1);
    if (delta < -40) shiftTier(1);
    setTouchStartX(null);
  };

  const toggleThemeSong = () => {
    if (isMusicPlaying) {
      stopThemeSong();
      return;
    }
    musicManuallyStoppedRef.current = false;
    startThemeSong(true).catch(() => {});
  };

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen bg-black text-white select-none overflow-x-hidden font-outfit">
        <ErrorBoundary fallback={null}>
          <MonolithNav />
        </ErrorBoundary>
        <ErrorBoundary fallback={null}>
          <BioluminescentHeader />
        </ErrorBoundary>
        <ErrorBoundary fallback={null}>
          <WarpTunnel isVisible={!reduceMotion && flowPhase === "generating"} />
        </ErrorBoundary>

        {/* Enhanced Background atmosphere with multiple media types */}
        <div className="fixed inset-0 w-full h-full z-0 pointer-events-none opacity-30">
          {reduceMotion ? (
            <div className="w-full h-full brightness-50 bg-radial-atmosphere" />
          ) : (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full h-full object-cover brightness-50"
              onPlay={() => startThemeSong()}
            >
              <source src={HOME_VIDEO} type="video/mp4" />
            </video>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />

          {/* Enhanced particle effects */}
          <div className="absolute inset-0">
            {PARTICLE_LAYOUT.map((p, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: p.left,
                  top: p.top,
                  opacity: p.opacity,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </div>
        </div>

        {/* Simplified Navigation */}
        <nav
          className={`fixed top-0 left-0 right-0 z-40 transition-opacity duration-300 ${isNavFaded ? "opacity-70" : "opacity-100"}`}
        >
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between backdrop-blur-md bg-black/45 border-b border-white/15 rounded-b-3xl shadow-lg shadow-black/20">
            <a href="/" className="flex items-center gap-3">
              <SiteLogo size={42} className="text-white" inline />
            </a>
            <div ref={navMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsNavMenuOpen((prev) => !prev)}
                aria-expanded={isNavMenuOpen ? "true" : "false"}
                aria-label="Toggle navigation menu"
                className="px-4 py-2 rounded-full border border-white/15 bg-white/10 hover:bg-white/15 transition-all font-outfit text-[11px] tracking-[0.16em] uppercase"
              >
                Menu
              </button>
              <AnimatePresence>
                {isNavMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    className="absolute right-0 mt-3 w-56 rounded-2xl border border-emerald-400/30 bg-black/85 backdrop-blur-xl p-2"
                  >
                    {NAV_MENU_ITEMS.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={() => setIsNavMenuOpen(false)}
                        className="block rounded-xl px-4 py-3 font-outfit text-sm tracking-[0.14em] uppercase text-white/75 hover:text-white hover:bg-emerald-500/20 hover:translate-x-1 transition-all"
                      >
                        {item.label}
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>

        <div className="fixed bottom-5 right-5 z-50">
          <button
            type="button"
            onClick={toggleThemeSong}
            className="px-4 py-2 rounded-full border border-emerald-300/50 bg-black/65 backdrop-blur-md text-xs font-outfit tracking-[0.18em] uppercase hover:bg-emerald-500/15 transition-all"
            aria-label={
              isMusicPlaying ? "Stop background song" : "Play background song"
            }
          >
            {isMusicPlaying ? "Stop Song" : "Play Song"}
          </button>
        </div>

        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-32">
          {/* Enhanced Header with better typography */}
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-outfit text-xs tracking-[0.8em] text-cyan-400/80 uppercase mb-6"
            >
              VoiceToWebsite.com
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="vtw-metallic-heading font-outfit font-black text-5xl md:text-8xl lg:text-9xl tracking-tight leading-none mb-8"
            >
              {heroHeadline}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/60 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed font-inter"
            >
              {heroSubhead}
            </motion.p>
          </div>

          {/* Enhanced Flow Section */}
          <section className="relative z-20 mb-32">
            <AnimatePresence mode="wait">
              {flowPhase === "ready" && (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="text-center py-16"
                >
                  <div className="mb-10">
                    <AudioWaveform
                      active={false}
                      mode="opener"
                      className="mx-auto scale-125"
                    />
                  </div>
                  <button
                    onClick={startListening}
                    aria-label="Tap to create a website"
                    className="px-14 py-5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black font-outfit text-base tracking-[0.12em] shadow-[0_12px_35px_rgba(56,189,248,0.25)] hover:shadow-[0_16px_45px_rgba(56,189,248,0.35)] transition-all uppercase"
                  >
                    Start a build
                  </button>
                  <p className="mt-6 text-white/65 font-inter">
                    Microphone activates only after you tap the button.
                  </p>
                  {generateError && (
                    <div className="mt-6 text-red-400 font-outfit text-sm uppercase tracking-widest">
                      {generateError}
                    </div>
                  )}
                </motion.div>
              )}

              {flowPhase === "listening" && (
                <motion.div
                  key="listening"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="text-center py-16"
                >
                  <div className="mb-16">
                    <AudioWaveform
                      active={true}
                      mode="opener"
                      className="mx-auto scale-150"
                    />
                  </div>
                  <div className="text-3xl font-light text-white/80 min-h-[4rem] px-4 font-inter">
                    {tryPrompt || "Listening for your command..."}
                  </div>
                  <button
                    onClick={stopMic}
                    className="mt-16 px-12 py-6 rounded-full border border-white/20 bg-white/10 hover:bg-white hover:text-black transition-all font-outfit tracking-widest uppercase text-sm font-semibold"
                  >
                    Finish Command
                  </button>
                </motion.div>
              )}

              {flowPhase === "confirm" && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="text-sm font-outfit tracking-[0.4em] text-cyan-400 uppercase mb-12">
                    System Check
                  </div>
                  <h3 className="text-4xl md:text-5xl font-outfit mb-8 font-black">
                    Are you ready?
                  </h3>
                  <div className="bg-white/5 border border-white/10 p-8 rounded-3xl max-w-3xl mx-auto mb-12 text-2xl font-light text-white/90 shadow-inner backdrop-blur-sm">
                    "{tryPrompt}"
                  </div>
                  <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    <button
                      onClick={resetFlow}
                      className="w-full md:w-auto px-12 py-6 rounded-full border border-white/10 hover:bg-white/5 transition-all font-outfit text-sm tracking-widest uppercase"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={generateSite}
                      className="w-full md:w-auto px-20 py-6 rounded-full bg-white text-black font-black font-outfit text-lg tracking-[0.2em] shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] transition-all uppercase"
                    >
                      MAKE IT
                    </button>
                  </div>
                  {generateError && (
                    <div className="mt-8 text-red-400 font-outfit text-sm uppercase tracking-widest">
                      {generateError}
                    </div>
                  )}
                </motion.div>
              )}

              {flowPhase === "generating" && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-24"
                >
                  <div className="relative inline-block mb-16">
                    <div className="absolute inset-0 animate-ping bg-cyan-500/20 rounded-full" />
                    <div className="relative w-40 h-40 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                  </div>
                  <h3 className="text-4xl md:text-5xl font-outfit font-black tracking-widest uppercase animate-pulse">
                    Forging Website...
                  </h3>
                  <p className="mt-6 text-white/40 font-outfit text-sm tracking-[0.3em] uppercase">
                    Build Pipeline: Active
                  </p>
                </motion.div>
              )}

              {flowPhase === "result" && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="text-sm font-outfit tracking-[0.4em] text-green-400 uppercase mb-12">
                    Success
                  </div>
                  <h3 className="text-4xl md:text-5xl font-outfit mb-12 font-black">
                    Site Identity: {generatedSiteId}
                  </h3>

                  {/* Enhanced Preview Box */}
                  <div className="relative mb-16 rounded-3xl overflow-hidden border border-white/20 bg-black shadow-2xl group">
                    <div
                      className="absolute inset-0 z-20 pointer-events-none bg-transparent select-none"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-8 py-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-outfit tracking-widest text-white/60 uppercase pointer-events-none">
                      Neural Shield Active
                    </div>
                    <div className="vt-preview-scroll">
                      <iframe
                        key={generatedPreviewUrl || FALLBACK_PREVIEW_URL}
                        src={generatedPreviewUrl || FALLBACK_PREVIEW_URL}
                        className="vt-preview-frame w-full border-none grayscale-[0.2]"
                        title="Website Preview"
                        scrolling="yes"
                        onLoad={() =>
                          console.log("Preview loaded successfully")
                        }
                        onError={() => {
                          console.warn(
                            "Preview failed to load, using fallback"
                          );
                          setGeneratedPreviewUrl(FALLBACK_PREVIEW_URL);
                        }}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      />
                    </div>
                    <div className="absolute inset-0 z-40 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    <button
                      onClick={resetFlow}
                      className="w-full md:w-auto px-12 py-6 rounded-full border border-white/10 hover:bg-white/5 transition-all font-outfit text-sm tracking-widest uppercase"
                    >
                      Build Another
                    </button>
                    <a
                      href="/license.html"
                      className="w-full md:w-auto px-20 py-6 rounded-full bg-cyan-500 text-black font-black font-outfit text-lg tracking-[0.1em] shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:shadow-[0_0_60px_rgba(34,211,238,0.6)] transition-all uppercase text-center"
                    >
                      Claim Ownership
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Enhanced Typography Section */}
          <EnhancedTypography />

          {/* Swipe Pricing */}
          <section
            id="pricing"
            className="mt-24 border-t border-white/10 pt-24"
          >
            <div className="text-center mb-20">
              <h2 className="font-outfit font-black text-4xl md:text-6xl uppercase mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Ownership Tiers
              </h2>
              <p className="text-white/40 text-xl md:text-2xl font-inter">
                Swipe left or right to view pricing.
              </p>
            </div>

            <div className="max-w-5xl mx-auto px-2 md:px-8">
              <div className="flex items-center justify-center gap-3 md:gap-8">
                <button
                  type="button"
                  onClick={() => shiftTier(-1)}
                  aria-label="Previous pricing tier"
                  className="w-11 h-11 md:w-14 md:h-14 rounded-full border border-emerald-300/50 bg-emerald-400/10 text-2xl text-white hover:bg-emerald-400/20 transition-all"
                >
                  ‹
                </button>

                <div
                  className="w-full max-w-2xl touch-pan-y"
                  onTouchStart={handleTierTouchStart}
                  onTouchEnd={handleTierTouchEnd}
                >
                  <AnimatePresence mode="wait">
                    <motion.article
                      key={activeTier.name}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.25 }}
                      className={`p-8 md:p-12 rounded-[2.2rem] border backdrop-blur-sm ${activeTier.highlight ? "border-cyan-500 bg-white/10 shadow-[0_0_50px_rgba(34,211,238,0.2)]" : "border-white/10 bg-white/[0.02]"}`}
                    >
                      <div className="font-outfit text-sm tracking-widest text-white/40 uppercase mb-8">
                        {activeTier.pages}
                      </div>
                      <h3 className="font-outfit text-3xl font-black mb-4">
                        {activeTier.name}
                      </h3>
                      <div className="text-5xl font-outfit font-black mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        {activeTier.price}
                      </div>
                      <p className="text-white/40 text-lg leading-relaxed mb-12 font-inter">
                        {activeTier.desc}
                      </p>

                      <ul className="space-y-4 mb-12">
                        {activeTier.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center text-white/60 font-inter"
                          >
                            <svg
                              className="w-5 h-5 mr-3 text-cyan-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <a
                        href="/license.html"
                        className={`block w-full text-center py-6 rounded-full font-outfit text-sm tracking-widest uppercase transition-all font-semibold ${activeTier.highlight ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)]" : "border border-white/20 hover:bg-white/5"}`}
                      >
                        Select Tier
                      </a>
                    </motion.article>
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={() => shiftTier(1)}
                  aria-label="Next pricing tier"
                  className="w-11 h-11 md:w-14 md:h-14 rounded-full border border-emerald-300/50 bg-emerald-400/10 text-2xl text-white hover:bg-emerald-400/20 transition-all"
                >
                  ›
                </button>
              </div>

              <div className="mt-7 flex items-center justify-center gap-2">
                {PRICING_TIERS.map((tier, idx) => (
                  <button
                    key={tier.name}
                    type="button"
                    onClick={() => setActiveTierIndex(idx)}
                    aria-label={`Go to ${tier.name} tier`}
                    className={`h-2.5 rounded-full transition-all ${idx === activeTierIndex ? "w-9 bg-emerald-300" : "w-2.5 bg-white/30"}`}
                  />
                ))}
              </div>
            </div>
          </section>

          <div className="h-48" />
        </main>

        <BubbleFooter />
      </div>
    </ErrorBoundary>
  );
};

export default App;
