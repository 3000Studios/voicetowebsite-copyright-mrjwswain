import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fadeUp, staggerParent } from '../animations/variants.js'
import { blogPosts } from '../src/siteData.js'

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

const AUTO_POSTS = [
{ slug: 'voice-ai-website-builder-2026', title: 'Why Voice AI is the Future of Website Building in 2026', date: 'Apr 11, 2026', emoji: '🎙️', category: 'AI', excerpt: 'The shift from typing to talking is accelerating. Here is why voice-first web creation is winning.' },
{ slug: 'niche-site-strategy-voice', title: 'Build 10 Niche Sites in a Weekend Using Voice Commands', date: 'Apr 10, 2026', emoji: '💰', category: 'Strategy', excerpt: 'A step-by-step playbook for building a portfolio of revenue-generating niche sites with AI.' },
{ slug: 'adsense-optimization-ai-sites', title: 'How to Maximize AdSense Revenue on AI-Generated Sites', date: 'Apr 9, 2026', emoji: '📈', category: 'Monetization', excerpt: 'Placement, content density, and page structure tips that doubled our RPM in 30 days.' },
{ slug: 'seo-voice-content-strategy', title: 'SEO for Voice-Generated Content: What Actually Works', date: 'Apr 8, 2026', emoji: '🔍', category: 'SEO', excerpt: 'AI content can rank — if you know the right structure. Here is our proven framework.' },
{ slug: 'auto-deploy-cloudflare-pages', title: 'Auto-Deploy to Cloudflare Pages: The Complete Guide', date: 'Apr 7, 2026', emoji: '🚀', category: 'Dev', excerpt: 'How we set up a zero-touch deployment pipeline that ships new content every hour.' },
{ slug: 'voice-to-website-vs-webflow', title: 'VoiceToWebsite vs Webflow: Which is Faster in 2026?', date: 'Apr 6, 2026', emoji: '⚡', category: 'Comparison', excerpt: 'We built the same site on both platforms and timed every step. The results surprised us.' }
]

export default function BlogPage() {
const [filter, setFilter] = useState('All')
const allPosts = [...blogPosts, ...AUTO_POSTS]
const categories = ['All', ...new Set(AUTO_POSTS.map(p => p.category))]
const filtered = filter === 'All' ? allPosts : AUTO_POSTS.filter(p => p.category === filter)

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
          <span className="hero-eyebrow">Auto-Generated · Updated Hourly</span>
        </motion.div>
        <motion.h1 className="hero-headline" variants={fadeUp} style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
          The <span className="gradient-text">VoiceToWebsite</span> Blog
        </motion.h1>
        <motion.p className="hero-sub" variants={fadeUp}>
          Strategies, tutorials, and insights on AI-powered web building, SEO, and monetization.
        </motion.p>
      </motion.div>
    </section>

    {/* Filter */}
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem 2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => setFilter(cat)}
          className={`button ${filter === cat ? 'button--secondary' : 'button--ghost'}`}
          style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
        >
          {cat}
        </button>
      ))}
    </div>

    {/* Ad slot */}
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
      <AdSlot slot="2233445566" />
    </div>

    {/* Posts grid */}
    <section className="section" style={{ paddingTop: '2rem' }}>
      <div className="card-grid">
        {filtered.map((post, i) => (
          <Link
            key={post.slug || post.title}
            to={`/blog/${post.slug || 'post'}`}
            className="blog-card reveal"
            style={{ transitionDelay: `${(i % 3) * 0.1}s` }}
          >
            <div className="blog-card__thumb">
              <div className="blog-card__thumb-placeholder">{post.emoji || '📝'}</div>
            </div>
            <div className="blog-card__body">
              <div className="blog-card__meta">{post.date || post.publishedAt || 'Recent'}</div>
              <h3 className="blog-card__title">{post.title}</h3>
              <p className="blog-card__excerpt">{post.excerpt || post.summary || ''}</p>
              <span className="blog-card__link">Read more →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>

    {/* Bottom ad */}
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
      <AdSlot slot="3344556677" />
    </div>
  </div>
)
}