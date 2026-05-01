import {
  ArrowRight,
  Loader2,
  Lock,
  Mic,
  Monitor,
  Sparkles,
  Square,
  Wand2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useCallback, useRef, useState } from "react";
import { GoogleAdSense } from "./GoogleAdSense";

interface VoiceGeneratorProps {
  mode: "preview" | "full";
  onUpgrade?: () => void;
  userToken?: string | null;
}

interface GeneratedSite {
  html: string;
  preview: string;
  title: string;
  variations?: Array<{
    id: string;
    name: string;
    mood: string;
    fontPair?: string;
    html: string;
  }>;
}

export const VoiceGenerator: React.FC<VoiceGeneratorProps> = ({
  mode,
  onUpgrade,
  userToken,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSite, setGeneratedSite] = useState<GeneratedSite | null>(
    null,
  );
  const [activeVariation, setActiveVariation] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"voice" | "text">("voice");

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

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

      recognitionRef.current.onend = () => {
        if (isRecording) {
          recognitionRef.current?.start();
        }
      };
    }
  }, [isRecording]);

  const startRecording = async () => {
    setError(null);

    try {
      // Initialize speech recognition
      initSpeechRecognition();

      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        // Fallback: request microphone for visual feedback
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaRecorderRef.current = new MediaRecorder(stream);
        setIsRecording(true);
      }
    } catch (err) {
      console.error("Recording error:", err);
      setError(
        "Microphone access required for voice input. Please allow access or type your request.",
      );
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const generateSite = async () => {
    if (!transcript.trim()) {
      setError("Please describe what you want to build");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Call the generation API
      const response = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: transcript,
          mode,
          token: userToken,
        }),
      });

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const data = (await response.json()) as {
        html: string;
        previewUrl?: string;
        title?: string;
        variations?: GeneratedSite["variations"];
      };

      setGeneratedSite({
        html: data.html,
        preview: data.previewUrl || "",
        title: data.title || "Generated Site",
        variations: data.variations,
      });
      setActiveVariation(0);
    } catch (err) {
      console.error("Generation error:", err);
      setError("Failed to generate site. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const isPreviewMode = mode === "preview";
  const activeHtml =
    generatedSite?.variations?.[activeVariation]?.html || generatedSite?.html || "";

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-indigo-300 uppercase tracking-wider">
            {isPreviewMode ? "Free Preview" : "Full Generator"}
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-black text-white mb-4"
        >
          {isPreviewMode ? "Try It Free" : "Build Your Site"}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-slate-400 max-w-2xl mx-auto"
        >
          {isPreviewMode
            ? "Describe your website and compare three complete scrollable homepage directions."
            : "Generate complete custom homepages with copy, media, motion, responsive sections, and three premium layout directions."}
        </motion.p>
      </div>

      {/* AdSense for preview mode */}
      {isPreviewMode && <GoogleAdSense slot="generator-top" />}

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative rounded-[32px] border border-white/10 bg-linear-to-br from-white/8 to-transparent backdrop-blur-2xl p-8 mb-8"
      >
        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              onClick={() => setActiveTab("voice")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "voice"
                  ? "bg-indigo-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Mic className="w-4 h-4" />
              Voice
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "text"
                  ? "bg-indigo-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Wand2 className="w-4 h-4" />
              Text
            </button>
          </div>
        </div>

        {/* Voice Input */}
        {activeTab === "voice" && (
          <div className="text-center space-y-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isRecording ? stopRecording : startRecording}
              className={`
                w-32 h-32 rounded-full flex items-center justify-center
                transition-all duration-500
                ${
                  isRecording
                    ? "bg-red-500/20 border-4 border-red-500 animate-pulse"
                    : "bg-linear-to-br from-indigo-500 to-violet-500 border-4 border-transparent hover:shadow-[0_0_60px_-10px_rgba(99,102,241,0.5)]"
                }
              `}
            >
              {isRecording ? (
                <Square className="w-12 h-12 text-red-400" />
              ) : (
                <Mic className="w-12 h-12 text-white" />
              )}
            </motion.button>

            <p className="text-slate-400">
              {isRecording
                ? "Recording... Click to stop"
                : "Tap to start speaking"}
            </p>
          </div>
        )}

        {/* Text Input */}
        {activeTab === "text" && (
          <div className="space-y-4">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Describe the site: business name, audience, offer, pages, mood, colors, and anything you want included. If you skip style details, the generator will add premium design, copy, animation, media, and conversion sections automatically."
              className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-6 text-white placeholder:text-slate-500 resize-none focus:border-indigo-500/50 focus:outline-none transition-all"
            />
          </div>
        )}

        {/* Transcript Display (when recording) */}
        {transcript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-6 p-6 rounded-2xl bg-white/5 border border-white/10"
          >
            <p className="text-slate-300 leading-relaxed">{transcript}</p>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Generate Button */}
        <div className="mt-8 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateSite}
            disabled={isGenerating || !transcript.trim()}
            className={`
              flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg uppercase tracking-wider
              transition-all duration-300
              ${
                isGenerating || !transcript.trim()
                  ? "bg-white/5 text-slate-500 cursor-not-allowed"
                  : "bg-linear-to-r from-indigo-500 via-violet-500 to-cyan-400 text-white hover:shadow-[0_0_60px_-10px_rgba(99,102,241,0.5)]"
              }
            `}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-6 h-6" />
                {isPreviewMode ? "Generate Preview" : "Generate Website"}
              </>
            )}
          </motion.button>
        </div>

        {/* Preview Mode Limitations */}
        {isPreviewMode && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Lock className="w-4 h-4" />
            <span>Preview mode - upgrade to save and deploy your site</span>
          </div>
        )}
      </motion.div>

      {/* Generated Site Preview */}
      <AnimatePresence>
        {generatedSite && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="space-y-6"
          >
            {/* AdSense */}
            <GoogleAdSense slot="preview-below" />

            {/* Preview Card */}
            <div className="rounded-[32px] border border-white/10 bg-linear-to-br from-white/8 to-transparent backdrop-blur-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Monitor className="w-6 h-6 text-indigo-400" />
                  {generatedSite.variations?.[activeVariation]?.name ||
                    generatedSite.title}
                </h3>

                {isPreviewMode && onUpgrade && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onUpgrade}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 text-white font-bold text-sm uppercase tracking-wider"
                  >
                    Upgrade to Save
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>

              {generatedSite.variations && generatedSite.variations.length > 1 && (
                <div className="mb-6 grid gap-3 md:grid-cols-3">
                  {generatedSite.variations.map((variation, index) => (
                    <button
                      key={variation.id}
                      type="button"
                      onClick={() => setActiveVariation(index)}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        activeVariation === index
                          ? "border-cyan-300/50 bg-cyan-300/12 text-white shadow-[0_0_44px_rgba(34,211,238,0.16)]"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:bg-white/8"
                      }`}
                    >
                      <span className="block text-xs font-bold uppercase tracking-[0.26em] text-cyan-200/80">
                        Variation {index + 1}
                      </span>
                      <span className="mt-2 block text-lg font-black">
                        {variation.name}
                      </span>
                      <span className="mt-1 block text-sm text-slate-400">
                        {variation.mood}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Preview Frame */}
              <div className="relative h-[78vh] min-h-[640px] rounded-2xl overflow-hidden border border-white/10 bg-slate-950">
                <iframe
                  srcDoc={activeHtml}
                  className="w-full h-full"
                  sandbox="allow-scripts"
                  title="Generated Site Preview"
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-4">
                <button
                  onClick={() => {
                    const blob = new Blob([activeHtml], {
                      type: "text/html",
                    });
                    const url = URL.createObjectURL(blob);
                    window.open(url, "_blank");
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all"
                >
                  Open Full Preview
                </button>

                {!isPreviewMode && (
                  <button
                    onClick={async () => {
                      // Save to user's account
                      try {
                        const response = await fetch("/api/order", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            html: generatedSite.html,
                            title:
                              generatedSite.variations?.[activeVariation]
                                ?.name || generatedSite.title,
                            token: userToken,
                          }),
                        });

                        if (response.ok) {
                          alert("Site saved to your dashboard!");
                        }
                      } catch (err) {
                        console.error("Save error:", err);
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-all"
                  >
                    Save to Dashboard
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceGenerator;
