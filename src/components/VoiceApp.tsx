import confetti from "canvas-confetti";
import {
  Cpu,
  Layout,
  Mic,
  Monitor,
  Smartphone,
  Tablet,
  Volume2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { NeuralGlobe } from "./NeuralGlobe";

import { useAuth } from "@/context/AuthContext";
import { compileLayoutFromPrompt } from "@/lib/layoutCompiler";
import { useSound } from "@/lib/sounds";

import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { PLAN_LIMITS, PlanType } from "@/constants/plans";
import { GoogleGenAI } from "@google/genai";
import { FizzyButton } from "./ui/FizzyButton";

export const VoiceApp = ({
  isEditing = false,
  existingHtml = null as string | null,
  onUpdateHtml = (html: string) => {},
}) => {
  const { user, isOwnerAdmin } = useAuth();
  const { playClick, playSuccess, playZap, playTick } = useSound();
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(existingHtml);
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">(
    "desktop",
  );
  const [genError, setGenError] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("vtw_cmd_count") || 0);
    }
    return 0;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vtw_cmd_count", generationCount.toString());
    }
  }, [generationCount]);
  const [showPaywall, setShowPaywall] = useState(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
  });

  // Get plan type (default to free)
  const planType: PlanType = (user as any)?.plan || "free";
  const limits = PLAN_LIMITS[planType];

  useEffect(() => {
    if (existingHtml) setPreviewHtml(existingHtml);
  }, [existingHtml]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        silenceTimerRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        }, 3000);

        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setInput((prev) => prev + (prev ? " " : "") + finalTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "no-speech") {
          // Ignore no-speech drift, just stop
        }
      };
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const toggleListening = () => {
    playClick();
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInput("");
      setGenError(null);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start recognition:", err);
      }
    }
  };

  const handleGenerate = async (text: string = input) => {
    if (!text.trim()) return;
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      setGenError("Generator is not configured. Missing VITE_GEMINI_API_KEY.");
      return;
    }

    // Enforce limits
    if (!isOwnerAdmin && generationCount >= limits.commandsPerCycle) {
      setGenError(
        `Neural limit reached for ${limits.name}. Upgrade to Pro for continued architectural access.`,
      );
      setShowPaywall(true);
      return;
    }

    setIsGenerating(true);
    setGenError(null);
    playZap();

    try {
      const compiled = compileLayoutFromPrompt(text);
      let fullPrompt = "";
      const monetizationContext = `
        STRATEGIC DIRECTIVE: You are a Revenue Engineer.
        ARCHITECTURE DIRECTIVE: You are a Layout Compiler, not a string generator.
        OUTPUT MODEL: Use a 12-column grid. Every generated section must map to a component with order and grid_span metadata.
        FLOWBITE DIRECTIVE: Use Flowbite-compatible Tailwind HTML patterns, Flowbite Icons-style SVGs, and include Flowbite CDN assets.
        GRID RULES: Hero col-span-12. Three features use grid-cols-1 md:grid-cols-3 gap-8. Dashboard/app requests use sidebar col-span-3 and main col-span-9.
        PRIORITIZE: High-conversion layouts, strong CTAs, pricing sections, and urgency triggers.
        AUTO-INJECT: A 'Built with VoiceToWebsite' badge in the footer on the free plan.
        STRIPE READY: If the user mentions money, sales, or products, add a distinctive 'Buy Now' button styled for maximum click-through.
        REVENUE TRIGGER: If the user says "create product", inject a high-conversion product block with a price of $49 and a massive 'BUY NOW' button that links to /checkout.
        BASE LAYOUT TREE:
        ${JSON.stringify(compiled.tree)}
      `;

      if (isEditing && previewHtml) {
        fullPrompt = `${monetizationContext}
        I have this existing HTML code from VoiceToWebsite.com:

        ${previewHtml}

        The user wants to make the following modification using their voice: "${text}".

        Apply elite, high-conversion design principles. Rewrite the FULL HTML.
        Use Tailwind CSS via CDN. Return ONLY the raw HTML code without markdown backticks.`;
      } else {
        fullPrompt = `${monetizationContext}
        Generate a world-class, REVENUE-FIXATED, single-file HTML website for: ${text}.
        This is for VoiceToWebsite.com, an elite AI-powered building engine.
        Use Tailwind CSS via CDN and Flowbite 4.0.1 CDN.
        Ensure the design is ultra-premium, conversion-focused, and mobile-responsive.
        Use the provided BASE LAYOUT TREE as the source of truth for section order, grid_span, and app/sidebar placement.
        Do not output generic default copy. Replace every placeholder with content inferred from: "${text}".
        Include a <script type="application/json" id="vtw-storyblok-blok-tree"> node containing the final Blok tree.
        Return ONLY the raw HTML code without any markdown formatting or backticks.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: fullPrompt }] }],
      });

      let html = response.text || "";

      // Clean up potential markdown formatting
      html = html
        .replace(/```html/g, "")
        .replace(/```/g, "")
        .trim();

      // Add Watermark if free
      if (!isOwnerAdmin && !limits.removeWatermark && !html.includes('id="vtw-watermark"')) {
        const watermark = `<div id="vtw-watermark" style="position:fixed;bottom:20px;right:20px;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);color:white;padding:10px 20px;border-radius:100px;font-family:Inter,sans-serif;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;border:1px solid rgba(255,255,255,0.1);z-index:9999;box-shadow:0 10px 30px rgba(0,0,0,0.5);">Built with <span style="color:#6366f1">VoiceToWebsite.com</span></div>`;
        html = html.replace("</body>", `${watermark}</body>`) || html;
      }

      if (!html.includes("<!DOCTYPE html>") && !html.includes("<html")) {
        html = compiled.html;
      }

      if (!html.includes("vtw-storyblok-blok-tree") || !html.includes("grid-cols-12")) {
        html = compiled.html;
      }

      setPreviewHtml(html);
      onUpdateHtml(html);
      setGenerationCount((prev) => prev + 1);
      playSuccess();

      // Force Value Moment
      setTimeout(() => {
        alert("🔥 Your website is ready. Now publish & start earning.");
      }, 3000);

      if (user) {
        try {
          await addDoc(collection(db, "sites"), {
            html,
            ownerId: user.uid,
            timestamp: serverTimestamp(),
            isDraft: true,
            title: `Neural Build ${new Date().toLocaleTimeString()}`,
          });
        } catch (saveErr) {
          console.error(saveErr);
        }
      }

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#ffffff", "#4f46e5"],
      });
    } catch (error: any) {
      console.error("Generation error:", error);
      setGenError(error.message || "Neural Sync Failed");
    } finally {
      setIsGenerating(false);
      setInput("");
    }
  };

  return (
    <div className="w-full space-y-12">
      {/* UI Overlay Controls */}
      <div className="glass-blur p-8 md:p-12 brutal-shadow border-t border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-indigo-600 to-transparent" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isListening ? "bg-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]" : "bg-white/5 border border-white/10"}`}
              >
                <Volume2
                  size={24}
                  className={isListening ? "text-white" : "text-slate-500"}
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] italic">
                  Vocal Sync Active
                </h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest italic leading-none">
                  Neural Power:{" "}
                  <span
                    className={
                      generationCount >= limits.commandsPerCycle
                        ? "text-red-500"
                        : "text-emerald-500"
                    }
                  >
                    {limits.commandsPerCycle - generationCount} Command
                    {limits.commandsPerCycle - generationCount !== 1 ? "s" : ""}{" "}
                    Remaining
                  </span>
                </p>
              </div>
            </div>

            <div className="relative group">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isEditing ? "Modify..." : "Voice Build..."}
                className="w-full bg-black/40 border-b-2 border-white/5 text-white h-16 md:h-20 px-4 md:px-8 focus:border-indigo-500 outline-none transition-all font-mono text-lg md:text-xl placeholder:text-slate-700 uppercase tracking-widest italic"
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
              <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
                <button
                  onClick={toggleListening}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${isListening ? "bg-red-500 text-white" : "hover:bg-white hover:text-black text-slate-500"}`}
                >
                  <Mic size={18} />
                </button>
                <FizzyButton
                  label={isGenerating ? "SYNCING..." : "LAUNCH"}
                  onClick={() =>
                    !isGenerating && input.trim() && handleGenerate()
                  }
                  className="scale-75 origin-right"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest italic flex items-center gap-2">
                Strategic Protocols:
              </span>
              <div className="flex flex-wrap gap-3">
                {[
                  "Launch Empire Store",
                  "Add Pro Paywall",
                  "Neural Layout",
                  "Optimize ROI",
                ].map((hint) => (
                  <button
                    key={hint}
                    onClick={() => {
                      playTick();
                      setInput(hint);
                    }}
                    className="px-6 py-2 bg-white/5 border border-white/10 hover:border-indigo-500 hover:bg-indigo-500/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all italic rounded-sm"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>

            {genError && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-red-500 tracking-widest italic">
                  Neural Sync Failed: {genError}
                </span>
                <button
                  onClick={() => setGenError(null)}
                  className="ml-auto text-red-500/40 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-4 flex items-center justify-center h-48 lg:h-64">
            <motion.div
              animate={isListening ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-48 h-48 lg:w-64 lg:h-64 flex items-center justify-center relative group select-none cursor-pointer"
              onClick={toggleListening}
            >
              <div
                className={`absolute inset-0 rounded-full border border-indigo-600/10 ${isListening ? "animate-ping" : ""}`}
              />
              <div className="w-full h-full relative z-10 transition-all duration-500 group-hover:scale-110">
                <NeuralGlobe />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <AnimatePresence mode="wait">
        {previewHtml ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row items-center justify-between glass-blur p-4 border border-white/5">
              <div className="flex items-center gap-6">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-800" />
                  <div className="w-3 h-3 rounded-full bg-slate-800" />
                  <div className="w-3 h-3 rounded-full bg-slate-800" />
                </div>
                <div className="text-[10px] font-mono text-indigo-500 uppercase tracking-widest font-black flex items-center gap-2">
                  <Monitor size={14} /> LIVE NEURAL PREVIEW
                </div>
              </div>

              <div className="flex bg-black/40 p-1 border border-white/5">
                {[
                  { id: "desktop", icon: Monitor },
                  { id: "tablet", icon: Tablet },
                  { id: "mobile", icon: Smartphone },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id as any)}
                    className={`p-3 transition-all ${viewMode === mode.id ? "bg-indigo-600 text-white shadow-xl" : "text-slate-600 hover:text-white"}`}
                  >
                    <mode.icon size={18} />
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`mx-auto transition-all duration-700 metal-gothic-border group relative ${
                viewMode === "desktop"
                  ? "w-full h-[800px]"
                  : viewMode === "tablet"
                    ? "w-full max-w-[768px] h-[800px]"
                    : "w-full max-w-[375px] h-[600px] md:h-[800px]"
              }`}
            >
              {/* Generation Effects Overlay */}
              <AnimatePresence>
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-40 bg-black/60 pointer-events-none overflow-hidden"
                  >
                    {/* Circling Lightning */}
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          rotate: [0, 360],
                          scale: [1, 1.2, 1],
                          borderColor: ["#6366f1", "#ffffff", "#6366f1"],
                        }}
                        transition={{
                          duration: 3 + i,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="absolute inset-[-50%] border-4 border-dashed border-indigo-500 rounded-full opacity-30"
                      />
                    ))}
                    {/* Sparks */}
                    {[...Array(10)].map((_, i) => (
                      <motion.div
                        key={`spark-${i}`}
                        initial={{ x: "50%", y: "50%", scale: 0 }}
                        animate={{
                          x: [
                            `${Math.random() * 100}%`,
                            `${Math.random() * 100}%`,
                          ],
                          y: [
                            `${Math.random() * 100}%`,
                            `${Math.random() * 100}%`,
                          ],
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 0.5 + Math.random(),
                          repeat: Infinity,
                          delay: Math.random(),
                        }}
                        className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]"
                      />
                    ))}
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                      <Cpu className="text-white animate-spin-slow" size={48} />
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white italic ultra-glow">
                        Building Digital Reality...
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Explosion Effect when done */}
              <AnimatePresence>
                {!isGenerating && previewHtml && (
                  <motion.div
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 0, scale: 2 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute inset-0 z-30 bg-white mix-blend-screen pointer-events-none"
                    onAnimationComplete={() => {
                      confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                      });
                    }}
                  />
                )}
              </AnimatePresence>

              <iframe
                srcDoc={previewHtml}
                className="w-full h-full border-none bg-white"
                title="Manifest Preview"
                sandbox="allow-scripts"
              />

              {/* Scanline Overlay */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_0%,rgba(79,70,229,0.02)_50%,transparent_100%)] bg-size-[100%_4px] opacity-20" />
            </div>
          </motion.div>
        ) : (
          <div className="aspect-video bg-black rounded-3xl overflow-hidden relative group/preview">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-60"
            >
              <source src="/input_file_7.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 text-center p-12">
              <div className="w-24 h-24 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center animate-pulse">
                <Layout size={40} className="text-indigo-400" />
              </div>
              <div className="space-y-4">
                <p className="text-xl font-black uppercase italic tracking-tighter text-white ultra-glow">
                  Neutral Output Awaiting Vector Input
                </p>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.5em]">
                  Speak to Launch Reality
                </p>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaywall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-2000 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
          >
            <div className="max-w-md w-full glass-premium p-12 text-center space-y-8 brutal-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-500 via-indigo-500 to-red-500" />
              <div className="space-y-4">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">
                  🔥 You Hit The Limit
                </h2>
                <p className="text-slate-400 font-light italic">
                  Unlock unlimited websites, elite neural building, and
                  high-conversion monetization tools.
                </p>
              </div>

              <div className="py-6 scale-110">
                <FizzyButton
                  label="UPGRADE NOW"
                  onClick={() => (window.location.href = "/pricing")}
                />
              </div>

              <button
                onClick={() => setShowPaywall(false)}
                className="text-[10px] font-black uppercase tracking-[0.4em] opacity-20 hover:opacity-100 transition-opacity"
              >
                Stay Limited
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
