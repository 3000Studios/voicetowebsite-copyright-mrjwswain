import React from 'react'

const OPENING_LINE =
  "I can help you shape a prompt for the website generator, explain your dashboard, or send you to pricing if you need more capacity."

const QUICK_REPLIES = [
  {
    label: 'Prompt help',
    reply:
      'Describe your business, city, offer, audience, trust signals, and the main conversion goal. That gives the generator enough detail to avoid generic pages.'
  },
  {
    label: 'Pricing help',
    reply: 'Use Starter for light builds, Pro for higher throughput, and Enterprise when you need hands-on rollout and governance.'
  },
  {
    label: 'Ads safety',
    reply:
      'Generated previews run in a protected sandbox. Live AdSense wrappers stay locked so preview output does not overwrite production ad slots.'
  }
]

export default function PremiumAICompanion() {
  const [open, setOpen] = React.useState(false)
  const [muted, setMuted] = React.useState(true)
  const [input, setInput] = React.useState('')
  const [messages, setMessages] = React.useState([{ role: 'assistant', text: OPENING_LINE }])

  function pushAssistantMessage(text) {
    setMessages((current) => [...current, { role: 'assistant', text }])
    if (!muted && 'speechSynthesis' in window) {
      const utterance = new window.SpeechSynthesisUtterance(text)
      utterance.rate = 1
      utterance.pitch = 1.02
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    }
  }

  function sendMessage(value) {
    const normalized = String(value ?? '').trim()
    if (!normalized) return
    setMessages((current) => [...current, { role: 'user', text: normalized }])
    setInput('')

    const lower = normalized.toLowerCase()
    if (lower.includes('price') || lower.includes('plan') || lower.includes('pay')) {
      pushAssistantMessage(QUICK_REPLIES[1].reply)
      return
    }
    if (lower.includes('ad') || lower.includes('adsense')) {
      pushAssistantMessage(QUICK_REPLIES[2].reply)
      return
    }
    pushAssistantMessage(QUICK_REPLIES[0].reply)
  }

  return (
    <div className="ai-companion">
      {open ? (
        <section className="ai-companion__panel" aria-label="AI companion">
          <header className="ai-companion__header">
            <div>
              <span className="eyebrow">Aura assistant</span>
              <strong>VoiceToWebsite companion</strong>
            </div>
            <div className="ai-companion__header-actions">
              <button type="button" className="ai-companion__icon" onClick={() => setMuted((value) => !value)} aria-label={muted ? 'Enable voice' : 'Mute voice'}>
                {muted ? '🔇' : '🔊'}
              </button>
              <button type="button" className="ai-companion__icon" onClick={() => setOpen(false)} aria-label="Close assistant">
                ✕
              </button>
            </div>
          </header>

          <div className="ai-companion__messages">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`ai-companion__message ai-companion__message--${message.role}`}>
                {message.text}
              </div>
            ))}
          </div>

          <div className="ai-companion__quick-actions">
            {QUICK_REPLIES.map((item) => (
              <button key={item.label} type="button" className="pill-button" onClick={() => pushAssistantMessage(item.reply)}>
                {item.label}
              </button>
            ))}
          </div>

          <form
            className="ai-companion__composer"
            onSubmit={(event) => {
              event.preventDefault()
              sendMessage(input)
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about prompts, plans, or dashboard access"
            />
            <button type="submit" className="button button--primary" aria-label="Send message">
              →
            </button>
          </form>
        </section>
      ) : null}

      <button type="button" className="ai-companion__trigger" onClick={() => setOpen((value) => !value)} aria-label="Open AI companion">
        <span className="ai-companion__trigger-ring" />
        ✦
      </button>
    </div>
  )
}
