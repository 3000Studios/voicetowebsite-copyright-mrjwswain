import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { fetchJSON, postJSON, ApiError } from "../lib/api";
import { generateWebsiteVariations, WebsiteConfig } from "../services/aiService";
import { cn } from "../lib/utils";

type EngineId = "gemini" | "layout" | "fallback";

interface EngineResult {
  html: string;
  meta?: Record<string, unknown>;
  variations?: Array<{ id?: string; name?: string; mood?: string; html: string }>;
  raw?: unknown;
}

const ENGINES: { id: EngineId; name: string; subtitle: string; description: string }[] = [
  {
    id: "gemini",
    name: "Gemini Generator",
    subtitle: "/api/generate · Gemini 2.0 Flash",
    description:
      "Cloudflare Pages Function that calls Gemini 2.0 Flash with an elite-designer system prompt and falls back to industry templates if the model is unavailable.",
  },
  {
    id: "layout",
    name: "Layout Compiler",
    subtitle: "/api/generate-site · template engine",
    description:
      "Deterministic, no-LLM engine. Compiles a layout tree from brand assets (Brandfetch), stock media (Unsplash/Pexels), and industry templates.",
  },
  {
    id: "fallback",
    name: "Client Fallback",
    subtitle: "aiService · 3 baked variations",
    description:
      "Frontend service that calls /api/generate and gracefully returns three handcrafted HTML variations if the backend fails.",
  },
];

export default function EngineTester() {
  const [activeEngine, setActiveEngine] = useState<EngineId>("gemini");
  const [prompt, setPrompt] = useState(
    "Build a website for a luxury Italian bistro called Sera with dark theme, online reservations, and a wine room",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EngineResult | null>(null);
  const [activeVariation, setActiveVariation] = useState(0);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  const runEngine = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setActiveVariation(0);
    const start = performance.now();

    try {
      if (activeEngine === "gemini") {
        const data = await postJSON<{
          variations?: Array<{ id?: string; name?: string; mood?: string; html: string }>;
          brief?: unknown;
        }>("/api/generate", { prompt }, { timeoutMs: 60000 });

        if (!data.variations?.length) throw new Error("No variations returned");
        setResult({
          html: data.variations[0].html,
          variations: data.variations,
          meta: { brief: data.brief },
          raw: data,
        });
      } else if (activeEngine === "layout") {
        const data = await postJSON<{
          html?: string;
          previewUrl?: string;
          title?: string;
          variations?: Array<{ id?: string; name?: string; mood?: string; html: string }>;
        }>("/api/generate-site", { prompt, mode: "preview" }, { timeoutMs: 60000 });

        const html = data.variations?.[0]?.html || data.html || "";
        if (!html) throw new Error("No HTML returned");
        setResult({
          html,
          variations: data.variations,
          meta: { title: data.title, previewUrl: data.previewUrl },
          raw: data,
        });
      } else {
        const variations: WebsiteConfig[] = await generateWebsiteVariations(prompt);
        if (!variations.length) throw new Error("No variations returned");
        setResult({
          html: variations[0].html,
          variations: variations.map((v) => ({
            id: v.id,
            name: v.name,
            mood: v.mood,
            html: v.html,
          })),
          meta: { count: variations.length, source: "aiService.ts" },
          raw: variations,
        });
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? `${err.message}${err.status ? ` (HTTP ${err.status})` : ""}`
          : err instanceof Error
            ? err.message
            : "Unknown error";
      setError(msg);
    } finally {
      setElapsedMs(Math.round(performance.now() - start));
      setIsLoading(false);
    }
  };

  const activeHtml = result?.variations?.[activeVariation]?.html || result?.html || "";

  return (
    <div className="pt-32 pb-20 px-6 lg:px-12 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 mb-4">
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            <span className="text-[10px] uppercase font-black tracking-widest text-brand-cyan">
              Engine Test Bench
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black italic tracking-tight mb-3">
            Generator Engines
          </h1>
          <p className="text-white/40 max-w-2xl">
            Pick a tab, enter a prompt, and run the same prompt through each engine to
            compare output, speed, and reliability.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10">
          {ENGINES.map((engine) => (
            <button
              key={engine.id}
              onClick={() => {
                setActiveEngine(engine.id);
                setResult(null);
                setError(null);
                setElapsedMs(null);
              }}
              className={cn(
                "px-5 py-3 text-sm font-bold rounded-t-xl transition-all border-b-2 -mb-px",
                activeEngine === engine.id
                  ? "border-brand-cyan text-brand-cyan bg-white/5"
                  : "border-transparent text-white/40 hover:text-white hover:bg-white/5",
              )}
            >
              <div className="flex flex-col items-start">
                <span>{engine.name}</span>
                <span className="text-[9px] uppercase tracking-widest font-mono opacity-60">
                  {engine.subtitle}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Active engine description */}
        <div className="glass p-4 rounded-2xl mb-6 text-sm text-white/60">
          {ENGINES.find((e) => e.id === activeEngine)?.description}
        </div>

        {/* Prompt input */}
        <div className="glass p-4 rounded-2xl mb-6 flex flex-col lg:flex-row gap-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the website you want…"
            className="grow bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 min-h-[88px] resize-none focus:border-brand-cyan/50 focus:outline-none"
          />
          <button
            onClick={runEngine}
            disabled={isLoading || !prompt.trim()}
            className={cn(
              "px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 min-w-[180px]",
              isLoading || !prompt.trim()
                ? "bg-white/5 text-white/30 cursor-not-allowed"
                : "bg-brand-cyan text-black hover:scale-105",
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Running
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" /> Run Engine
              </>
            )}
          </button>
        </div>

        {/* Status row */}
        <div className="flex flex-wrap gap-3 mb-6 text-xs">
          {elapsedMs !== null && (
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
              <span className="text-white/40">Time:</span>{" "}
              <span className="text-brand-cyan font-bold">{elapsedMs}ms</span>
            </span>
          )}
          {result?.variations && result.variations.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
              <span className="text-white/40">Variations:</span>{" "}
              <span className="text-brand-cyan font-bold">{result.variations.length}</span>
            </span>
          )}
          {error && (
            <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-300">
              {error}
            </span>
          )}
        </div>

        {/* Variation tabs */}
        {result?.variations && result.variations.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {result.variations.map((v, i) => (
              <button
                key={i}
                onClick={() => setActiveVariation(i)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  activeVariation === i
                    ? "bg-brand-cyan text-black"
                    : "bg-white/5 text-white/60 hover:bg-white/10",
                )}
              >
                {v.name || `Variation ${i + 1}`}
                {v.mood && (
                  <span className="ml-2 opacity-60 font-normal">· {v.mood}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Preview */}
        {activeHtml ? (
          <div className="glass rounded-3xl overflow-hidden border border-white/10">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/40">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
              <span className="ml-3 text-[10px] uppercase tracking-widest text-white/30 font-mono">
                {ENGINES.find((e) => e.id === activeEngine)?.subtitle}
              </span>
            </div>
            <iframe
              srcDoc={activeHtml}
              title="Engine Output Preview"
              className="w-full h-[80vh] min-h-[640px] bg-white"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        ) : (
          <div className="glass rounded-3xl border border-white/10 h-[400px] flex items-center justify-center text-white/30 text-sm">
            {isLoading
              ? "Generating…"
              : "Run the engine to preview the output here."}
          </div>
        )}
      </div>
    </div>
  );
}
