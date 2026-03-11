import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, MessageSquareText, Send, Sparkles } from "lucide-react";
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
      "I can guide people to pricing, demo, support, and where each public page lives without covering the screen.",
  },
];

const QUICK_ACTIONS = [
  { label: "Pricing", path: "/pricing" },
  { label: "Demo", path: "/demo" },
  { label: "Support", path: "/support" },
];

const buildMessageId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

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
      } | null;

      setMessages((current) => [
        ...current,
        {
          id: buildMessageId(),
          role: "assistant",
          content:
            response.ok && payload?.reply
              ? payload.reply
              : "I can still route you to pricing, demo flow, support, and the main page groups on this site.",
        },
      ]);
    } catch (_) {
      setMessages((current) => [
        ...current,
        {
          id: buildMessageId(),
          role: "assistant",
          content:
            "The live chat service is unavailable right now. Use the quick actions here to reach the main sections.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="vtw-assistant">
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.section
            className="vtw-assistant__panel vtw-glass-card"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div
              style={{
                padding: "1rem",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(135deg, rgba(0,242,255,0.08), rgba(112,0,255,0.12))",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.95rem",
                }}
              >
                <span className="vtw-avatar-art" aria-hidden="true" />
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.55rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontFamily: "var(--font-display)",
                        fontSize: "1.08rem",
                      }}
                    >
                      Voice Assistant
                    </h2>
                    <span className="vtw-chip">Fixed panel</span>
                  </div>
                  <p
                    style={{
                      margin: "0.45rem 0 0",
                      color: "var(--text-muted)",
                      lineHeight: 1.6,
                    }}
                  >
                    Better contrast, faster routing, and no cursor chasing.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.6rem",
                  marginTop: "1rem",
                }}
              >
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.path}
                    type="button"
                    className="vtw-button vtw-button-secondary"
                    style={{ minHeight: "2.7rem", paddingInline: "1rem" }}
                    onClick={() => {
                      setIsOpen(false);
                      navigate(action.path);
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="vtw-assistant__body">
              <div ref={listRef} className="vtw-assistant__messages">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`vtw-assistant__bubble ${
                      message.role === "user"
                        ? "vtw-assistant__bubble--user"
                        : "vtw-assistant__bubble--assistant"
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
                {isSending && (
                  <div className="vtw-assistant__bubble vtw-assistant__bubble--assistant">
                    Thinking...
                  </div>
                )}
              </div>

              <form
                style={{ marginTop: "0.95rem" }}
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage(draft);
                }}
              >
                <label htmlFor="vtw-avatar-chat" className="sr-only">
                  Ask the assistant
                </label>
                <textarea
                  id="vtw-avatar-chat"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={2}
                  placeholder="Ask about pricing, support, demo flow, or page locations..."
                  style={{
                    width: "100%",
                    minHeight: "5.5rem",
                    resize: "vertical",
                    marginBottom: "0.8rem",
                    padding: "0.95rem 1rem",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "20px",
                    background: "rgba(255,255,255,0.04)",
                  }}
                />
                <button
                  type="submit"
                  className="vtw-button vtw-button-primary"
                  disabled={isSending || !draft.trim()}
                  style={{ width: "100%" }}
                >
                  <Send size={16} />
                  Send message
                </button>
              </form>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <button
        type="button"
        className="vtw-assistant__launcher"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close assistant" : "Open assistant"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
          <span className="vtw-avatar-art" aria-hidden="true" />
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
              }}
            >
              <MessageSquareText size={16} />
              Ask VoiceToWebsite
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
              Premium chat panel. Stable position.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <Sparkles size={16} />
          <ArrowUpRight size={16} />
        </div>
      </button>
    </div>
  );
};

export default AvatarAssistant;
