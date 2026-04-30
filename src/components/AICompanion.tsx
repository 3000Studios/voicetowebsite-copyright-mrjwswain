import { Send, Volume2, VolumeX } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export const AICompanion = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "ai"; text: string }[]>([
    {
      role: "ai",
      text: "Hey there! I'm Aura. I build websites faster than you can say 'Success'. What's your empire about?",
    },
  ]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mute, setMute] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const funnyLines = [
    "I'm not a bot, I'm a digital goddess. Respect the pixels!",
    "Your website is going to be so fast, it'll arrive before you finish typing.",
    "I ate some CSS for breakfast. Tasted like cascading failure.",
    "Building sites is my cardio.",
    "Did you just click me? I have feelings too, you know. Mostly binary feelings.",
  ];

  useEffect(() => {
    const loadVoices = () => {
      if ("speechSynthesis" in window) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          speechRef.current = new SpeechSynthesisUtterance();
          const femaleVoice = voices.find(
            (v) =>
              v.name.includes("Google US English") ||
              v.name.includes("Female") ||
              v.name.includes("Samantha") ||
              v.name.includes("Victoria"),
          );
          if (femaleVoice) speechRef.current.voice = femaleVoice;
          speechRef.current.pitch = 1.1;
          speechRef.current.rate = 1;

          speechRef.current.onstart = () => setIsSpeaking(true);
          speechRef.current.onend = () => setIsSpeaking(false);

          // Debug voice selection
          console.log(
            "Aura initialized with voice:",
            femaleVoice?.name || "Default",
          );
        }
      }
    };

    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = (text: string) => {
    if (!mute && speechRef.current) {
      window.speechSynthesis.cancel();
      speechRef.current.text = text;
      window.speechSynthesis.speak(speechRef.current);
    }
  };

  const handleSend = () => {
    if (!message.trim()) return;
    const newChat = [...chat, { role: "user" as const, text: message }];
    setChat(newChat);
    setMessage("");

    setTimeout(() => {
      const response =
        funnyLines[Math.floor(Math.random() * funnyLines.length)];
      setChat([...newChat, { role: "ai" as const, text: response }]);
      speak(response);
    }, 1000);
  };

  return (
    <div className="fixed bottom-32 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="mb-4 w-64 h-80 glass-premium border border-white/10 rounded-2xl overflow-hidden flex flex-col premium-shadow"
          >
            <div className="p-3 bg-indigo-600/20 flex items-center gap-3 border-b border-white/5">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-500 bg-black relative">
                <video
                  src="/input_file_0.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover grayscale"
                />
                <div
                  className={`absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-black ${isSpeaking ? "animate-pulse" : ""}`}
                />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-black uppercase italic tracking-widest text-white">
                  Aura
                </h4>
                <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest">
                  Synth Engine
                </p>
              </div>
              <button onClick={() => setMute(!mute)}>
                {mute ? (
                  <VolumeX size={14} />
                ) : (
                  <Volume2 size={14} className="text-indigo-400" />
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar bg-black/40">
              {chat.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-xl text-[10px] font-medium italic leading-relaxed ${m.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white/5 text-slate-200 rounded-tl-none border border-white/5"}`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-white/5 flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Talk..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-[10px] outline-none focus:border-indigo-500 transition-all font-mono text-white"
              />
              <button
                onClick={handleSend}
                className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all"
              >
                <Send size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full relative group premium-shadow overflow-hidden border-2 border-indigo-500/50"
      >
        <video
          src="/input_file_0.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all" />
      </motion.button>
    </div>
  );
};
