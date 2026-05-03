import { Download, Eye, Loader2, Lock, Mic, Wand2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import {
  generateWebsiteVariations,
  WebsiteConfig,
} from "../../services/aiService";

export const GeneratorSection = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<WebsiteConfig[]>([]);
  const [activeVariation, setActiveVariation] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const results = await generateWebsiteVariations(prompt);
      setVariations(results);
      setActiveVariation(0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real app, integrate Web Speech API here
    if (!isRecording) {
      // Mock start recording
      console.log("Recording started...");
    } else {
      // Mock stop recording
      console.log("Recording stopped.");
      setPrompt(
        "Build a luxurious modern Italian restaurant website with a dark theme and elegant typography.",
      );
    }
  };

  return (
    <section
      className="py-24 px-6 lg:px-12 relative overflow-hidden"
      id="generator"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center mb-16 text-center">
          <h2 className="text-4xl lg:text-6xl font-black mb-6 italic tracking-tight">
            Try the Live Generator
          </h2>
          <p className="text-white/40 max-w-2xl">
            Experience the precision of AI web architecture. No templates. No
            drag-and-drop. Just your voice.
          </p>
        </div>

        {/* Input Bar */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-cyan to-brand-purple rounded-3xl blur opacity-20 group-focus-within:opacity-50 transition duration-500"></div>
            <div className="relative glass p-2 rounded-3xl flex items-center gap-2">
              <button
                onClick={toggleRecording}
                className={cn(
                  "p-4 rounded-2xl transition-all",
                  isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-white/5 text-brand-cyan hover:bg-white/10",
                )}
              >
                <Mic className="w-6 h-6" />
              </button>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your website idea (e.g. 'Luxury spa in Bali')..."
                className="flex-grow bg-transparent border-none focus:ring-0 text-lg px-4"
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="p-4 bg-brand-cyan text-black rounded-2xl font-black disabled:opacity-50 hover:scale-105 transition-transform"
              >
                {isGenerating ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Wand2 className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
          <div className="mt-4 flex gap-3 flex-wrap justify-center">
            {[
              "Startup Landing",
              "Fitness Coach",
              "Creative Portfolio",
              "Bistro",
            ].map((tag) => (
              <button
                key={tag}
                onClick={() => setPrompt(`Build a website for a ${tag}`)}
                className="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border border-white/10 hover:border-brand-cyan/50 hover:bg-brand-cyan/10 transition-all text-white/40 hover:text-brand-cyan"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Output Area */}
        <AnimatePresence mode="wait">
          {variations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-8"
            >
              {/* Variation Selector */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <h3 className="text-xl font-bold mb-4">Variations</h3>
                {variations.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveVariation(i)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl text-left glass transition-all",
                      activeVariation === i
                        ? "border-brand-cyan bg-white/10"
                        : "hover:bg-white/5 opacity-60",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-cyan/20 flex items-center justify-center text-brand-cyan font-bold italic">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{v.name}</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/40">
                          {v.mood}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}

                <div className="mt-8 p-6 glass rounded-3xl">
                  <div className="flex items-center gap-2 text-brand-purple mb-4">
                    <Lock className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      Premium Features
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mb-4 italic">
                    Code export and full resolution hosting available in Pro
                    plans.
                  </p>
                  <Link
                    to="/pricing"
                    className="block text-center w-full py-3 bg-brand-purple text-white rounded-xl text-xs font-bold hover:scale-105 transition-transform"
                  >
                    Upgrade Now
                  </Link>
                </div>
              </div>

              {/* Preview Window */}
              <div className="lg:col-span-3 flex flex-col gap-4">
                <div className="flex items-center justify-between px-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="flex gap-4">
                    <Link
                      to="/preview"
                      state={{ config: variations[activeVariation!] }}
                      className="flex items-center gap-2 text-xs text-brand-cyan hover:text-white transition-colors"
                    >
                      <Eye className="w-4 h-4" /> Expand Preview
                    </Link>
                    <Link
                      to="/setup"
                      className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors"
                    >
                      <Download className="w-4 h-4" /> Save Variation
                    </Link>
                  </div>
                </div>

                {/* The Actual Generated Site Preview */}
                <div className="relative glass h-[600px] rounded-[2rem] overflow-hidden group">
                  <div className="absolute inset-0 z-10 pointer-events-none border-[12px] border-[#0a0a0a] rounded-[2rem]" />
                  <div className="h-full bg-black relative">
                    <AnimatePresence mode="wait">
                      {activeVariation !== null && (
                        <motion.div
                          key={activeVariation}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full h-full"
                        >
                          <iframe
                            srcDoc={variations[activeVariation].html}
                            title="Website Preview"
                            className="w-full h-full border-none pointer-events-auto"
                            sandbox="allow-scripts allow-same-origin"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

// Blog auto-loading and indexing logic
import { useEffect } from "react";

const BlogSection = () => {
  const [stories, setStories] = useState([]);
  const [index, setIndex] = useState([]);

  useEffect(() => {
    const fetchStories = async () => {
      const response = await fetch("/api/blog-stories");
      const data = await response.json();
      setStories(data.stories);
      setIndex(data.index);
    };

    fetchStories();

    const interval = setInterval(() => {
      fetchStories();
    }, 3600000); // Refresh every hour

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="blog-section">
      <h2 className="text-4xl font-bold mb-6">Latest Stories</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stories.map((story, i) => (
          <div key={i} className="p-4 bg-white/10 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">{story.title}</h3>
            <p className="text-sm text-white/60">{story.summary}</p>
          </div>
        ))}
      </div>
      <a
        href="/blog-index"
        className="mt-4 inline-block text-brand-cyan hover:underline"
      >
        View All Stories
      </a>
    </div>
  );
};

export default BlogSection;
