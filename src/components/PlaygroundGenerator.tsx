import { AnimatePresence, motion } from "framer-motion";
import {
  Eye,
  Keyboard,
  Loader2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface GeneratedPreview {
  siteName: string;
  heroHeadline: string;
  heroSubhead: string;
  heroVideoUrl: string;
  heroImageUrl: string;
  gallery: string[];
  headingFont: string;
  bodyFont: string;
  accentA: string;
  accentB: string;
  headlineEffect: string;
  sectionTitle: string;
  sectionCopy: string;
  features: string[];
  cta: string;
}

type PreviewVariant = {
  label: "Luxury" | "Minimal" | "Bold";
  preview: GeneratedPreview;
};

const EXAMPLE_PROMPTS = [
  "Create a luxury salon website for Halo Beauty Studio with a hero video and booking section",
  "Build a fitness landing page for Iron Pulse Gym with bold neon colors and trainer highlights",
  "Make a modern coffee website for Ember Roast with warm tones and product cards",
];

function extractSiteName(prompt: string) {
  const cleaned = prompt.trim();
  const forMatch = cleaned.match(/\bfor\s+([a-z0-9&\-\s]{3,60})/i);
  if (forMatch?.[1]) return forMatch[1].trim().replace(/[.,;:!?]+$/, "");
  const calledMatch = cleaned.match(/\bcalled\s+([a-z0-9&\-\s]{3,60})/i);
  if (calledMatch?.[1])
    return calledMatch[1].trim().replace(/[.,;:!?]+$/, "");
  return cleaned
    .split(" ")
    .slice(0, 4)
    .join(" ")
    .replace(/[.,;:!?]+$/, "") || "Your Custom Website";
}

function buildCustomCopy(prompt: string, siteName: string) {
  const topic = prompt.toLowerCase();
  const isSalon = topic.includes("salon") || topic.includes("beauty");
  const isGym = topic.includes("gym") || topic.includes("fitness");
  const isCoffee = topic.includes("coffee") || topic.includes("cafe");
  const isRestaurant = topic.includes("restaurant") || topic.includes("food");

  if (isSalon) {
    return {
      heroHeadline: `${siteName} — Premium Beauty Experiences`,
      heroSubhead: `Premium beauty experiences by ${siteName}`,
      sectionTitle: "Crafted Beauty Services",
      sectionCopy:
        "From signature styling to treatment packages, every service block is tuned for appointment conversion and brand trust.",
      cta: "Book Your Session",
      features: ["Service Catalog", "Stylist Profiles", "Client Reviews", "Booking CTA"],
    };
  }
  if (isGym) {
    return {
      heroHeadline: `${siteName} — High-Performance Training`,
      heroSubhead: `High-performance training at ${siteName}`,
      sectionTitle: "Built for Strong Conversions",
      sectionCopy:
        "This landing layout spotlights offers, class blocks, and trainer credibility so visitors move from browsing to sign-up fast.",
      cta: "Start Membership",
      features: ["Program Blocks", "Coach Highlights", "Membership Plans", "Lead Capture"],
    };
  }
  if (isCoffee) {
    return {
      heroHeadline: `${siteName} — Fresh Craft Coffee`,
      heroSubhead: `Fresh craft coffee by ${siteName}`,
      sectionTitle: "Menu + Story in One Flow",
      sectionCopy:
        "A conversion-first coffee layout that blends story, featured drinks, and clear ordering actions in a premium visual style.",
      cta: "Order Online",
      features: ["Featured Drinks", "Brand Story", "Location/Hours", "Order CTA"],
    };
  }
  if (isRestaurant) {
    return {
      heroHeadline: `${siteName} — Elevated Dining`,
      heroSubhead: `Elevated dining from ${siteName}`,
      sectionTitle: "Reservation-Driven Layout",
      sectionCopy:
        "The page structure is designed to move visitors into reservation intent while showcasing atmosphere and signature plates.",
      cta: "Reserve Table",
      features: ["Signature Menu", "Chef Story", "Reservation CTA", "Gallery"],
    };
  }
  return {
    heroHeadline: `${siteName} — Built for Growth`,
    heroSubhead: `Custom digital presence for ${siteName}`,
    sectionTitle: "AI-Crafted Landing Experience",
    sectionCopy:
      "This preview is generated from your exact prompt with dynamic media, branded hierarchy, and conversion-oriented section flow.",
    cta: "Launch This Site",
    features: ["Hero Video", "Custom Brand Header", "Prompt-Based Copy", "Conversion CTA"],
  };
}

export function PlaygroundGenerator({
  variant = "default",
}: {
  variant?: "default" | "hero";
}) {
  const isHero = variant === "hero";
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] =
    useState<GeneratedPreview | null>(null);
  const [variants, setVariants] = useState<PreviewVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<"Luxury" | "Minimal" | "Bold" | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [inputMode, setInputMode] = useState<"voice" | "text">("text");
  const [textInput, setTextInput] = useState("");
  const recognitionRef = useRef<any>(null);
  const sourcePrompt = useMemo(
    () => (transcript || textInput).trim(),
    [transcript, textInput],
  );

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) setTranscript((prev) => `${prev} ${finalTranscript}`.trim());
      };
      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, []);

  const fetchDynamicMedia = async (queryText: string) => {
    try {
      const res = await fetch(`/api/media?q=${encodeURIComponent(queryText)}`);
      if (!res.ok) return null;
      return (await res.json()) as {
        imageUrl?: string;
        videoUrl?: string;
        gallery?: string[];
      };
    } catch {
      return null;
    }
  };

  const fetchPreviewStyle = async (queryText: string) => {
    try {
      const res = await fetch(
        `/api/preview-style?q=${encodeURIComponent(queryText)}`,
      );
      if (!res.ok) return null;
      return (await res.json()) as {
        headingFont?: string;
        bodyFont?: string;
        accentA?: string;
        accentB?: string;
        headlineEffect?: string;
      };
    } catch {
      return null;
    }
  };

  const fetchPreviewCopy = async (
    queryText: string,
    siteName: string,
    requestedStyle: string,
  ) => {
    try {
      const res = await fetch("/api/preview-copy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: queryText,
          siteName,
          requestedStyle,
        }),
      });
      if (!res.ok) return null;
      return (await res.json()) as {
        heroHeadline?: string;
        heroSubhead?: string;
        valueHeading?: string;
        valueBody?: string;
        ctaLabel?: string;
        featureBullets?: string[];
      };
    } catch {
      return null;
    }
  };

  const generatePreview = async (promptText: string) => {
    const prompt = promptText.trim();
    if (!prompt) return;
    setIsGenerating(true);
    setActiveStep(2);

    const siteName = extractSiteName(prompt);
    const [media, style] = await Promise.all([
      fetchDynamicMedia(prompt),
      fetchPreviewStyle(prompt),
    ]);
    const localCopy = buildCustomCopy(prompt, siteName);
    const remoteCopy = await fetchPreviewCopy(
      prompt,
      siteName,
      style?.headlineEffect || prompt,
    );

    const basePreview: GeneratedPreview = {
      siteName,
      heroHeadline: remoteCopy?.heroHeadline || localCopy.heroHeadline,
      heroSubhead: remoteCopy?.heroSubhead || localCopy.heroSubhead,
      sectionTitle: remoteCopy?.valueHeading || localCopy.sectionTitle,
      sectionCopy: remoteCopy?.valueBody || localCopy.sectionCopy,
      cta: remoteCopy?.ctaLabel || localCopy.cta,
      features: remoteCopy?.featureBullets || localCopy.features,
      heroVideoUrl:
        media?.videoUrl ||
        "https://cdn.coverr.co/videos/coverr-cinematic-city-pan-7153/1080p.mp4",
      heroImageUrl:
        media?.imageUrl ||
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80",
      gallery: media?.gallery?.slice(0, 3) || [],
      headingFont: style?.headingFont || "Poppins",
      bodyFont: style?.bodyFont || "Inter",
      accentA: style?.accentA || "#6366f1",
      accentB: style?.accentB || "#d946ef",
      headlineEffect: style?.headlineEffect || "slide-in",
    };

    const styleVariants: PreviewVariant[] = [
      {
        label: "Luxury",
        preview: {
          ...basePreview,
          accentA: "#a855f7",
          accentB: "#06b6d4",
          headingFont: "Poppins",
        },
      },
      {
        label: "Minimal",
        preview: {
          ...basePreview,
          accentA: "#2563eb",
          accentB: "#60a5fa",
          headingFont: "Inter",
          bodyFont: "Inter",
        },
      },
      {
        label: "Bold",
        preview: {
          ...basePreview,
          accentA: "#ef4444",
          accentB: "#f59e0b",
          headingFont: "Anton",
        },
      },
    ];

    setVariants(styleVariants);
    setSelectedVariant("Luxury");
    setGeneratedPreview(styleVariants[0].preview);

    setIsGenerating(false);
    setActiveStep(3);
  };

  const startRecording = () => {
    setTranscript("");
    setGeneratedPreview(null);
    setVariants([]);
    setSelectedVariant(null);
    setActiveStep(1);
    setIsRecording(true);
    recognitionRef.current?.start?.();
  };

  const stopRecording = () => {
    recognitionRef.current?.stop?.();
    setIsRecording(false);
    if (transcript.trim()) void generatePreview(transcript);
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      setTranscript(textInput.trim());
      void generatePreview(textInput.trim());
    }
  };

  useEffect(() => {
    if (generatedPreview) {
      localStorage.setItem("vtw_preview_style", selectedVariant || "Luxury");
      localStorage.setItem("vtw_preview_site_name", generatedPreview.siteName);
    }
  }, [generatedPreview, selectedVariant]);

  return (
    <div className={`w-full ${isHero ? "max-w-5xl" : "max-w-4xl"} mx-auto`}>
      <div className="text-center mb-6">
        {!isHero && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            Try It Free - No Signup Required
          </div>
        )}
        <h2 className={`${isHero ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"} font-bold text-white mb-3`}>
          See the AI in Action
        </h2>
      </div>

      {!generatedPreview && (
        <>
          {!isHero && (
            <div className="flex items-center justify-center gap-4 mb-8">
              {[{ icon: Volume2, label: "Speak" }, { icon: Wand2, label: "AI Builds" }, { icon: Eye, label: "Preview" }].map((step, i) => (
                <div key={step.label} className={`px-3 py-2 rounded-full border text-sm ${activeStep >= i ? "border-cyan-400/40 text-cyan-300 bg-cyan-500/10" : "border-white/10 text-white/40"}`}>
                  <step.icon className="w-4 h-4 inline mr-2" />
                  {step.label}
                </div>
              ))}
            </div>
          )}

          <div className={`border rounded-2xl p-5 backdrop-blur-xl ${isHero ? "bg-black/35 border-indigo-400/25" : "bg-[#0f172a] border-white/10"}`}>
            <div className="flex justify-center mb-4">
              <div className="flex gap-2 rounded-full border border-white/10 bg-white/5 p-1">
                <button onClick={() => setInputMode("text")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${inputMode === "text" ? "bg-cyan-500/20 text-cyan-200" : "text-white/60 hover:text-white"}`}>
                  <Keyboard className="w-4 h-4 inline mr-2" />
                  Type
                </button>
                <button onClick={() => setInputMode("voice")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${inputMode === "voice" ? "bg-cyan-500/20 text-cyan-200" : "text-white/60 hover:text-white"}`}>
                  <Mic className="w-4 h-4 inline mr-2" />
                  Speak
                </button>
              </div>
            </div>

            {inputMode === "voice" ? (
              <div className="text-center">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-20 h-20 rounded-full ${isRecording ? "bg-red-500/20 border-red-400" : "bg-cyan-500/20 border-cyan-400"} border-2 inline-flex items-center justify-center`}
                >
                  {isRecording ? <MicOff className="text-red-300" /> : <Mic className="text-cyan-300" />}
                </button>
                <p className="text-white/70 mt-3">{isRecording ? "Listening..." : "Tap to record your website request"}</p>
                {transcript ? <p className="text-white/80 mt-3">{transcript}</p> : null}
                {!isRecording && transcript ? (
                  <button
                    onClick={() => void generatePreview(transcript)}
                    className="mt-4 px-6 py-3 bg-linear-to-r from-indigo-500 to-fuchsia-500 rounded-xl text-white font-semibold"
                  >
                    Generate
                  </button>
                ) : null}
              </div>
            ) : (
              <div>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleTextSubmit();
                    }
                  }}
                  placeholder='Describe exact brand/site needed. Example: "Create a landing page for Halo Beauty Studio with premium booking flow and pink luxury style."'
                  className={`w-full h-28 rounded-xl bg-white/5 border ${isHero ? "border-indigo-400/20" : "border-white/10"} p-4 text-white`}
                />
                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleTextSubmit}
                    disabled={!textInput.trim() || isGenerating}
                    className="flex items-center gap-2 px-8 py-3 bg-linear-to-r from-indigo-500 to-fuchsia-500 rounded-xl text-white font-semibold disabled:opacity-40"
                  >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isGenerating ? "Generating..." : "Generate"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {!isHero && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setTextInput(prompt);
                    setTranscript(prompt);
                    void generatePreview(prompt);
                  }}
                  className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white/75"
                >
                  {prompt.slice(0, 52)}...
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {generatedPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-2xl border border-white/15 bg-slate-950/90 overflow-hidden">
            <div className="border-b border-white/10 bg-black/25 p-4">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-cyan-200">
                <Loader2 className="h-4 w-4 animate-spin" />
                Build progress
              </div>
              <div className="mt-3 space-y-2 font-mono text-[11px] leading-5 text-slate-300">
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ repeat: Infinity, repeatType: "mirror", duration: 1.2 }}>
                  [1/3] Parsing voice brief and extracting intent...
                </motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, repeat: Infinity, repeatType: "mirror", duration: 1.2 }}>
                  [2/3] Mapping sections into the 12-column grid...
                </motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, repeat: Infinity, repeatType: "mirror", duration: 1.2 }}>
                  [3/3] Writing media, typography, and launch-ready content...
                </motion.p>
              </div>
            </div>
            {variants.length > 0 ? (
              <div className="border-b border-white/10 p-4">
                <div className="mb-2 text-xs uppercase tracking-[0.25em] text-white/60">
                  Choose a style
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {variants.map((variant) => (
                    <button
                      key={variant.label}
                      type="button"
                      onClick={() => {
                        setGeneratedPreview(variant.preview);
                        setSelectedVariant(variant.label);
                      }}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        selectedVariant === variant.label
                          ? "border-cyan-300/70 bg-cyan-500/20 text-white"
                          : "border-white/10 bg-white/5 text-white/80 hover:border-white/30"
                      }`}
                    >
                      <div className="font-semibold">{variant.label}</div>
                      <div className="text-xs text-white/60">
                        {variant.preview.headingFont} · {variant.preview.accentA}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.22),transparent_35%),linear-gradient(180deg,rgba(3,4,10,0.15),rgba(3,4,10,0.65))]" />
              <video src={generatedPreview.heroVideoUrl} autoPlay loop muted playsInline className="h-[330px] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute top-4 left-4 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-white text-xs tracking-widest uppercase">
                {generatedPreview.siteName}
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <h3
                  className="text-4xl font-black text-white drop-shadow-xl"
                  style={{ fontFamily: generatedPreview.headingFont }}
                >
                  {generatedPreview.heroHeadline}
                </h3>
                <p className="text-white/90 text-lg mt-2" style={{ fontFamily: generatedPreview.bodyFont }}>
                  {generatedPreview.heroSubhead}
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <img src={generatedPreview.gallery[0] || generatedPreview.heroImageUrl} className="w-full h-52 object-cover" />
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="text-2xl font-bold text-white mb-2 animate-[fadeIn_0.7s_ease-out]" style={{ fontFamily: generatedPreview.headingFont }}>
                    {generatedPreview.sectionTitle}
                  </h4>
                  <p className="text-white/75 leading-relaxed animate-[fadeIn_0.9s_ease-out]">
                    {generatedPreview.sectionCopy}
                  </p>
                  <button
                    className="mt-5 w-fit px-6 py-3 rounded-xl text-white font-semibold transition-transform hover:-translate-y-0.5"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${generatedPreview.accentA}, ${generatedPreview.accentB})`,
                    }}
                  >
                    {generatedPreview.cta}
                  </button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-4 mt-6">
                {generatedPreview.features.map((feature) => (
                  <div key={feature} className="rounded-lg border border-white/10 bg-white/5 p-3 text-white/85 text-sm transition-all hover:border-white/30 hover:bg-white/10">
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
