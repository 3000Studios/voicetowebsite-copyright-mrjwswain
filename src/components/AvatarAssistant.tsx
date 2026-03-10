import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type ChatRole = "assistant" | "user";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "I can guide people to pricing, demo, support, and the right pages without covering the screen. Ask me anything about the site.",
  },
];

const QUICK_ACTIONS = [
  { label: "Show Pricing", path: "/pricing" },
  { label: "Open Demo", path: "/demo" },
  { label: "Need Support", path: "/support" },
];

const buildMessageId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const AvatarArt: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div
    className={`relative ${compact ? "h-14 w-14" : "h-20 w-20"} shrink-0`}
    aria-hidden
  >
    <div className="absolute inset-0 rounded-full bg-cyan-400/15 blur-xl" />
    <div className="absolute inset-1 rounded-full bg-gradient-to-br from-cyan-300 via-sky-400 to-emerald-300 opacity-90" />
    <div className="absolute inset-[7px] rounded-full border border-white/40 bg-slate-950/85 shadow-[0_0_25px_rgba(34,211,238,0.35)]" />
    <div className="absolute left-1/2 top-[26%] h-2 w-2 -translate-x-4 rounded-full bg-cyan-100 shadow-[0_0_10px_rgba(207,250,254,0.8)]" />
    <div className="absolute left-1/2 top-[26%] h-2 w-2 translate-x-2 rounded-full bg-cyan-100 shadow-[0_0_10px_rgba(207,250,254,0.8)]" />
    <div className="absolute left-1/2 top-[50%] h-7 w-10 -translate-x-1/2 rounded-[999px] border border-cyan-300/35 bg-cyan-400/10" />
    <div className="absolute left-1/2 top-[58%] h-2 w-5 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-200 to-emerald-200" />
    <div className="absolute left-1/2 top-0 h-3 w-14 -translate-x-1/2 rounded-full border border-cyan-300/30 bg-cyan-400/10" />
  </div>
);

const AvatarAssistant: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const conversationHistory = useMemo(
    () =>
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    [messages]
  );

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isOpen]);

  const sendMessage = async (value: string) => {
    const message = value.trim();
    if (!message || isSending) return;

    const userMessage: ChatMessage = {
      id: buildMessageId(),
      role: "user",
      content: message,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          history: conversationHistory.slice(-8),
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        reply?: string;
        error?: string;
      } | null;

      const reply =
        response.ok && payload?.reply
          ? payload.reply
          : "I can help with pricing, demo flow, support, and where pages live on this site.";

      setMessages((current) => [
        ...current,
        {
          id: buildMessageId(),
          role: "assistant",
          content: reply,
        },
      ]);
    } catch (_) {
      setMessages((current) => [
        ...current,
        {
          id: buildMessageId(),
          role: "assistant",
          content:
            "The live chat service is unavailable right now. You can still use the quick links here to get to the main pages.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-50">
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mb-4 w-[min(92vw,24rem)] overflow-hidden rounded-[1.75rem] border border-cyan-300/20 bg-slate-950/92 shadow-[0_24px_80px_rgba(2,12,27,0.55)] backdrop-blur-xl"
          >
            <div className="border-b border-white/8 bg-gradient-to-r from-cyan-500/12 via-sky-500/8 to-emerald-400/10 p-5">
              <div className="flex items-start gap-4">
                <AvatarArt />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-outfit text-lg font-black text-white">
                      Voice Assistant
                    </h2>
                    <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.2em] text-emerald-200">
                      Fixed
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/68">
                    Stable position, better contrast, real answers, and direct
                    shortcuts to the pages people usually need first.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.path}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate(action.path);
                    }}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:border-cyan-300/35 hover:bg-cyan-400/10 hover:text-white"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              ref={listRef}
              className="max-h-[22rem] space-y-3 overflow-y-auto p-4"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-cyan-400 text-slate-950"
                        : "border border-white/10 bg-white/[0.04] text-white/80"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/60">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            <form
              className="border-t border-white/8 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage(draft);
              }}
            >
              <label htmlFor="vtw-avatar-chat" className="sr-only">
                Ask the assistant
              </label>
              <div className="flex items-end gap-3">
                <textarea
                  id="vtw-avatar-chat"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={2}
                  placeholder="Ask about pricing, demo, support, or where a page lives..."
                  className="min-h-[3.25rem] flex-1 resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-cyan-300/35"
                />
                <button
                  type="submit"
                  disabled={isSending || !draft.trim()}
                  className="rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-300 px-4 py-3 text-sm font-black text-slate-950 transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Send
                </button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="group flex items-center gap-3 rounded-full border border-cyan-300/25 bg-slate-950/88 px-3 py-2 pr-5 shadow-[0_18px_50px_rgba(8,47,73,0.45)] backdrop-blur-xl transition-colors hover:border-cyan-200/45"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close assistant" : "Open assistant"}
      >
        <AvatarArt compact />
        <div className="text-left">
          <p className="font-outfit text-sm font-black uppercase tracking-[0.16em] text-white">
            Ask VoiceToWebsite
          </p>
          <p className="text-xs text-white/58">
            Stable help panel. No mouse chasing.
          </p>
        </div>
      </button>
    </div>
  );
};

export default AvatarAssistant;
