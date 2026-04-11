import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, staggerParent } from '../animations/variants.js'

const CONTACT_METHODS = [
{ icon: '🎙️', label: 'Voice Demo', desc: 'See VoiceToWebsite live. Book a 15-min demo.', action: 'Book Demo', href: '#' },
{ icon: '💬', label: 'Live Chat', desc: 'Chat with the team right now.', action: 'Open Chat', href: '#' },
{ icon: '📧', label: 'Email', desc: 'hello@voicetowebsite.com', action: 'Send Email', href: 'mailto:hello@voicetowebsite.com' },
{ icon: '🐦', label: 'Twitter / X', desc: '@voicetowebsite', action: 'Follow Us', href: 'https://x.com/voicetowebsite' }
]

export default function ContactPage() {
const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
const [status, setStatus] = useState(null)
const [loading, setLoading] = useState(false)

function handleChange(e) {
  setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
}

async function handleSubmit(e) {
  e.preventDefault()
  setLoading(true)
  setStatus(null)
  await new Promise(r => setTimeout(r, 1200))
  setLoading(false)
  setStatus('success')
  setForm({ name: '', email: '', subject: '', message: '' })
}

return (
  <div>
    {/* Hero */}
    <section className="hero-section" style={{ minHeight: '45vh', paddingTop: '8rem', paddingBottom: '3rem' }}>
      <motion.div className="hero-content" initial="hidden" animate="visible" variants={staggerParent}>
        <motion.div variants={fadeUp}>
          <span className="hero-eyebrow">Get in Touch</span>
        </motion.div>
        <motion.h1 className="hero-headline" variants={fadeUp} style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
          Let's build something <span className="gradient-text">together</span>
        </motion.h1>
        <motion.p className="hero-sub" variants={fadeUp}>
          Questions, partnerships, press, or just want to say hi — we're here.
        </motion.p>
      </motion.div>
    </section>

    {/* Contact methods */}
    <section className="section" style={{ paddingTop: '2rem' }}>
      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {CONTACT_METHODS.map((m, i) => (
          <motion.a
            key={m.label}
            href={m.href}
            className="card reveal"
            style={{ transitionDelay: `${i * 0.08}s`, textDecoration: 'none' }}
            whileHover={{ y: -4 }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{m.icon}</div>
            <h3 className="card__title">{m.label}</h3>
            <p className="card__body" style={{ marginBottom: '1rem' }}>{m.desc}</p>
            <span className="blog-card__link" style={{ marginTop: 'auto' }}>{m.action} →</span>
          </motion.a>
        ))}
      </div>
    </section>

    {/* Contact form */}
    <section className="section">
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <motion.div
          className="card reveal"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Send a message</h2>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
              We reply within 24 hours on business days.
            </p>

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)',
                  borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem',
                  fontSize: '0.875rem', color: 'var(--accent-2)'
                }}
              >
                ✅ Message sent! We'll get back to you within 24 hours.
              </motion.div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="field">
                  <span>Name</span>
                  <input
                    name="name" value={form.name} onChange={handleChange}
                    placeholder="Your name" required
                  />
                </div>
                <div className="field">
                  <span>Email</span>
                  <input
                    type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="you@example.com" required
                  />
                </div>
              </div>
              <div className="field">
                <span>Subject</span>
                <input
                  name="subject" value={form.subject} onChange={handleChange}
                  placeholder="What's this about?" required
                />
              </div>
              <div className="field">
                <span>Message</span>
                <textarea
                  name="message" value={form.message} onChange={handleChange}
                  placeholder="Tell us what you're building..." rows={5} required
                  style={{ resize: 'vertical' }}
                />
              </div>
              <button
                type="submit"
                className="button button--primary"
                disabled={loading}
                style={{ alignSelf: 'flex-start', minWidth: '140px' }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    Sending...
                  </span>
                ) : 'Send Message →'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>

    {/* FAQ */}
    <section className="section">
      <div className="section-header reveal">
        <span className="section-eyebrow">FAQ</span>
        <h2 className="section-title">Common questions</h2>
      </div>
      <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[
          { q: 'How fast can I get a site live?', a: 'Under 5 minutes from voice brief to deployed Cloudflare Pages site. No code required.' },
          { q: 'Do you offer a free plan?', a: 'Yes — the Starter plan is free forever. Build up to 3 sites with the voice builder.' },
          { q: 'Can I use my own domain?', a: 'Yes. Pro and Agency plans support custom domains via Cloudflare Pages.' },
          { q: 'How does the auto-content engine work?', a: 'It generates a new blog post and landing page every hour using AI, then writes them to your content directory. Deploy triggers pick them up automatically.' },
          { q: 'Is AdSense already set up?', a: 'Ad slots are pre-configured on every page. Just replace the publisher ID placeholder with your real AdSense ID and you\'re live.' }
        ].map((item, i) => (
          <motion.div
            key={i}
            className="card reveal"
            style={{ transitionDelay: `${i * 0.07}s` }}
            whileHover={{ y: -2 }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>{item.q}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', margin: 0 }}>{item.a}</p>
          </motion.div>
        ))}
      </div>
    </section>
  </div>
)
}