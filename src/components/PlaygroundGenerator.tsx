/**
 * PlaygroundGenerator — VoiceToWebsite.com
 * Upgraded: full premium HTML previews via /api/generate, scrollable iframe, watermark, media fetching, save-to-examples
 */
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Keyboard,
  Loader2,
  Mic,
  MicOff,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

interface Variation {
  id: string;
  name: string;
  mood: string;
  fontPair: string;
  palette: string[];
  qualityScore: number;
  html: string;
}

interface MediaResult {
  imageUrl: string;
  gallery: string[];
  videoUrl: string;
}

const EXAMPLE_PROMPTS = [
  "Create a luxury salon website for Halo Beauty Studio with a hero video and booking section",
  "Build a fitness landing page for Iron Pulse Gym with bold neon colors and trainer highlights",
  "Make a modern coffee website for Ember Roast with warm tones and product cards",
  "Design a law firm website for Sterling Legal Group with a dark professional theme",
  "Create a restaurant website for Casa Fuego with a vibrant food gallery and reservation form",
];

async function fetchMedia(query: string): Promise<MediaResult> {
  try {
    const res = await fetch(`/api/media?q=${encodeURIComponent(query)}`);
    if (res.ok) return (await res.json()) as MediaResult;
  } catch { /* fall through */ }
  return {
    imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80",
    ],
    videoUrl: "https://cdn.coverr.co/videos/coverr-working-in-a-modern-office-1565/1080p.mp4",
  };
}

function saveToExamples(prompt: string, variation: Variation, media: MediaResult): void {
  try {
    const stored = JSON.parse(localStorage.getItem("vtw_examples") || "[]") as Array<{
      id: string; prompt: string; name: string; html: string; imageUrl: string; savedAt: string;
    }>;
    const entry = {
      id: `gen-${Date.now()}`,
      prompt,
      name: variation.name,
      html: variation.html,
      imageUrl: media.imageUrl,
      savedAt: new Date().toISOString(),
    };
    const filtered = stored.filter((e) => e.prompt !== prompt);
    filtered.unshift(entry);
    localStorage.setItem("vtw_examples", JSON.stringify(filtered.slice(0, 50)));
  } catch { /* non-critical */ }
}

export function PlaygroundGenerator({ variant = "default" }: { variant?: "default" | "hero" }) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [inputMode, setInputMode] = useState<"voice" | "text">("text");
  const [isListening, setIsListening] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [media, setMedia] = useState<MediaResult | null>(null);
  const [loadStage, setLoadStage] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const activeVariation = variations[activeIdx] ?? null;

  const startListening = useCallback(() => {
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition as (new () => SpeechRecognition) | undefined
      || (window as unknown as Record<string, unknown>).webkitSpeechRecognition as (new () => SpeechRecognition) | undefined;
    if (!SR) { alert("Voice input is not supported in this browser. Please use Chrome."); return; }
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results[0][0].transcript;
      setPrompt((prev) => prev ? `${prev} ${t}` : t);
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleGenerate = useCallback(async (overridePrompt?: string) => {
    const p = (overridePrompt ?? prompt).trim();
    if (!p || isLoading) return;
    setIsLoading(true);
    setVariations([]);
    setActiveIdx(0);
    setMedia(null);
    setLoadStage(1);
    try {
      const mediaResult = await fetchMedia(p);
      setMedia(mediaResult);
      setLoadStage(2);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, imageUrls: mediaResult.gallery, videoUrl: mediaResult.videoUrl }),
      });
      setLoadStage(3);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json() as { variations?: Variation[]; error?: string };
      if (!data.variations?.length) throw new Error(data.error || "No variations returned");
      setVariations(data.variations);
      setLoadStage(0);
      saveToExamples(p, data.variations[0], mediaResult);
    } catch (err) {
      console.error("Generation failed:", err);
      setLoadStage(0);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void handleGenerate();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleGenerate]);

  const handleSave = () => {
    if (!activeVariation || !media) return;
    saveToExamples(prompt, activeVariation, media);
    setSavedMsg("Saved to Examples!");
    setTimeout(() => setSavedMsg(""), 2500);
  };

  const handleDownload = () => {
    if (!activeVariation) return;
    const blob = new Blob([activeVariation.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeVariation.name.replace(/\s+/g, "-").toLowerCase()}-preview.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadStageLabels = [
    "",
    "Fetching copyright-free media for your brand...",
    "Generating premium website variations with AI...",
    "Compiling full HTML, CSS, and animations...",
  ];

  return (
    <div className={`w-full ${variant === "hero" ? "max-w-5xl" : "max-w-4xl"} mx-auto px-4`}>
      {/* Input bar */}
      <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden mb-4">
        <div className="flex items-center gap-3 p-4">
          <button
            type="button"
            onClick={() => {
              if (inputMode === "voice") { setInputMode("text"); stopListening(); }
              else { setInputMode("voice"); startListening(); }
            }}
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isListening
                ? "bg-red-500/20 border border-red-400/50 text-red-400 animate-pulse"
                : "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/30"
            }`}
            title={inputMode === "voice" ? "Stop listening" : "Use voice input"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : inputMode === "voice" ? <Mic className="w-4 h-4" /> : <Keyboard className="w-4 h-4" />}
          </button>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleGenerate(); } }}
            placeholder='Describe your business... e.g. "A luxury spa called Serenity Haven with a dark theme and booking form"'
            className="flex-1 bg-transparent text-white placeholder-white/35 resize-none outline-none text-sm leading-relaxed min-h-[52px] max-h-[120px]"
            rows={2}
          />
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={!prompt.trim() || isLoading}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isLoading ? "Building..." : "Generate"}
          </button>
        </div>
        {!variations.length && !isLoading && (
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => { setPrompt(ex); void handleGenerate(ex); }}
                className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/55 hover:text-white hover:border-white/25 transition-all"
              >
                {ex.length > 55 ? ex.slice(0, 55) + "\u2026" : ex}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center mb-4"
          >
            <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-4 animate-pulse" />
            <p className="text-white/80 text-sm font-medium">{loadStageLabels[loadStage] || "Generating..."}</p>
            <div className="mt-4 flex justify-center gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-cyan-400" style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {variations.length > 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex items-center justify-between gap-2 p-4 border-b border-white/10 flex-wrap">
              <div className="flex gap-2 flex-wrap">
                {variations.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      i === activeIdx
                        ? "bg-gradient-to-r from-cyan-500/30 to-violet-600/30 border border-cyan-400/50 text-white"
                        : "border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/25"
                    }`}
                  >
                    {v.name} <span className="ml-1 text-xs opacity-60">{v.mood}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {savedMsg && <span className="text-xs text-green-400 font-medium">{savedMsg}</span>}
                <button type="button" onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white text-xs transition-all">
                  <Save className="w-3.5 h-3.5" /> Save to Examples
                </button>
                <button type="button" onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white text-xs transition-all">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>

            {/* Palette strip */}
            {activeVariation && (
              <div className="flex items-center gap-3 px-4 py-2 border-b border-white/10">
                <div className="flex gap-1.5">
                  {activeVariation.palette.map((c) => (
                    <div key={c} className="w-5 h-5 rounded-full border border-white/20" style={{ background: c }} title={c} />
                  ))}
                </div>
                <span className="text-xs text-white/50">{activeVariation.fontPair}</span>
                <span className="ml-auto text-xs text-cyan-400 font-semibold">Quality: {activeVariation.qualityScore}/100</span>
              </div>
            )}

            {/* Scrollable iframe preview */}
            {activeVariation && (
              <div className="relative">
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/15 rounded-full px-3 py-1.5 text-xs text-white/70 pointer-events-none">
                  <Eye className="w-3 h-3" /> Live Preview — Scroll to explore
                </div>
                {variations.length > 1 && (
                  <>
                    <button type="button" onClick={() => setActiveIdx((i) => (i - 1 + variations.length) % variations.length)} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/70 hover:text-white transition-all">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setActiveIdx((i) => (i + 1) % variations.length)} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/70 hover:text-white transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
                <iframe
                  ref={iframeRef}
                  srcDoc={activeVariation.html}
                  title={`Preview: ${activeVariation.name}`}
                  className="w-full border-0"
                  style={{ height: "680px" }}
                  sandbox="allow-scripts allow-same-origin"
                  loading="lazy"
                />
              </div>
            )}

            {/* CTA footer */}
            <div className="p-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-cyan-500/5 to-violet-600/5">
              <div>
                <p className="text-white font-semibold text-sm">Love what you see?</p>
                <p className="text-white/55 text-xs mt-0.5">Purchase a plan to get your full custom-coded site — no watermark, full ownership.</p>
              </div>
              <div className="flex gap-3">
                <Link to="/examples" className="px-4 py-2 rounded-xl border border-white/15 text-white/70 text-sm hover:text-white hover:border-white/30 transition-all">View Examples</Link>
                <Link to="/pricing" className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold text-sm hover:opacity-90 transition-all">Get My Site</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}`}</style>
    </div>
  );
}

export default PlaygroundGenerator;
