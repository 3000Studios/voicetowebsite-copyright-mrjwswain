import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import MetricStrip from '../components/MetricStrip.jsx'
import OfferCheckoutCard from '../components/OfferCheckoutCard.jsx'
import PrismHeadline from '../components/PrismHeadline.jsx'
import RichBlocks from '../components/RichBlocks.jsx'
import { fadeUp, staggerParent } from '../animations/variants.js'
import { useSiteRuntime } from '../src/SiteRuntimeContext.jsx'
import { featurePage, homepage, pricingPage, productCatalog } from '../src/siteData.js'

function formatCurrency(amount) {
return new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
}).format(amount)
}

function AdSlot({ slot, format = 'auto', style = {} }) {
useEffect(() => {
  try {
    if (window.adsbygoogle) {
      window.adsbygoogle.push({})
    }
  } catch (e) {}
}, [])
return (
  <div className="ad-slot" style={style}>
    <ins
      className="adsbygoogle"
      style={{ display: 'block', ...style }}
      data-ad-client="ca-pub-replace-me"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  </div>
)
}

function HeroParticles() {
const canvasRef = useRef(null)
useEffect(() => {
  const canvas = canvasRef.current
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  let raf
  let w = canvas.width = window.innerWidth
  let h = canvas.height = window.innerHeight
  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 2 + 0.5,
    alpha: Math.random() * 0.5 + 0.1,
    color: ['#7c3aed', '#06b6d4', '#f59e0b'][Math.floor(Math.random() * 3)]
  }))
  function draw() {
    ctx.clearRect(0, 0, w, h)
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy
      if (p.x < 0 || p.x > w) p.vx *= -1
      if (p.y < 0 || p.y > h) p.vy *= -1
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.alpha
      ctx.fill()
    })
    ctx.globalAlpha = 1
    raf = requestAnimationFrame(draw)
  }
  draw()
  const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight }
  window.addEventListener('resize', onResize)
  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
}, [])
return <canvas ref={canvasRef} className="hero-particles" aria-hidden="true" />
}

function useReveal() {
useEffect(() => {
  const els = document.querySelectorAll('.reveal')
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) } }),
    { threshold: 0.1 }
  )
  els.forEach(el => observer.observe(el))
  return () => observer.disconnect()
}, [])
}

export default function HomePage() {
const { snapshot } = useSiteRuntime()
useReveal()

const liveMetrics = [
  { label: 'Sites Launched', value: String(snapshot?.analytics?.visitors ?? '2,847') },
  { label: 'Leads Captured', value: String(snapshot?.analytics?.leads ?? '14,203') },
  { label: 'Revenue Recorded', value: formatCurrency(snapshot?.analytics?.revenue ?? 89400) },
  { label: 'Avg Build Time', value: '< 3 min' }
]

const steps = [
  { icon: '🎙️', step: '01', title: 'Speak Your Brief', desc: 'Describe your website in plain English. No forms, no templates, just talk.' },
  { icon: '🤖', step: '02', title: 'AI Builds It', desc: 'Our AI generates pages, copy, SEO metadata, and structure in seconds.' },
  { icon: '🚀', step: '03', title: 'Deploy Instantly', desc: 'One click pushes your site live on a global CDN. Done.' }
]

const testimonials = [
  { text: 'I described my agency in 2 minutes and had a live site in under 5. This is the future.', name: 'Marcus T.', role: 'Agency Owner', initials: 'MT' },
  { text: 'Replaced my entire web team for client landing pages. The quality is unreal.', name: 'Sarah K.', role: 'Startup Founder', initials: 'SK' },
  { text: 'Built 12 niche sites in a weekend. Each one ranks. VoiceToWebsite is a cheat code.', name: 'Devon R.', role: 'SEO Entrepreneur', initials: 'DR' }
]

return (
  <div>
    {/* ── HERO ── */}
    <section className="hero-section">
      <HeroParticles />
      <div className="hero-video-bg" aria-hidden="true">
        <video autoPlay muted loop playsInline>
          <source src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-futuristic-devices-99786-large.mp4" type="video/mp4" />
        </video>
      </div>
      <motion.div
        className="hero-content"
        initial="hidden"
        animate="visible"
        variants={staggerParent}
      >
        <motion.div variants={fadeUp}>
          <span className="hero-eyebrow">AI-Powered · Voice-First · Instant Deploy</span>
        </motion.div>
        <motion.h1 className="hero-headline" variants={fadeUp}>
          Your Voice.<br />
          <span className="gradient-text">A Live Website.</span><br />
          In Minutes.
        </motion.h1>
        <motion.p className="hero-sub" variants={fadeUp}>
          Speak your idea. Our AI builds the pages, writes the copy, optimizes for SEO, and deploys to a global CDN — all without touching a line of code.
        </motion.p>
        <motion.div className="hero-actions" variants={fadeUp}>
          <Link className="button button--primary button--lg" to="/products">
            🎙️ Start Building Free
          </Link>
          <Link className="button button--ghost button--lg" to="/blog">
            See How It Works →
          </Link>
        </motion.div>
        <motion.div className="voice-demo" variants={fadeUp}>
          <div className="voice-orb" role="button" aria-label="Try voice demo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
          <span className="voice-demo-label">Tap to try a voice demo</span>
        </motion.div>
      </motion.div>
      <div className="scroll-indicator" aria-hidden="true">
        <div className="scroll-indicator__line" />
        <span className="scroll-indicator__text">Scroll</span>
      </div>
    </section>

    {/* ── METRICS ── */}
    <MetricStrip items={liveMetrics} />

    {/* ── AD SLOT: Leaderboard ── */}
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
      <AdSlot slot="1234567890" format="auto" style={{ minHeight: '90px' }} />
    </div>

    {/* ── HOW IT WORKS ── */}
    <section className="section">
      <div className="section-header reveal">
        <span className="section-eyebrow">How It Works</span>
        <h2 className="section-title">From spoken idea to live site in 3 steps</h2>
        <p className="section-intro">No designers. No developers. No waiting. Just speak and ship.</p>
      </div>
      <div className="card-grid">
        {steps.map((step, i) => (
          <motion.article
            key={step.step}
            className="card reveal"
            style={{ transitionDelay: `${i * 0.1}s` }}
            whileHover={{ y: -4 }}
          >
            <div className="card__icon">{step.icon}</div>
            <div className="card__step">{step.step}</div>
            <h3 className="card__title">{step.title}</h3>
            <p className="card__body">{step.desc}</p>
          </motion.article>
        ))}
      </div>
    </section>

    {/* ── FEATURES ── */}
    <section className="section">
      <div className="section-header reveal">
        <span className="section-eyebrow">Features</span>
        <h2 className="section-title">Everything you need to launch fast</h2>
      </div>
      <RichBlocks title={featurePage.headline} intro={featurePage.intro} items={featurePage.items} />
    </section>

    {/* ── AD SLOT: Rectangle ── */}
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', justifyContent: 'center' }}>
      <AdSlot slot="0987654321" format="rectangle" style={{ minHeight: '250px', maxWidth: '336px', width: '100%' }} />
    </div>

    {/* ── TESTIMONIALS ── */}
    <section className="section">
      <div className="section-header reveal">
        <span className="section-eyebrow">Social Proof</span>
        <h2 className="section-title">Builders love VoiceToWebsite</h2>
      </div>
      <div className="card-grid">
        {testimonials.map((t, i) => (
          <div key={t.name} className="testimonial-card reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
            <p className="testimonial-card__text">{t.text}</p>
            <div className="testimonial-card__author">
              <div className="testimonial-card__avatar">{t.initials}</div>
              <div>
                <div className="testimonial-card__name">{t.name}</div>
                <div className="testimonial-card__role">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* ── PRICING ── */}
    <section className="section">
      <div className="section-header reveal">
        <span className="section-eyebrow">Pricing</span>
        <h2 className="section-title">{pricingPage.headline || 'Simple, transparent pricing'}</h2>
        <p className="section-intro">{pricingPage.subheadline || 'Start free. Scale as you grow.'}</p>
      </div>
      <div className="pricing-grid">
        {pricingPage.tiers && pricingPage.tiers.length > 0 ? pricingPage.tiers.map((tier, i) => (
          <div key={tier.name} className={`pricing-card reveal${tier.featured ? ' pricing-card--featured' : ''}`} style={{ transitionDelay: `${i * 0.1}s` }}>
            <div className="pricing-card__name">{tier.name}</div>
            <div className="pricing-card__price">{tier.price}<span>/mo</span></div>
            <p className="pricing-card__desc">{tier.description}</p>
            <ul className="pricing-card__features">
              {(tier.features || []).map(f => (
                <li key={f} className="pricing-card__feature">{f}</li>
              ))}
            </ul>
            <Link className={`button ${tier.featured ? 'button--primary' : 'button--ghost'}`} to="/products">
              Get Started
            </Link>
          </div>
        )) : (
          <>
            <div className="pricing-card reveal">
              <div className="pricing-card__name">Starter</div>
              <div className="pricing-card__price">$0<span>/mo</span></div>
              <p className="pricing-card__desc">Perfect for trying out VoiceToWebsite.</p>
              <ul className="pricing-card__features">
                <li className="pricing-card__feature">3 sites</li>
                <li className="pricing-card__feature">Voice builder</li>
                <li className="pricing-card__feature">Basic SEO</li>
              </ul>
              <Link className="button button--ghost" to="/products">Get Started</Link>
            </div>
            <div className="pricing-card pricing-card--featured reveal reveal-delay-1">
              <div className="pricing-card__name">Pro</div>
              <div className="pricing-card__price">$49<span>/mo</span></div>
              <p className="pricing-card__desc">For serious builders and agencies.</p>
              <ul className="pricing-card__features">
                <li className="pricing-card__feature">Unlimited sites</li>
                <li className="pricing-card__feature">Auto-content generation</li>
                <li className="pricing-card__feature">Advanced SEO + analytics</li>
                <li className="pricing-card__feature">Custom domains</li>
                <li className="pricing-card__feature">Priority support</li>
              </ul>
              <Link className="button button--primary" to="/products">Get Started</Link>
            </div>
            <div className="pricing-card reveal reveal-delay-2">
              <div className="pricing-card__name">Agency</div>
              <div className="pricing-card__price">$149<span>/mo</span></div>
              <p className="pricing-card__desc">White-label for agencies and resellers.</p>
              <ul className="pricing-card__features">
                <li className="pricing-card__feature">Everything in Pro</li>
                <li className="pricing-card__feature">White-label branding</li>
                <li className="pricing-card__feature">Client management</li>
                <li className="pricing-card__feature">API access</li>
              </ul>
              <Link className="button button--ghost" to="/products">Get Started</Link>
            </div>
          </>
        )}
      </div>
    </section>

    {/* ── LIVE COMMERCE ── */}
    {snapshot?.commerce?.offers?.length ? (
      <section className="section">
        <div className="section-header reveal">
          <span className="section-eyebrow">Live Checkout</span>
          <h2 className="section-title">Buy directly</h2>
        </div>
        <div className="card-grid">
          {snapshot.commerce.offers.filter(o => o.slug !== 'enterprise-deployment').map(offer => (
            <OfferCheckoutCard key={offer.slug} offer={offer} />
          ))}
        </div>
      </section>
    ) : null}

    {/* ── BLOG PREVIEW ── */}
    <section className="section">
      <div className="section-heading reveal">
        <div>
          <span className="section-eyebrow">Latest</span>
          <h2 className="section-title">From the blog</h2>
        </div>
        <Link className="button button--ghost" to="/blog">All posts →</Link>
      </div>
      <div className="card-grid">
        {[
          { title: 'How to Build a 6-Figure Niche Site with Voice AI', date: 'Apr 10, 2026', emoji: '💰', excerpt: 'We built 3 niche sites using only voice commands and ranked all of them in 30 days.' },
          { title: 'VoiceToWebsite vs Traditional Web Builders', date: 'Apr 8, 2026', emoji: '⚡', excerpt: 'A head-to-head comparison of speed, cost, and quality across 5 popular platforms.' },
          { title: 'The Auto-Content Engine: How It Works', date: 'Apr 6, 2026', emoji: '🤖', excerpt: 'Every hour, our AI generates a new page and blog post. Here is how we built it.' }
        ].map((post, i) => (
          <Link key={post.title} to="/blog" className="blog-card reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
            <div className="blog-card__thumb">
              <div className="blog-card__thumb-placeholder">{post.emoji}</div>
            </div>
            <div className="blog-card__body">
              <div className="blog-card__meta">{post.date}</div>
              <h3 className="blog-card__title">{post.title}</h3>
              <p className="blog-card__excerpt">{post.excerpt}</p>
              <span className="blog-card__link">Read more →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>

    {/* ── AD SLOT: Bottom leaderboard ── */}
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
      <AdSlot slot="1122334455" format="auto" style={{ minHeight: '90px' }} />
    </div>

    {/* ── CTA BAND ── */}
    <section className="section">
      <div className="cta-band reveal">
        <span className="section-eyebrow">Ready to build?</span>
        <h2 className="section-title" style={{ marginTop: '1rem' }}>Your next website starts with a sentence.</h2>
        <p className="section-intro" style={{ marginBottom: '2rem' }}>
          Join thousands of builders who ship faster with VoiceToWebsite. No credit card required.
        </p>
        <div className="hero-actions" style={{ justifyContent: 'center' }}>
          <Link className="button button--primary button--lg" to="/products">
            🎙️ Start Building Free
          </Link>
          <Link className="button button--ghost button--lg" to="/contact">
            Talk to Us
          </Link>
        </div>
      </div>
    </section>
  </div>
)
}