import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import AudioWaveform from "./components/AudioWaveform";
import WarpTunnel from "./components/WarpTunnel";
import { HOME_VIDEO, INTRO_SONG } from "./constants";
import { audioEngine } from "./services/audioEngine";

const App: React.FC = () => {
  const reduceMotion = useReducedMotion();
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

      {/* Background atmosphere */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none opacity-30">
        {reduceMotion ? (
          <div
            className="w-full h-full brightness-50"
            style={{
              backgroundImage:
                "radial-gradient(1200px circle at 12% -10%, rgba(255,255,255,0.18), transparent 60%), radial-gradient(1100px circle at 90% 15%, rgba(34,211,238,0.14), transparent 62%), radial-gradient(800px circle at 30% 80%, rgba(251,191,36,0.10), transparent 65%), linear-gradient(180deg, rgba(8,12,24,0.78), rgba(8,12,24,0.95)), linear-gradient(120deg, rgba(10,20,40,0.97), rgba(7,10,22,0.99))",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
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
      </div>

      {/* Persistent audio control */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-32">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-orbitron text-xs tracking-[0.8em] text-cyan-400/80 uppercase mb-4"
          >
            VoiceToWebsite.com
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="vtw-metallic-heading font-orbitron font-black text-4xl md:text-7xl tracking-tighter uppercase leading-none mb-6"
          >
            Speak It.
            <br />
            Ship It.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            The world's first one-command website engine. No steps. No crap.
            Just your voice.
          </motion.p>
        </div>

        {/* 2. Example below video / Integrated with Flow */}
        <section className="relative z-20">
          <AnimatePresence mode="wait">
            {flowPhase === "listening" && (
              <motion.div
                key="listening"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="text-center py-10"
              >
                <div className="mb-12">
                  <AudioWaveform
                    active={true}
                    mode="opener"
                    className="mx-auto scale-150"
                  />
                </div>
                <div className="text-2xl font-light text-white/80 min-h-[4rem] px-4">
                  {tryPrompt || "Listening for your command..."}
                </div>
                <button
                  onClick={stopMic}
                  className="mt-12 px-10 py-4 rounded-full border border-white/20 bg-white/10 hover:bg-white hover:text-black transition-all font-orbitron tracking-widest uppercase text-xs"
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
                <div className="text-sm font-orbitron tracking-[0.4em] text-cyan-400 uppercase mb-8">
                  System Check
                </div>
                <h3 className="text-3xl font-orbitron mb-4 font-black">
                  Are you ready?
                </h3>
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl max-w-2xl mx-auto mb-10 text-xl font-light text-white/90 shadow-inner">
                  "{tryPrompt}"
                </div>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                  <button
                    onClick={resetFlow}
                    className="w-full md:w-auto px-10 py-5 rounded-full border border-white/10 hover:bg-white/5 transition-all font-orbitron text-xs tracking-widest uppercase"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={generateSite}
                    className="w-full md:w-auto px-16 py-5 rounded-full bg-white text-black font-black font-orbitron text-sm tracking-[0.2em] shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] transition-all uppercase"
                  >
                    MAKE IT
                  </button>
                </div>
                {generateError && (
                  <div className="mt-6 text-red-400 font-orbitron text-xs uppercase tracking-widest">
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
                className="text-center py-20"
              >
                <div className="relative inline-block mb-10">
                  <div className="absolute inset-0 animate-ping bg-cyan-500/20 rounded-full" />
                  <div className="relative w-32 h-32 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                </div>
                <h3 className="text-3xl font-orbitron font-black tracking-widest uppercase animate-pulse">
                  Forging Website...
                </h3>
                <p className="mt-4 text-white/40 font-orbitron text-xs tracking-[0.3em] uppercase">
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
                <div className="text-sm font-orbitron tracking-[0.4em] text-green-400 uppercase mb-8">
                  Success
                </div>
                <h3 className="text-3xl font-orbitron mb-10 font-black">
                  Site Identity: {generatedSiteId}
                </h3>

                {/* Protected Preview Box */}
                <div className="relative mb-12 rounded-3xl overflow-hidden border border-white/20 bg-black shadow-2xl group">
                  <div
                    className="absolute inset-0 z-20 pointer-events-auto bg-transparent select-none"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-6 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-orbitron tracking-widest text-white/60 uppercase pointer-events-none">
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

                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                  <button
                    onClick={resetFlow}
                    className="w-full md:w-auto px-10 py-5 rounded-full border border-white/10 hover:bg-white/5 transition-all font-orbitron text-xs tracking-widest uppercase"
                  >
                    Build Another
                  </button>
                  <a
                    href="/license.html"
                    className="w-full md:w-auto px-16 py-5 rounded-full bg-cyan-500 text-black font-black font-orbitron text-sm tracking-[0.1em] shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:shadow-[0_0_60px_rgba(34,211,238,0.6)] transition-all uppercase text-center"
                  >
                    Claim Ownership
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* 3. Pricing / Licenses */}
        <section className="mt-16 border-t border-white/10 pt-16">
          <div className="text-center mb-16">
            <h2 className="font-orbitron font-black text-3xl md:text-5xl uppercase mb-4">
              Ownership Tiers
            </h2>
            <p className="text-white/40 text-lg">
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
              },
              {
                name: "Business",
                pages: "5 Pages",
                price: "$199",
                desc: "A full presence for your growing company.",
                highlight: true,
              },
              {
                name: "Enterprise",
                pages: "Unlimited",
                price: "$499",
                desc: "Maximum power and white-label options.",
              },
            ].map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className={`p-10 rounded-[2.5rem] border ${tier.highlight ? "border-cyan-500 bg-white/5 shadow-[0_0_50px_rgba(34,211,238,0.1)]" : "border-white/10 bg-white/[0.02]"}`}
              >
                <div className="font-orbitron text-xs tracking-widest text-white/40 uppercase mb-6">
                  {tier.pages}
                </div>
                <h3 className="font-orbitron text-2xl font-black mb-2">
                  {tier.name}
                </h3>
                <div className="text-4xl font-orbitron font-black mb-6">
                  {tier.price}
                </div>
                <p className="text-white/40 text-sm leading-relaxed mb-8">
                  {tier.desc}
                </p>
                <a
                  href="/license.html"
                  className={`block w-full text-center py-4 rounded-full font-orbitron text-xs tracking-widest uppercase transition-all ${tier.highlight ? "bg-white text-black font-black" : "border border-white/20 hover:bg-white/5"}`}
                >
                  Select Tier
                </a>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer simple tag */}
        <div className="mt-40 text-center opacity-20 hover:opacity-100 transition-opacity">
          <p className="font-orbitron text-[10px] tracking-[1em] uppercase">
            Sometimes it's better to keep it simple.
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;
