import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fadeUp, staggerParent } from '../animations/variants.js'

function AdSlot({ slot }) {
useEffect(() => {
  try { if (window.adsbygoogle) window.adsbygoogle.push({}) } catch (e) {}
}, [])
return (
  <div className="ad-slot">
    <ins className="adsbygoogle" style={{ display: 'block' }}
      data-ad-client="ca-pub-replace-me" data-ad-slot={slot}
      data-ad-format="auto" data-full-width-responsive="true" />
  </div>
)
}

const PRODUCTS = [
{
  slug: 'starter',
  name: 'Starter',
  price: 'Free',
  priceNote: 'forever',
  badge: null,
  description: 'Perfect for trying out VoiceToWebsite. Build up to 3 sites with the voice builder.',
  features: ['3 sites', 'Voice builder', 'Basic SEO', 'Cloudflare deploy', 'Community support'],
  cta: 'Get Started Free',
  ctaLink: '#',
  featured: false,
  type: 'subscription'
},
{
  slug: 'pro',
  name: 'Pro',
  price: '$49',
  priceNote: '/month',
  badge: 'Most Popular',
  description: 'For serious builders. Unlimited sites, auto-content, and advanced monetization.',
  features: ['Unlimited sites', 'Auto-content engine (hourly)', 'Advanced SEO + schema', 'Custom domains', 'AdSense optimization', 'Priority support', 'Analytics dashboard'],
  cta: 'Start Pro — $49/mo',
  ctaLink: '#',
  featured: true,
  type: 'subscription'
},
{
  slug: 'agency',
  name: 'Agency',
  price: '$149',
  priceNote: '/month',
  badge: null,
  description: 'White-label for agencies. Manage clients, resell, and scale.',
  features: ['Everything in Pro', 'White-label branding', 'Client management portal', 'API access', 'Bulk site generation', 'Dedicated support'],
  cta: 'Start Agency — $149/mo',
  ctaLink: '#',
  featured: false,
  type: 'subscription'
},
{
  slug: 'lifetime',
  name: 'Lifetime Deal',
  price: '$297',
  priceNote: 'one-time',
  badge: '🔥 Limited',
  description: 'Pay once, use forever. All Pro features, no recurring fees.',
  features: ['All Pro features', 'Lifetime updates', 'No monthly fees', 'Priority onboarding'],
  cta: 'Grab Lifetime — $297',
  ctaLink: '#',
  featured: false,
  type: 'one-time'
}
]

const APPS = [
{
  name: 'VoiceToWebsite Chrome Extension',
  icon: '🧩',
  description: 'Build and edit pages directly from your browser. Voice commands, instant preview.',
  badge: 'Coming Soon',
  link: '#'
},
{
  name: 'VoiceToWebsite iOS App',
  icon: '📱',
  description: 'Speak your site into existence from your iPhone. Full voice builder on mobile.',
  badge: 'Coming Soon',
  link: '#'
},
{
  name: 'VoiceToWebsite Android App',
  icon: '🤖',
  description: 'Android-native voice builder with offline mode and push notifications.',
  badge: 'Coming Soon',
  link: '#'
},
{
  name: 'VoiceToWebsite CLI',
  icon: '⌨️',
  description: 'Build and deploy sites from your terminal. Integrates with Cloudflare Pages.',
  badge: 'Beta',
  link: '#'
}
]

export default function ProductsPage() {
const [tab, setTab] = useState('plans')

useEffect(() => {
  const els = document.querySelectorAll('.reveal')
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) } }),
    { threshold: 0.1 }
  )
  els.forEach(el => observer.observe(el))
  return () => observer.disconnect()
}, [])

return (
  <div>
    {/* Hero */}
    <section className="hero-section" style={{ minHeight: '50vh', paddingTop: '8rem', paddingBottom: '4rem' }}>
      <motion.div className="hero-content" initial="hidden" animate="visible" variants={staggerParent}>
        <motion.div variants={fadeUp}>
          <span className="hero-eyebrow">Plans · Apps · Tools</span>
        </motion.div>
        <motion.h1 className="hero-headline" variants={fadeUp} style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
          Everything you need to <span className="gradient-text">ship faster</span>
        </motion.h1>
        <motion.p className="hero-sub" variants={fadeUp}>
          Pick a plan, grab the app, and start building. No credit card required to start.
        </motion.p>
      </motion.div>
    </section>

    {/* Tab switcher */}
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem 2rem', display: 'flex', gap: '0.5rem' }}>
      {[
        { id: 'plans', label: '💳 Pricing Plans' },
        { id: 'apps', label: '📱 App Store' },
        { id: 'tools', label: '🛠 Tools' }
      ].map(t => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`button ${tab === t.id ? 'button--secondary' : 'button--ghost'}`}
          style={{ padding: '0.5rem 1.25rem' }}
        >
          {t.label}
        </button>
      ))}
    </div>

    {/* Ad slot */}
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
      <AdSlot slot="4455667788" />
    </div>

    {/* PLANS TAB */}
    {tab === 'plans' && (
      <section className="section" style={{ paddingTop: '2rem' }}>
        <div className="pricing-grid">
          {PRODUCTS.map((p, i) => (
            <motion.div
              key={p.slug}
              className={`pricing-card reveal${p.featured ? ' pricing-card--featured' : ''}`}
              style={{ transitionDelay: `${i * 0.1}s` }}
              whileHover={{ y: -4 }}
            >
              {p.badge && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  background: p.featured ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                  color: p.featured ? '#000' : 'var(--ink)',
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                  padding: '3px 12px', borderRadius: '999px', whiteSpace: 'nowrap'
                }}>
                  {p.badge}
                </div>
              )}
              <div className="pricing-card__name">{p.name}</div>
              <div className="pricing-card__price">
                {p.price}<span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--ink-muted)' }}>{p.priceNote}</span>
              </div>
              <p className="pricing-card__desc">{p.description}</p>
              <ul className="pricing-card__features">
                {p.features.map(f => (
                  <li key={f} className="pricing-card__feature">{f}</li>
                ))}
              </ul>
              <a
                href={p.ctaLink}
                className={`button ${p.featured ? 'button--primary' : 'button--ghost'}`}
                style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
              >
                {p.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </section>
    )}

    {/* APPS TAB */}
    {tab === 'apps' && (
      <section className="section" style={{ paddingTop: '2rem' }}>
        <div className="section-header reveal">
          <span className="section-eyebrow">App Store</span>
          <h2 className="section-title">VoiceToWebsite on every platform</h2>
          <p className="section-intro">Build from your browser, phone, or terminal. The voice builder goes wherever you go.</p>
        </div>
        <div className="card-grid">
          {APPS.map((app, i) => (
            <motion.a
              key={app.name}
              href={app.link}
              className="card reveal"
              style={{ transitionDelay: `${i * 0.1}s`, textDecoration: 'none' }}
              whileHover={{ y: -4 }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{app.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <h3 className="card__title" style={{ margin: 0 }}>{app.name}</h3>
                <span style={{
                  fontSize: '0.6rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
                  padding: '2px 8px', borderRadius: '999px',
                  background: app.badge === 'Beta' ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${app.badge === 'Beta' ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  color: app.badge === 'Beta' ? 'var(--accent)' : 'var(--ink-faint)',
                  flexShrink: 0
                }}>{app.badge}</span>
              </div>
              <p className="card__body">{app.description}</p>
              <span className="blog-card__link" style={{ marginTop: 'auto' }}>
                {app.badge === 'Coming Soon' ? 'Join waitlist →' : 'Download →'}
              </span>
            </motion.a>
          ))}
        </div>
      </section>
    )}

    {/* TOOLS TAB */}
    {tab === 'tools' && (
      <section className="section" style={{ paddingTop: '2rem' }}>
        <div className="section-header reveal">
          <span className="section-eyebrow">Free Tools</span>
          <h2 className="section-title">Tools to help you build and grow</h2>
        </div>
        <div className="card-grid">
          {[
            { icon: '🎙️', name: 'Voice Brief Generator', desc: 'Turn a spoken idea into a structured website brief in seconds.', badge: 'Free' },
            { icon: '🔍', name: 'SEO Keyword Finder', desc: 'Find low-competition keywords for your niche site in any category.', badge: 'Free' },
            { icon: '📊', name: 'AdSense RPM Calculator', desc: 'Estimate your monthly AdSense revenue based on traffic and niche.', badge: 'Free' },
            { icon: '🚀', name: 'Cloudflare Deploy Checker', desc: 'Verify your Cloudflare Pages deployment is live and healthy.', badge: 'Free' }
          ].map((tool, i) => (
            <motion.div
              key={tool.name}
              className="card reveal"
              style={{ transitionDelay: `${i * 0.1}s` }}
              whileHover={{ y: -4 }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{tool.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <h3 className="card__title" style={{ margin: 0 }}>{tool.name}</h3>
                <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', padding: '2px 8px', borderRadius: '999px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: 'var(--accent-2)', flexShrink: 0 }}>{tool.badge}</span>
              </div>
              <p className="card__body">{tool.desc}</p>
              <button className="button button--ghost" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>Try it →</button>
            </motion.div>
          ))}
        </div>
      </section>
    )}

    {/* Bottom ad */}
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
      <AdSlot slot="5566778899" />
    </div>

    {/* CTA */}
    <section className="section">
      <div className="cta-band reveal">
        <span className="section-eyebrow">Still deciding?</span>
        <h2 className="section-title" style={{ marginTop: '1rem' }}>Start free. Upgrade when you are ready.</h2>
        <p className="section-intro" style={{ marginBottom: '2rem' }}>No credit card. No commitment. Just build.</p>
        <div className="hero-actions" style={{ justifyContent: 'center' }}>
          <a href="#" className="button button--primary button--lg">🎙️ Start Building Free</a>
          <Link to="/blog" className="button button--ghost button--lg">Read the Blog →</Link>
        </div>
      </div>
    </section>
  </div>
)
}