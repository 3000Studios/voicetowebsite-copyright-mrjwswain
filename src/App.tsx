import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import AudioWaveform from "./components/AudioWaveform";
import SiteOpener from "./components/SiteOpener";
import WarpTunnel from "./components/WarpTunnel";
import { HOME_VIDEO, INTRO_SONG } from "./constants";
import { audioEngine } from "./services/audioEngine";

const App: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const [showOpener, setShowOpener] = useState(false);
  const audioPrefRef = useRef<"on" | "off" | null>(null);
  const audioPlayingRef = useRef(false);

  // Core State
  const [tryPrompt, setTryPrompt] = useState("");
  const [flowPhase, setFlowPhase] = useState<"idle" | "listening" | "confirm" | "generating" | "result">("idle");
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState("");
  const [generatedSiteId, setGeneratedSiteId] = useState("");
  const [generateError, setGenerateError] = useState("");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    try {
      // Show opener once per tab session.
      const seen = sessionStorage.getItem("vtw-opener-seen") === "1";
      setShowOpener(!seen);
    } catch (_) {
      setShowOpener(true);
    }
  }, []);

  // Initialize Speech Recognition
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
    recognition.onend = () => {
      if (flowPhase === "listening") setFlowPhase("confirm");
    };
    recognition.onerror = () => {
      setFlowPhase("idle");
    };
    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (_) {}
    };
  }, [flowPhase]);

  // Audio Control
  useEffect(() => {
    // Fixed volume for now; can be promoted to UI control later.
    audioEngine.setVolume(0.6);
  }, []);

  // Best-effort autoplay. Browsers often block sound without a user gesture, so we:
  // 1) try once immediately, and
  // 2) retry on the first user interaction (pointer/key) unless the user turned audio off.
  useEffect(() => {
    let cancelled = false;

    const loadPref = () => {
      try {
        const raw = String(localStorage.getItem("vtw-audio-pref") || "").toLowerCase();
        if (raw === "off") return "off";
        if (raw === "on") return "on";
      } catch (_) {}
      return null;
    };

    audioPrefRef.current = loadPref();

    const tryStart = async () => {
      if (audioPrefRef.current === "off") return;
      await audioEngine.enable();
      const ok = await audioEngine.playMusic(INTRO_SONG);
      if (cancelled) return;
      audioPlayingRef.current = ok;
      setIsAudioPlaying(ok);
    };

    const onFirstGesture = async () => {
      if (audioPrefRef.current === "off") return;
      if (audioPlayingRef.current) return;
      await audioEngine.enable();
      const ok = await audioEngine.playMusic(INTRO_SONG);
      audioPlayingRef.current = ok;
      setIsAudioPlaying(ok);
    };

    // Attempt immediately (may be blocked).
    tryStart().catch(() => {});

    // Retry on first interaction.
    document.addEventListener("pointerdown", onFirstGesture, { capture: true, once: true });
    document.addEventListener("keydown", onFirstGesture, { capture: true, once: true });

    return () => {
      cancelled = true;
      document.removeEventListener("pointerdown", onFirstGesture, true);
      document.removeEventListener("keydown", onFirstGesture, true);
    };
  }, []);

  const toggleAudio = async () => {
    await audioEngine.enable();
    if (isAudioPlaying) {
      audioEngine.stopMusic();
      audioPlayingRef.current = false;
      setIsAudioPlaying(false);
      audioPrefRef.current = "off";
      try {
        localStorage.setItem("vtw-audio-pref", "off");
      } catch (_) {}
    } else {
      const ok = await audioEngine.playMusic(INTRO_SONG);
      audioPlayingRef.current = ok;
      setIsAudioPlaying(ok);
      audioPrefRef.current = ok ? "on" : null;
      try {
        if (ok) localStorage.setItem("vtw-audio-pref", "on");
      } catch (_) {}
    }
  };

  // Actions
  const startMic = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    setTryPrompt("");
    setFlowPhase("listening");
    try {
      recognitionRef.current.start();
    } catch (_) {}
  };

  const stopMic = () => {
    try {
      recognitionRef.current.stop();
    } catch (_) {}
    setFlowPhase("confirm");
  };

  const resetFlow = () => {
    setFlowPhase("idle");
    setTryPrompt("");
    setGeneratedPreviewUrl("");
    setGeneratedSiteId("");
    setGenerateError("");
    audioEngine.stopMusic();
    audioPlayingRef.current = false;
    setIsAudioPlaying(false);
  };

  const generateSite = async () => {
    if (!tryPrompt.trim()) return;

    setFlowPhase("generating");
    setGenerateError("");

    // Play the song as requested
    await audioEngine.enable();
    const ok = await audioEngine.playMusic(INTRO_SONG);
    audioPlayingRef.current = ok;
    setIsAudioPlaying(ok);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: tryPrompt, tone: "default" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Generate failed (HTTP ${res.status})`);

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
      <SiteOpener
        show={showOpener}
        reduceMotion={Boolean(reduceMotion)}
        onDone={() => {
          try {
            sessionStorage.setItem("vtw-opener-seen", "1");
          } catch (_) {}
          setShowOpener(false);
        }}
      />

      <WarpTunnel isVisible={!reduceMotion && flowPhase === "generating"} />

      {/* Background atmosphere */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none opacity-30">
        {reduceMotion ? (
          <div
            className="w-full h-full brightness-50"
            style={{
              backgroundImage: "url(/vtw-wallpaper.png)",
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
          >
            <source src={HOME_VIDEO} type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      {/* Persistent audio control */}
      <div className="fixed top-6 right-6 z-[160] flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full">
        <button type="button" onClick={toggleAudio} className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isAudioPlaying ? "bg-cyan-400 animate-pulse" : "bg-white/20"}`} />
          <span className="font-orbitron text-[10px] tracking-widest text-white/60 uppercase">
            {isAudioPlaying ? "VOICE ON" : "VOICE OFF"}
          </span>
        </button>
      </div>

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
            The world's first one-command website engine. No steps. No crap. Just your voice.
          </motion.p>
        </div>

        {/* 1. Video on top */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-20 rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-white/5 p-2"
        >
          <div className="relative aspect-video rounded-2xl overflow-hidden group">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            >
              <source src="https://media.voicetowebsite.com/homenavigation.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="font-orbitron tracking-widest text-xs">How it works</span>
            </div>
          </div>
        </motion.section>

        {/* 2. Example below video / Integrated with Flow */}
        <section className="relative z-20">
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-16 shadow-[0_0_100px_rgba(34,211,238,0.1)]">
            <AnimatePresence mode="wait">
              {flowPhase === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="mb-10">
                    <h2 className="font-orbitron text-2xl mb-4 font-bold">Example: Build a Portfolio</h2>
                    <p className="text-white/40 italic">
                      "Make a luxury portfolio for a photographer with a dark theme and gallery."
                    </p>
                  </div>

                  <button
                    onClick={startMic}
                    className="group relative inline-flex items-center justify-center p-1 overflow-hidden font-medium text-indigo-600 transition duration-300 ease-out rounded-full shadow-xl"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700"></span>
                    <span className="absolute bottom-0 right-0 block w-64 h-64 mb-32 mr-4 transition duration-500 origin-bottom-left transform rotate-45 translate-x-24 bg-pink-500 rounded-full opacity-30 group-hover:rotate-90 ease"></span>
                    <span className="relative flex flex-col items-center justify-center w-48 h-48 bg-black rounded-full text-white group-hover:text-cyan-400 transition-colors">
                      <svg className="w-12 h-12 mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 005.93 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-1.93v-2.07z" />
                      </svg>
                      <span className="font-orbitron tracking-widest text-sm uppercase">Tap to Speak</span>
                    </span>
                  </button>
                </motion.div>
              )}

              {flowPhase === "listening" && (
                <motion.div
                  key="listening"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="text-center py-10"
                >
                  <div className="mb-12">
                    <AudioWaveform active={true} mode="opener" className="mx-auto scale-150" />
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
                  <h3 className="text-3xl font-orbitron mb-4 font-black">Are you ready?</h3>
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
                  <div className="text-sm font-orbitron tracking-[0.4em] text-green-400 uppercase mb-8">Success</div>
                  <h3 className="text-3xl font-orbitron mb-10 font-black">Site Identity: {generatedSiteId}</h3>

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
                      <iframe
                        src={generatedPreviewUrl}
                        className="w-full h-[500px] border-none grayscale-[0.2]"
                        title="Website Preview"
                      />
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
          </div>
        </section>

        {/* 3. Pricing / Licenses */}
        <section className="mt-32 border-t border-white/10 pt-32">
          <div className="text-center mb-16">
            <h2 className="font-orbitron font-black text-3xl md:text-5xl uppercase mb-4">Ownership Tiers</h2>
            <p className="text-white/40 text-lg">Transparent pricing for autonomous engineering.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Solo", pages: "1 Page", price: "$49", desc: "For single landing pages or personal brands." },
              {
                name: "Business",
                pages: "5 Pages",
                price: "$199",
                desc: "A full presence for your growing company.",
                highlight: true,
              },
              { name: "Enterprise", pages: "Unlimited", price: "$499", desc: "Maximum power and white-label options." },
            ].map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className={`p-10 rounded-[2.5rem] border ${tier.highlight ? "border-cyan-500 bg-white/5 shadow-[0_0_50px_rgba(34,211,238,0.1)]" : "border-white/10 bg-white/[0.02]"}`}
              >
                <div className="font-orbitron text-xs tracking-widest text-white/40 uppercase mb-6">{tier.pages}</div>
                <h3 className="font-orbitron text-2xl font-black mb-2">{tier.name}</h3>
                <div className="text-4xl font-orbitron font-black mb-6">{tier.price}</div>
                <p className="text-white/40 text-sm leading-relaxed mb-8">{tier.desc}</p>
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
          <p className="font-orbitron text-[10px] tracking-[1em] uppercase">Sometimes it's better to keep it simple.</p>
        </div>
      </main>
    </div>
  );
};

export default App;
