import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import AudioWaveform from "./components/AudioWaveform";
import WarpTunnel from "./components/WarpTunnel";
import { HOME_VIDEO, INTRO_SONG } from "./constants";
import { audioEngine } from "./services/audioEngine";
import siteConfig from "./site-config.json";

// Enhanced media types and components
const EnhancedMediaSection = () => (
  <section className="mt-24 grid md:grid-cols-3 gap-8">
    {/* Video Showcase */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm"
    >
      <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Video Demos</h3>
          <p className="text-white/60 text-sm">Watch AI in action</p>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>

    {/* Audio Showcase */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-900/20 to-green-900/20 backdrop-blur-sm"
    >
      <div className="aspect-video bg-gradient-to-br from-cyan-600/20 to-green-600/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Audio Engine</h3>
          <p className="text-white/60 text-sm">Voice-powered creation</p>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>

    {/* Interactive Showcase */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-orange-900/20 to-red-900/20 backdrop-blur-sm"
    >
      <div className="aspect-video bg-gradient-to-br from-orange-600/20 to-red-600/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Interactive</h3>
          <p className="text-white/60 text-sm">Real-time preview</p>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  </section>
);

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

const AdvancedLayout = () => (
  <section className="mt-20">
    <div className="text-center mb-12">
      <h2 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
        Advanced Layout System
      </h2>
      <p className="text-xl text-white/60 max-w-3xl mx-auto">
        Responsive grid, flexible components, and perfect spacing across all
        devices
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="aspect-square rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center backdrop-blur-sm"
        >
          <span className="text-4xl font-black text-white/20">{i}</span>
        </motion.div>
      ))}
    </div>
  </section>
);

const App: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const heroHeadline =
    siteConfig?.copy?.headline?.trim() || "Speak It. Ship It.";
  const heroSubhead =
    siteConfig?.copy?.subhead?.trim() ||
    "The world's first one-command website engine. No steps. No crap. Just your voice.";
  const audioPrefRef = useRef<"on" | "off" | null>(null);
  const audioPlayingRef = useRef(false);

  // Core State
  const [tryPrompt, setTryPrompt] = useState("");
  const [flowPhase, setFlowPhase] = useState<
    "listening" | "confirm" | "generating" | "result"
  >("listening");
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState("");
  const [generatedSiteId, setGeneratedSiteId] = useState("");
  const [generateError, setGenerateError] = useState("");

  const recognitionRef = useRef<any>(null);

  const startThemeSong = useCallback(async (force = false) => {
    if (!force && audioPrefRef.current === "off") return false;
    await audioEngine.enable();
    audioEngine.unmuteMusicIfNeeded();
    const ok = await audioEngine.playMusic(INTRO_SONG);
    audioPlayingRef.current = ok;
    if (ok) {
      audioPrefRef.current = "on";
      try {
        localStorage.setItem("vtw-audio-pref", "on");
      } catch (_) {}
    }
    return ok;
  }, []);

  // Initialize Speech Recognition
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
      if (flowPhase === "listening") setFlowPhase("confirm");
    };
    recognition.onerror = () => {
      setFlowPhase("listening");
    };
    recognitionRef.current = recognition;

    // Start recognition automatically since we removed the manual button
    try {
      recognition.start();
    } catch (_) {}

    return () => {
      try {
        recognition.stop();
      } catch (_) {}
    };
  }, [flowPhase]);

  // Audio Control
  useEffect(() => {
    // Set optimal volume for immediate autoplay
    audioEngine.setVolume(0.4);
  }, []);

  // AGGRESSIVE AUTOPLAY - Play music immediately on page load
  useEffect(() => {
    let cancelled = false;

    const loadPref = () => {
      try {
        const raw = String(
          localStorage.getItem("vtw-audio-pref") || ""
        ).toLowerCase();
        if (raw === "off") return "off";
        if (raw === "on") return "on";
      } catch (_) {}
      return null;
    };

    audioPrefRef.current = loadPref();

    const tryStart = async () => {
      if (cancelled) return;
      // Force start the song immediately
      await startThemeSong(true);
    };

    const onFirstGesture = async () => {
      if (audioPlayingRef.current) return;
      // Force start on first user interaction if blocked
      await startThemeSong(true);
    };

    // Multiple attempts for immediate autoplay
    const attemptAutoplay = async () => {
      if (cancelled) return;

      // Try immediately
      try {
        await startThemeSong(true);
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
  }, []);

  // Actions
  const stopMic = () => {
    try {
      recognitionRef.current.stop();
    } catch (_) {}
    setFlowPhase("confirm");
  };

  const resetFlow = () => {
    setFlowPhase("listening");
    setTryPrompt("");
    setGeneratedPreviewUrl("");
    setGeneratedSiteId("");
    setGenerateError("");
    audioEngine.stopMusic();
    audioPlayingRef.current = false;
  };

  const generateSite = async () => {
    if (!tryPrompt.trim()) return;

    setFlowPhase("generating");
    setGenerateError("");

    // Play the song as requested
    await startThemeSong(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: tryPrompt, tone: "default" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.error || `Generate failed (HTTP ${res.status})`);

      setGeneratedSiteId(String(data?.siteId || ""));
      setGeneratedPreviewUrl(String(data?.previewUrl || ""));
      setFlowPhase("result");
    } catch (err: any) {
      setGenerateError(err?.message || "Generate failed.");
      setFlowPhase("confirm");
    } finally {
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white select-none overflow-x-hidden font-outfit">
      <WarpTunnel isVisible={!reduceMotion && flowPhase === "generating"} />

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
            onPlay={() => startThemeSong(true)}
          >
            <source src={HOME_VIDEO} type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />

        {/* Enhanced particle effects */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse particle-random"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: Math.random() * 0.5 + 0.1,
              }}
            />
          ))}
        </div>
      </div>

      {/* Enhanced Navigation */}
      <nav className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg" />
          <span className="font-bold text-xl font-outfit">VoiceToWebsite</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <a
            href="#features"
            className="text-white/60 hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-white/60 hover:text-white transition-colors"
          >
            Pricing
          </a>
          <a
            href="#about"
            className="text-white/60 hover:text-white transition-colors"
          >
            About
          </a>
          <button className="px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            Sign In
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-32">
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
            className="vtw-metallic-heading font-outfit font-black text-5xl md:text-8xl lg:text-9xl tracking-tighter leading-none mb-8"
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
                  Audio Engine: Active
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
                    className="absolute inset-0 z-20 pointer-events-auto bg-transparent select-none"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-8 py-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-outfit tracking-widest text-white/60 uppercase pointer-events-none">
                    Neural Shield Active
                  </div>
                  {generatedPreviewUrl && (
                    <div className="vt-preview-scroll">
                      <iframe
                        src={generatedPreviewUrl}
                        className="vt-preview-frame w-full border-none grayscale-[0.2]"
                        title="Website Preview"
                        scrolling="yes"
                      />
                    </div>
                  )}
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

        {/* Enhanced Media Section */}
        <EnhancedMediaSection />

        {/* Enhanced Typography Section */}
        <EnhancedTypography />

        {/* Advanced Layout Section */}
        <AdvancedLayout />

        {/* Enhanced Pricing Section */}
        <section className="mt-24 border-t border-white/10 pt-24">
          <div className="text-center mb-20">
            <h2 className="font-outfit font-black text-4xl md:text-6xl uppercase mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Ownership Tiers
            </h2>
            <p className="text-white/40 text-xl md:text-2xl font-inter">
              Transparent pricing for autonomous engineering.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
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
            ].map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className={`p-12 rounded-[3rem] border backdrop-blur-sm transition-all hover:scale-105 ${tier.highlight ? "border-cyan-500 bg-white/10 shadow-[0_0_50px_rgba(34,211,238,0.2)]" : "border-white/10 bg-white/[0.02]"}`}
              >
                <div className="font-outfit text-sm tracking-widest text-white/40 uppercase mb-8">
                  {tier.pages}
                </div>
                <h3 className="font-outfit text-3xl font-black mb-4">
                  {tier.name}
                </h3>
                <div className="text-5xl font-outfit font-black mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  {tier.price}
                </div>
                <p className="text-white/40 text-lg leading-relaxed mb-12 font-inter">
                  {tier.desc}
                </p>

                {/* Features list */}
                <ul className="space-y-4 mb-12">
                  {tier.features.map((feature, idx) => (
                    <li
                      key={idx}
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
                  className={`block w-full text-center py-6 rounded-full font-outfit text-sm tracking-widest uppercase transition-all font-semibold ${tier.highlight ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)]" : "border border-white/20 hover:bg-white/5"}`}
                >
                  Select Tier
                </a>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Enhanced Footer */}
        <footer className="mt-40 border-t border-white/10 pt-16">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div>
              <h4 className="font-outfit font-black text-lg mb-6">Product</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Examples
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-outfit font-black text-lg mb-6">Company</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-outfit font-black text-lg mb-6">Resources</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Tutorials
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Community
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-outfit font-black text-lg mb-6">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Terms
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    License
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center pt-8 border-t border-white/10">
            <p className="font-outfit text-xs tracking-[1em] uppercase text-white/20">
              Sometimes it's better to keep it simple.
            </p>
            <p className="mt-4 text-white/40 text-sm">
              © 2026 VoiceToWebsite. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
