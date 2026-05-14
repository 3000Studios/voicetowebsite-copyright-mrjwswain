/**
 * PlaygroundGenerator — VoiceToWebsite.com
 * Upgraded: full premium HTML previews via /api/generate, scrollable iframe, watermark, media fetching, save-to-examples
 */
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Download,
  Eye,
  Globe,
  Keyboard,
  Loader2,
  Maximize2,
  Mic,
  MicOff,
  Monitor,
  RotateCcw,
  Save,
  Send,
  Shuffle,
  Sparkles,
  Smartphone,
  Wand2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { postJSON, ApiError, parseResponse } from "../lib/api";

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

interface Variation {
  id: string;
  name: string;
  mood: string;
  fontPair: string;
  palette: string[];
  qualityScore: number;
  html: string;
  promptMatch?: PromptMatch;
}

interface PromptMatch {
  passed: boolean;
  score: number;
  matched: string[];
  missing: string[];
}

interface PromptBrief {
  businessName: string;
  pageTitle: string;
  industry: string;
  audience: string;
  tone: string;
  primaryCta: string;
  requestedSections: string[];
  requiredTerms: string[];
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
    if (res.ok) return (await parseResponse<MediaResult>(res));
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
  const [mode, setMode] = useState<"prompt" | "renovate">("prompt");
  const [isLoading, setIsLoading] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [inputMode, setInputMode] = useState<"voice" | "text">("text");
  const [isListening, setIsListening] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [media, setMedia] = useState<MediaResult | null>(null);
  const [loadStage, setLoadStage] = useState(0);
  const [brief, setBrief] = useState<PromptBrief | null>(null);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const activeVariation = variations[activeIdx] ?? null;

  // Cycle the placeholder every 3.5s so the input feels alive when idle.
  useEffect(() => {
    if (prompt || isLoading || variations.length) return;
    const id = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % EXAMPLE_PROMPTS.length);
    }, 3500);
    return () => clearInterval(id);
  }, [prompt, isLoading, variations.length]);

  const startListening = useCallback(() => {
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition as (new () => BrowserSpeechRecognition) | undefined
      || (window as unknown as Record<string, unknown>).webkitSpeechRecognition as (new () => BrowserSpeechRecognition) | undefined;
    if (!SR) { alert("Voice input is not supported in this browser. Please use Chrome."); return; }
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
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
    setBrief(null);
    setError("");
    setLoadStage(1);
    try {
      const mediaResult = await fetchMedia(p);
      setMedia(mediaResult);
      setLoadStage(2);
      setLoadStage(3);
      const data = await postJSON<{ brief?: PromptBrief; variations?: Variation[]; error?: string; details?: string }>(
        "/api/generate",
        { prompt: p, imageUrls: mediaResult.gallery, videoUrl: mediaResult.videoUrl },
        { timeoutMs: 60000 }
      );
      if (!data.variations?.length) throw new Error(data.error || "No variations returned");
      setBrief(data.brief || null);
      setVariations(data.variations);
      setLoadStage(0);
      localStorage.setItem("vtw_pending_site", JSON.stringify({
        prompt: p,
        brief: data.brief || null,
        variationName: data.variations[0].name,
        html: data.variations[0].html,
        imageUrl: mediaResult.imageUrl,
        savedAt: new Date().toISOString(),
      }));
      saveToExamples(p, data.variations[0], mediaResult);
    } catch (err) {
      console.error("Generation failed:", err);
      const msg = err instanceof ApiError
        ? `${err.message}${err.status ? ` (${err.status})` : ''}`
        : err instanceof Error 
        ? err.message 
        : "Generation failed. Try a more specific prompt.";
      setError(msg);
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

  // Renovate mode: call /api/renovate with a URL. Server fetches the page,
  // extracts content, runs it through the same /api/generate pipeline, and
  // returns the same { brief, variations } shape we already render.
  const handleRenovate = useCallback(async (overrideUrl?: string) => {
    const raw = (overrideUrl ?? prompt).trim();
    if (!raw || isLoading) return;
    setIsLoading(true);
    setVariations([]);
    setActiveIdx(0);
    setMedia(null);
    setBrief(null);
    setError("");
    setLoadStage(1);
    try {
      setLoadStage(2);
      const data = await postJSON<{
        brief?: PromptBrief;
        variations?: Variation[];
        source?: { url: string; title: string; wordCount: number };
        error?: string;
        details?: string;
      }>("/api/renovate", { url: raw }, { timeoutMs: 60000 });
      if (!data.variations?.length) throw new Error(data.error || "Renovate returned no variations");
      setBrief(data.brief || null);
      setVariations(data.variations);
      setLoadStage(0);
      // Lightweight stand-in for the media we'd normally pass to saveToExamples.
      const stubMedia: MediaResult = {
        imageUrl: "",
        gallery: [],
        videoUrl: "",
      };
      saveToExamples(`Renovated: ${data.source?.url || raw}`, data.variations[0], stubMedia);
    } catch (err) {
      console.error("Renovate failed:", err);
      const msg = err instanceof ApiError
        ? `${err.message}${err.status ? ` (${err.status})` : ''}`
        : err instanceof Error
        ? err.message
        : "Renovate failed. Check the URL and try again.";
      setError(msg);
      setLoadStage(0);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading]);

  // Surprise Me: pick a random example prompt and run it.
  const handleSurprise = useCallback(() => {
    if (isLoading) return;
    const next = EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)];
    setMode("prompt");
    setPrompt(next);
    void handleGenerate(next);
  }, [isLoading, handleGenerate]);

  // Unified submit — routes to renovate or generate based on mode.
  const handleSubmit = useCallback(() => {
    if (mode === "renovate") void handleRenovate();
    else void handleGenerate();
  }, [mode, handleGenerate, handleRenovate]);

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

  const regenerateWithInstruction = (instruction: string) => {
    const nextPrompt = `${prompt.trim()}\n\nRevise the preview and focus harder on: ${instruction}.`;
    setPrompt(nextPrompt);
    void handleGenerate(nextPrompt);
  };

  const jumpPreview = (hash: string) => {
    const frameWindow = iframeRef.current?.contentWindow;
    if (frameWindow) frameWindow.location.hash = hash;
  };

  const fullscreenPreview = () => {
    void iframeRef.current?.requestFullscreen?.();
  };

  const loadStageLabels = [
    "",
    "Fetching copyright-free media for your brand...",
    "Generating premium website variations with AI...",
    "Checking prompt match, sections, and preview quality...",
  ];

  return (
    <div className={`w-full ${variant === "hero" ? "max-w-5xl" : "max-w-4xl"} mx-auto px-4`}>
      {/* Mode toggle: Prompt vs Renovate */}
      <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
        <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setMode("prompt")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === "prompt"
                ? "bg-gradient-to-r from-cyan-500/30 to-violet-600/30 border border-cyan-400/40 text-white"
                : "text-white/55 hover:text-white"
            }`}
            title="Describe a new business"
          >
            <Wand2 className="w-3.5 h-3.5" /> Describe
          </button>
          <button
            type="button"
            onClick={() => setMode("renovate")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === "renovate"
                ? "bg-gradient-to-r from-cyan-500/30 to-violet-600/30 border border-cyan-400/40 text-white"
                : "text-white/55 hover:text-white"
            }`}
            title="Renovate an existing site by URL"
          >
            <Globe className="w-3.5 h-3.5" /> Renovate URL
          </button>
        </div>
        <button
          type="button"
          onClick={handleSurprise}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-white/65 hover:text-white hover:border-white/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          title="Surprise me with a random idea"
        >
          <Shuffle className="w-3.5 h-3.5" /> Surprise me
        </button>
      </div>

      {/* Input bar */}
      <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden mb-4">
        <div className="flex items-center gap-3 p-4">
          {mode === "prompt" ? (
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
          ) : (
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-cyan-300"
              title="Renovate mode — paste a URL"
            >
              <Globe className="w-4 h-4" />
            </div>
          )}
          {mode === "prompt" ? (
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder={EXAMPLE_PROMPTS[placeholderIdx]}
              className="flex-1 bg-transparent text-white placeholder-white/35 resize-none outline-none text-sm leading-relaxed min-h-[52px] max-h-[120px]"
              rows={2}
            />
          ) : (
            <input
              type="url"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}
              placeholder="https://example.com — we fetch the page and rebuild it premium"
              className="flex-1 bg-transparent text-white placeholder-white/35 outline-none text-sm leading-relaxed h-[52px]"
              autoComplete="url"
              spellCheck={false}
            />
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!prompt.trim() || isLoading}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isLoading ? "Building..." : mode === "renovate" ? "Renovate" : "Generate"}
          </button>
        </div>
        {mode === "prompt" && !variations.length && !isLoading && (
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

      {error && (
        <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          <div className="font-bold">Generation needs another pass</div>
          <div className="mt-1 text-red-100/75">{error}</div>
        </div>
      )}

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

            {brief && (
              <div className="grid gap-4 border-b border-white/10 bg-white/[0.025] p-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="mb-3 flex items-center gap-2 text-cyan-200">
                    <Wand2 className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-[0.24em]">Prompt Brief</span>
                  </div>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <BriefField label="Business" value={brief.businessName} />
                    <BriefField label="Industry" value={brief.industry} />
                    <BriefField label="Tone" value={brief.tone} />
                    <BriefField label="CTA" value={brief.primaryCta} />
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Requested content</div>
                    <div className="flex flex-wrap gap-2">
                      {brief.requestedSections.slice(0, 8).map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => regenerateWithInstruction(item)}
                          className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100 hover:border-cyan-200/50"
                          title={`Regenerate with stronger focus on ${item}`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-emerald-200">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-black uppercase tracking-[0.24em]">Prompt Match</span>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${activeVariation?.promptMatch?.passed ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-200"}`}>
                      {activeVariation?.promptMatch?.score ?? 0}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(activeVariation?.promptMatch?.matched || []).map((item) => (
                      <span key={item} className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                        {item}
                      </span>
                    ))}
                    {(activeVariation?.promptMatch?.missing || []).map((item) => (
                      <button key={item} type="button" onClick={() => regenerateWithInstruction(item)} className="rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">
                        Missing: {item}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => regenerateWithInstruction("all missing prompt details")} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:text-white">
                      <RotateCcw className="h-3.5 w-3.5" /> Regenerate match
                    </button>
                    <button type="button" onClick={() => regenerateWithInstruction("more premium graphics, stronger cards, and richer section copy")} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:text-white">
                      <Sparkles className="h-3.5 w-3.5" /> Upgrade graphics
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Scrollable iframe preview */}
            {activeVariation && (
              <div className="relative bg-black/35 p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <Eye className="w-3 h-3" /> Live Preview — Scroll to explore
                </div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {["services", "gallery", "pricing", "contact"].map((section) => (
                      <button key={section} type="button" onClick={() => jumpPreview(section)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold capitalize text-white/65 hover:text-white">
                        {section}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setPreviewMode("desktop")} className={`rounded-lg border px-3 py-1.5 text-xs ${previewMode === "desktop" ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-white/5 text-white/60"}`}>
                      <Monitor className="mr-1 inline h-3.5 w-3.5" /> Desktop
                    </button>
                    <button type="button" onClick={() => setPreviewMode("mobile")} className={`rounded-lg border px-3 py-1.5 text-xs ${previewMode === "mobile" ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-white/5 text-white/60"}`}>
                      <Smartphone className="mr-1 inline h-3.5 w-3.5" /> Mobile
                    </button>
                    <button type="button" onClick={fullscreenPreview} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:text-white">
                      <Maximize2 className="mr-1 inline h-3.5 w-3.5" /> Full
                    </button>
                  </div>
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
                <div className="mx-auto overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl" style={{ maxWidth: previewMode === "mobile" ? 390 : "100%" }}>
                  <iframe
                    ref={iframeRef}
                    srcDoc={activeVariation.html}
                    title={`Preview: ${activeVariation.name}`}
                    className="w-full border-0"
                    style={{ height: previewMode === "mobile" ? "880px" : "820px" }}
                    sandbox="allow-scripts allow-same-origin"
                    loading="lazy"
                  />
                </div>
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
                <Link to="/pricing?source=generator" className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold text-sm hover:opacity-90 transition-all">Get My Site</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}`}</style>
    </div>
  );
}

const BriefField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">{label}</div>
    <div className="mt-1 text-white/85">{value}</div>
  </div>
);

export default PlaygroundGenerator;
