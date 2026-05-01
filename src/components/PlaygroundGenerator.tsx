import { AnimatePresence, motion } from "framer-motion";
import {
  Code,
  Eye,
  Keyboard,
  Loader2,
  Mic,
  MicOff,
  Monitor,
  Send,
  Sparkles,
  Volume2,
  Wand2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface GeneratedPreview {
  title: string;
  description: string;
  features: string[];
  colorScheme: string;
  layout: string;
  heroVideoUrl: string;
  heroImageUrl: string;
  industry: string;
  cta: string;
  gallery?: string[];
}

const DEMO_RESPONSES: Record<string, GeneratedPreview> = {
  coffee: {
    title: "Brew & Bloom Coffee",
    description: "A modern coffee shop website with warm aesthetics",
    features: [
      "Menu showcase",
      "Online ordering",
      "Location finder",
      "Gallery",
    ],
    colorScheme: "Warm browns & creams",
    layout: "Single-page with smooth scroll",
    heroVideoUrl:
      "https://cdn.coverr.co/videos/coverr-a-brewing-cup-of-coffee-1579/1080p.mp4",
    heroImageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80",
    industry: "Coffee & Cafe",
    cta: "Order Online",
  },
  gym: {
    title: "Iron Forge Fitness",
    description: "Bold gym website with energy and motivation",
    features: [
      "Class schedules",
      "Trainer profiles",
      "Membership plans",
      "Progress tracker",
    ],
    colorScheme: "Dark grays & neon accents",
    layout: "Multi-section landing page",
    heroVideoUrl:
      "https://cdn.coverr.co/videos/coverr-workout-gym-session-5176/1080p.mp4",
    heroImageUrl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80",
    industry: "Fitness",
    cta: "Start Membership",
  },
  salon: {
    title: "Luxe Beauty Lounge",
    description: "Elegant salon with booking integration",
    features: ["Service menu", "Online booking", "Stylist profiles", "Reviews"],
    colorScheme: "Soft pinks & golds",
    layout: "Minimalist grid layout",
    heroVideoUrl:
      "https://cdn.coverr.co/videos/coverr-haircut-close-up-1971/1080p.mp4",
    heroImageUrl:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1600&q=80",
    industry: "Beauty & Salon",
    cta: "Book Appointment",
  },
  restaurant: {
    title: "Savory Kitchen",
    description: "Fine dining experience website",
    features: [
      "Reservation system",
      "Chef's specials",
      "Wine list",
      "Private events",
    ],
    colorScheme: "Deep greens & brass",
    layout: "Classic elegant layout",
    heroVideoUrl:
      "https://cdn.coverr.co/videos/coverr-fancy-dinner-table-1563/1080p.mp4",
    heroImageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
    industry: "Restaurant",
    cta: "Reserve Table",
  },
  default: {
    title: "Your AI-Generated Site",
    description: "Custom website built from your voice description",
    features: ["Hero section", "Services showcase", "Contact form", "Gallery"],
    colorScheme: "Professional & modern",
    layout: "Responsive multi-page",
    heroVideoUrl:
      "https://cdn.coverr.co/videos/coverr-cinematic-city-pan-7153/1080p.mp4",
    heroImageUrl:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80",
    industry: "Business",
    cta: "Get Started",
  },
};

const EXAMPLE_PROMPTS = [
  "Create a modern coffee shop website with online ordering",
  "Build a gym website with class schedules and trainer profiles",
  "Design an elegant salon website with booking system",
  "Make a restaurant site with reservations and menu",
];

export function PlaygroundGenerator() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] =
    useState<GeneratedPreview | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [inputMode, setInputMode] = useState<"voice" | "text">("text");
  const [textInput, setTextInput] = useState("");
  const recognitionRef = useRef<any>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

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
        if (finalTranscript) {
          setTranscript((prev) => prev + " " + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };
    }
  }, []);

  const startRecording = () => {
    if (recognitionRef.current) {
      setTranscript("");
      setGeneratedPreview(null);
      recognitionRef.current.start();
      setIsRecording(true);
      setActiveStep(1);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      if (transcript.trim()) {
        generatePreview();
      }
    }
  };

  const generatePreview = async () => {
    setIsGenerating(true);
    setActiveStep(2);

    // Simulate AI processing with delay
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Determine which demo response to show based on keywords
    const lowerTranscript = transcript.toLowerCase();
    let preview = DEMO_RESPONSES.default;

    if (
      lowerTranscript.includes("coffee") ||
      lowerTranscript.includes("cafe")
    ) {
      preview = DEMO_RESPONSES.coffee;
    } else if (
      lowerTranscript.includes("gym") ||
      lowerTranscript.includes("fitness")
    ) {
      preview = DEMO_RESPONSES.gym;
    } else if (
      lowerTranscript.includes("salon") ||
      lowerTranscript.includes("beauty")
    ) {
      preview = DEMO_RESPONSES.salon;
    } else if (
      lowerTranscript.includes("restaurant") ||
      lowerTranscript.includes("food")
    ) {
      preview = DEMO_RESPONSES.restaurant;
    }

    const media = await fetchDynamicMedia(transcript || preview.industry);
    setGeneratedPreview({
      ...preview,
      heroImageUrl: media?.imageUrl || preview.heroImageUrl,
      heroVideoUrl: media?.videoUrl || preview.heroVideoUrl,
      gallery: media?.gallery,
    });
    setIsGenerating(false);
    setActiveStep(3);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const useExample = (prompt: string) => {
    if (inputMode === "voice") {
      setTranscript(prompt);
    } else {
      setTextInput(prompt);
    }
    setGeneratedPreview(null);
    setTimeout(() => {
      if (inputMode === "voice") {
        generatePreview();
      } else {
        generatePreviewFromText(prompt);
      }
    }, 100);
  };

  const generatePreviewFromText = async (inputText?: string) => {
    const text = inputText || textInput;
    if (!text.trim()) return;

    setTranscript(text);
    setIsGenerating(true);
    setActiveStep(2);

    // Simulate AI processing with delay
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Determine which demo response to show based on keywords
    const lowerText = text.toLowerCase();
    let preview = DEMO_RESPONSES.default;

    if (lowerText.includes("coffee") || lowerText.includes("cafe")) {
      preview = DEMO_RESPONSES.coffee;
    } else if (lowerText.includes("gym") || lowerText.includes("fitness")) {
      preview = DEMO_RESPONSES.gym;
    } else if (lowerText.includes("salon") || lowerText.includes("beauty")) {
      preview = DEMO_RESPONSES.salon;
    } else if (lowerText.includes("restaurant") || lowerText.includes("food")) {
      preview = DEMO_RESPONSES.restaurant;
    }

    const media = await fetchDynamicMedia(text || preview.industry);
    setGeneratedPreview({
      ...preview,
      heroImageUrl: media?.imageUrl || preview.heroImageUrl,
      heroVideoUrl: media?.videoUrl || preview.heroVideoUrl,
      gallery: media?.gallery,
    });
    setIsGenerating(false);
    setActiveStep(3);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      generatePreviewFromText();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  const resetPlayground = () => {
    setTranscript("");
    setGeneratedPreview(null);
    setActiveStep(0);
    setIsRecording(false);
    setIsGenerating(false);
  };

  const safePrompt = transcript.trim() || generatedPreview?.description || "";
  const previewStyles = {
    coffee: "from-amber-900/50 via-orange-900/30 to-zinc-950",
    gym: "from-zinc-900 via-slate-900 to-cyan-950",
    salon: "from-rose-900/50 via-fuchsia-900/30 to-zinc-950",
    restaurant: "from-emerald-900/50 via-zinc-900 to-black",
    default: "from-blue-950 via-slate-950 to-black",
  } as const;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm mb-4"
        >
          <Sparkles className="w-4 h-4" />
          Try It Free - No Signup Required
        </motion.div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          See the AI in Action
        </h2>
        <p className="text-white/60 max-w-lg mx-auto">
          Describe your dream website below. Our AI will instantly show you what
          it can build.
          <span className="text-amber-400"> (Demo only - no site saved)</span>
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[
          { icon: Volume2, label: "Speak" },
          { icon: Wand2, label: "AI Builds" },
          { icon: Eye, label: "Preview" },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                activeStep >= i
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-white/5 text-white/40 border border-white/10"
              }`}
            >
              <step.icon className="w-4 h-4" />
              {step.label}
            </div>
            {i < 2 && (
              <div
                className={`w-8 h-0.5 rounded ${
                  activeStep > i ? "bg-cyan-500/50" : "bg-white/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Input Mode Toggle */}
      {!isGenerating && !generatedPreview && (
        <div className="flex justify-center mb-6">
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setInputMode("text")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                inputMode === "text"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Keyboard className="w-4 h-4" />
              Type
            </button>
            <button
              onClick={() => setInputMode("voice")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                inputMode === "voice"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Mic className="w-4 h-4" />
              Speak
            </button>
          </div>
        </div>
      )}

      {/* Example Prompts */}
      {!isRecording && !isGenerating && !generatedPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap justify-center gap-2 mb-6"
        >
          <span className="text-white/40 text-sm mr-2 py-2">
            Try an example:
          </span>
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => useExample(prompt)}
              className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 rounded-lg text-white/70 hover:text-white transition-all"
            >
              {prompt.length > 35 ? prompt.substring(0, 35) + "..." : prompt}
            </button>
          ))}
        </motion.div>
      )}

      {/* Recording Interface */}
      <div className="relative">
        {/* Main Input Area */}
        <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 mb-4">
          {!generatedPreview ? (
            <>
              {inputMode === "voice" ? (
                <>
                  {/* Voice Button */}
                  <div className="flex justify-center mb-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isGenerating}
                      className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                        isRecording
                          ? "bg-red-500/20 border-4 border-red-500 animate-pulse"
                          : "bg-cyan-500/20 border-4 border-cyan-500 hover:bg-cyan-500/30"
                      }`}
                    >
                      {isRecording ? (
                        <MicOff className="w-10 h-10 text-red-400" />
                      ) : (
                        <Mic className="w-10 h-10 text-cyan-400" />
                      )}

                      {/* Recording Rings */}
                      {isRecording && (
                        <>
                          <motion.div
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.5, 0, 0.5],
                            }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute inset-0 rounded-full border-2 border-red-500/30"
                          />
                          <motion.div
                            animate={{
                              scale: [1, 1.8, 1],
                              opacity: [0.3, 0, 0.3],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              delay: 0.2,
                            }}
                            className="absolute inset-0 rounded-full border-2 border-red-500/20"
                          />
                        </>
                      )}
                    </motion.button>
                  </div>

                  {/* Status Text */}
                  <div className="text-center mb-4">
                    {isRecording ? (
                      <p className="text-red-400 animate-pulse">
                        Recording... Click to stop
                      </p>
                    ) : isGenerating ? (
                      <div className="flex items-center justify-center gap-2 text-cyan-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>AI is building your website preview...</span>
                      </div>
                    ) : (
                      <p className="text-white/60">
                        Click the microphone and describe your website
                      </p>
                    )}
                  </div>

                  {/* Transcript Display */}
                  <AnimatePresence>
                    {(transcript || isRecording) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white/5 border border-white/10 rounded-xl p-4"
                      >
                        <p className="text-white/80 min-h-12">
                          {transcript || (isRecording ? "Listening..." : "")}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <>
                  {/* Text Input Area */}
                  <div className="space-y-4">
                    <div className="relative">
                      <textarea
                        ref={textInputRef}
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe your dream website... (e.g., 'A modern coffee shop with online ordering, warm brown colors, and a gallery section')"
                        className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/40 resize-none focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                        disabled={isGenerating}
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-white/30">
                        Press Enter to submit
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-center">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleTextSubmit}
                        disabled={!textInput.trim() || isGenerating}
                        className="flex items-center gap-2 px-8 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-white/10 disabled:text-white/40 text-white font-semibold rounded-xl transition-all"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Building...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Build My Website
                          </>
                        )}
                      </motion.button>
                    </div>

                    {/* Status Text */}
                    <div className="text-center">
                      {isGenerating ? (
                        <div className="flex items-center justify-center gap-2 text-cyan-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>AI is building your website preview...</span>
                        </div>
                      ) : (
                        <p className="text-white/40 text-sm">
                          Type your website description and press Enter or click
                          Build
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Generating Animation */}
              {isGenerating && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-white/60">
                    <Code className="w-5 h-5 text-cyan-400" />
                    <span>Analyzing your requirements...</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/60">
                    <Wand2 className="w-5 h-5 text-purple-400" />
                    <span>Generating layout structure...</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/60">
                    <Monitor className="w-5 h-5 text-green-400" />
                    <span>Creating visual preview...</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Generated Preview */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Success Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Sparkles className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      AI Preview Generated!
                    </h3>
                    <p className="text-sm text-white/60">
                      Here's what your website could look like
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetPlayground}
                  className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                >
                  Try Another
                </button>
              </div>

              {/* Full Page Preview */}
              <div className="relative">
                <div className="absolute inset-0 pointer-events-none opacity-20 [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:38px_38px]" />
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.2),transparent_40%)]" />
                <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                  <div className="rotate-[-18deg] select-none rounded-2xl border border-cyan-300/30 bg-slate-950/55 px-8 py-4 text-cyan-100/70 tracking-[0.28em] text-lg font-semibold backdrop-blur-sm">
                    VIEW VOICE TO WEBSITE
                  </div>
                </div>
                <div
                  className="relative z-10 max-h-[72vh] overflow-y-auto rounded-2xl border border-white/12 bg-slate-950"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  onClickCapture={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest("a,button")) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                >
                  <div
                    className={`min-h-[1200px] bg-gradient-to-b ${previewStyles[(generatedPreview.industry.toLowerCase().includes("coffee") ? "coffee" : generatedPreview.industry.toLowerCase().includes("fitness") ? "gym" : generatedPreview.industry.toLowerCase().includes("salon") ? "salon" : generatedPreview.industry.toLowerCase().includes("restaurant") ? "restaurant" : "default") as keyof typeof previewStyles]}`}
                  >
                    <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
                      <div className="flex items-center justify-between px-6 py-4">
                        <div className="text-white font-bold tracking-tight">{generatedPreview.title}</div>
                        <nav className="hidden md:flex items-center gap-6 text-sm text-white/75">
                          <a className="hover:text-cyan-300 transition-colors">Home</a>
                          <a className="hover:text-cyan-300 transition-colors">Services</a>
                          <a className="hover:text-cyan-300 transition-colors">Gallery</a>
                          <a className="hover:text-cyan-300 transition-colors">Contact</a>
                        </nav>
                      </div>
                    </header>

                    <section className="relative px-6 pt-8 pb-10">
                      <video
                        className="h-[280px] w-full rounded-2xl object-cover ring-1 ring-white/15"
                        src={generatedPreview.heroVideoUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                      <div className="absolute inset-0 m-6 rounded-2xl bg-gradient-to-t from-slate-950/70 to-transparent pointer-events-none" />
                      <div className="relative -mt-24 px-6">
                        <h4 className="text-3xl font-extrabold text-white drop-shadow-md">{generatedPreview.description}</h4>
                        <p className="mt-3 max-w-2xl text-white/80">{safePrompt || "Custom AI-driven homepage preview with full interactions and brand visuals."}</p>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <span className="rounded-full border border-cyan-300/35 bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-100">{generatedPreview.colorScheme}</span>
                          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">{generatedPreview.layout}</span>
                        </div>
                      </div>
                    </section>

                    <section className="px-6 pb-10">
                      <div className="grid gap-4 md:grid-cols-2">
                        {generatedPreview.features.map((feature, i) => (
                          <div
                            key={i}
                            className="group rounded-xl border border-white/15 bg-white/5 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/45 hover:bg-white/10"
                          >
                            <div className="mb-2 text-xs uppercase tracking-[0.22em] text-cyan-200/85">Feature {i + 1}</div>
                            <div className="text-lg font-semibold text-white">{feature}</div>
                            <div className="mt-1 text-sm text-white/70">Animated interactions, layered visuals, and conversion-focused layout.</div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="px-6 pb-12">
                      <div className="grid gap-4 md:grid-cols-3">
                        {(generatedPreview.gallery?.length ? generatedPreview.gallery : [generatedPreview.heroImageUrl, generatedPreview.heroImageUrl, generatedPreview.heroImageUrl]).slice(0, 3).map((imageSrc, i) => (
                          <div key={i} className="overflow-hidden rounded-xl border border-white/12 bg-slate-900/60">
                            <img
                              src={imageSrc}
                              alt={`${generatedPreview.industry} showcase ${i + 1}`}
                              className="h-36 w-full object-cover transition-transform duration-500 hover:scale-105"
                              loading="lazy"
                            />
                            <div className="p-3 text-sm text-white/75">Preview module {i + 1}</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6 text-center">
                <p className="text-white mb-4">
                  Want to save this site and make it yours?
                </p>
                <a
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  Buy This Site & Launch
                </a>
                <p className="text-sm text-white/50 mt-3">
                  Free to start • No credit card required
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 text-white/40 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            Instant Preview
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            No Signup Required
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            Try Unlimited Demos
          </div>
        </div>
      </div>
    </div>
  );
}
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
