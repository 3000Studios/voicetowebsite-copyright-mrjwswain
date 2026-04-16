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
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    await new Promise((r) => setTimeout(r, 900))
    setLoading(false)
    setStatus('success')
    setForm({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <div className="stack-xl page-remix">
      <motion.section className="section-card page-remix__hero" variants={staggerParent} initial="hidden" animate="visible">
        <motion.span className="eyebrow" variants={fadeUp}>Contact</motion.span>
        <motion.h1 variants={fadeUp}>Let’s design and launch your next website</motion.h1>
        <motion.p className="section-intro" variants={fadeUp}>
          Partnerships, implementation questions, enterprise requests, or custom build support.
        </motion.p>
      </motion.section>

    <section className="section-card page-remix__surface">
      <div className="card-grid">
        {CONTACT_METHODS.map((m, i) => (
          <motion.a
            key={m.label}
            href={m.href}
            className="content-card"
            style={{ transitionDelay: `${i * 0.08}s`, textDecoration: 'none' }}
            whileHover={{ y: -4 }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{m.icon}</div>
            <h3>{m.label}</h3>
            <p style={{ marginBottom: '1rem' }}>{m.desc}</p>
            <span className="content-card__outcome">{m.action} →</span>
          </motion.a>
        ))}
      </div>
      <div className="section-card">
        <h2>Send a message</h2>
        <p className="section-intro">We reply within 24 hours on business days.</p>
        {status === 'success' ? <p className="form-success">Message sent. We will get back to you shortly.</p> : null}
        <form onSubmit={handleSubmit} className="stack-md">
          <div className="lead-form">
            <label className="field">
              <span>Name</span>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
            </label>
          </div>
          <label className="field">
            <span>Subject</span>
            <input name="subject" value={form.subject} onChange={handleChange} placeholder="What do you need?" required />
          </label>
          <label className="field">
            <span>Message</span>
            <textarea name="message" value={form.message} onChange={handleChange} rows={5} required />
          </label>
          <button type="submit" className="button button--primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send message'}
          </button>
        </form>
      </div>
    </section>

      <section className="section-card page-remix__surface">
        <span className="eyebrow">FAQ</span>
        <h2>Common questions</h2>
        <div className="card-grid card-grid--compact">
          {[
            { q: 'How fast can I get a site live?', a: 'Usually in minutes for the first version, then refined with your content and offers.' },
            { q: 'Can I use my own domain?', a: 'Yes. Cloudflare Pages custom domains are supported.' },
            { q: 'Do you support custom integrations?', a: 'Yes. We can wire CRM, payment, analytics, and automation flows.' }
          ].map((item) => (
            <article key={item.q} className="content-card">
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}