import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp } from '../animations/variants.js'

const NAV = [
{ id: 'overview', label: '📊 Overview', icon: '📊' },
{ id: 'content', label: '🤖 Auto-Content', icon: '🤖' },
{ id: 'livestream', label: '📡 Live Stream', icon: '📡' },
{ id: 'store', label: '🛍 Store', icon: '🛍' },
{ id: 'adsense', label: '💰 AdSense', icon: '💰' },
{ id: 'settings', label: '⚙️ Settings', icon: '⚙️' }
]

function OverviewPanel() {
const stats = [
  { label: 'Total Visitors', value: '2,847', delta: '+12%' },
  { label: 'Blog Posts', value: '48', delta: '+6 today' },
  { label: 'Products', value: '12', delta: 'active' },
  { label: 'Est. Revenue', value: '$89.4K', delta: '+8%' }
]
return (
  <div className="stack-lg">
    <div>
      <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>Dashboard Overview</h2>
      <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Welcome back. Here is what is happening on VoiceToWebsite.</p>
    </div>
    <div className="card-grid card-grid--4">
      {stats.map(s => (
        <div key={s.label} className="card">
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>{s.label}</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--ink)', marginBottom: '0.25rem' }}>{s.value}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-2)' }}>{s.delta}</div>
        </div>
      ))}
    </div>
    <div className="admin-card">
      <div className="admin-card__header">
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Recent Activity</span>
      </div>
      <div style={{ padding: '1rem 1.5rem' }}>
        {[
          { action: 'Auto-generated blog post', detail: '"Voice AI Trends 2026"', time: '2 min ago' },
          { action: 'New visitor session', detail: 'San Francisco, CA', time: '5 min ago' },
          { action: 'AdSense impression', detail: 'Slot #1234567890', time: '8 min ago' },
          { action: 'Auto-generated page', detail: 'Landing page: AI Tools', time: '1 hr ago' }
        ].map((item, i) => (
          <div key={i} className="commit-row">
            <div>
              <strong>{item.action}</strong>
              <span style={{ marginLeft: '0.5rem', color: 'var(--ink-faint)', fontSize: '0.8rem' }}>{item.detail}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', flexShrink: 0 }}>{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
)
}

function ContentPanel() {
const [status, setStatus] = useState('')
const [generating, setGenerating] = useState(false)
const [topic, setTopic] = useState('')
const [type, setType] = useState('blog')

function generate() {
  if (!topic) return
  setGenerating(true)
  setStatus('')
  setTimeout(() => {
    setStatus(`✅ ${type === 'blog' ? 'Blog post' : 'Page'} generated: "${topic}" — published to /${type}/${topic.toLowerCase().replace(/\s+/g, '-')}`)
    setGenerating(false)
    setTopic('')
  }, 2000)
}

return (
  <div className="stack-lg">
    <div>
      <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>Auto-Content Engine</h2>
      <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Generate blog posts and pages with AI. The engine also runs automatically every hour.</p>
    </div>

    <div className="admin-card">
      <div className="admin-card__header">
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Generate Now</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--accent-2)', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', padding: '2px 8px', borderRadius: '999px' }}>AUTO: HOURLY</span>
      </div>
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="field">
          <span>Content Type</span>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="blog">Blog Post</option>
            <option value="page">Landing Page</option>
            <option value="product">Product Page</option>
          </select>
        </div>
        <div className="field">
          <span>Topic / Title</span>
          <input
            type="text"
            placeholder="e.g. How to build a niche site with AI in 2026"
            value={topic}
            onChange={e => setTopic(e.target.value)}
          />
        </div>
        <button
          className="button button--primary"
          onClick={generate}
          disabled={generating || !topic}
          style={{ alignSelf: 'flex-start' }}
        >
          {generating ? '⏳ Generating...' : '🤖 Generate Content'}
        </button>
        {status && (
          <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--accent-2)' }}>
            {status}
          </div>
        )}
      </div>
    </div>

    <div className="admin-card">
      <div className="admin-card__header">
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Auto-Generation Schedule</span>
      </div>
      <div style={{ padding: '1.5rem' }}>
        <div className="bullet-list">
          <li>Blog post auto-generated every hour with trending AI/web topics</li>
          <li>Landing page auto-generated every 6 hours targeting long-tail keywords</li>
          <li>Images sourced from Unsplash API and embedded automatically</li>
          <li>SEO metadata (title, description, schema) generated for every piece</li>
          <li>All content pushed to Cloudflare Pages via Wrangler CLI</li>
        </div>
      </div>
    </div>
  </div>
)
}

function LiveStreamPanel() {
const [platform, setPlatform] = useState('youtube')
const [streamKey, setStreamKey] = useState('')
const [embedUrl, setEmbedUrl] = useState('')
const [saved, setSaved] = useState(false)

function save() {
  setSaved(true)
  setTimeout(() => setSaved(false), 2000)
}

const platformOptions = [
  { value: 'youtube', label: 'YouTube Live' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'rumble', label: 'Rumble' },
  { value: 'custom', label: 'Custom Embed URL' }
]

return (
  <div className="stack-lg">
    <div>
      <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>Live Stream Setup</h2>
      <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Configure your live stream embed. It will appear on the homepage and /live page.</p>
    </div>

    <div className="admin-card">
      <div className="admin-card__header">
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Stream Configuration</span>
      </div>
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="field">
          <span>Platform</span>
          <select value={platform} onChange={e => setPlatform(e.target.value)}>
            {platformOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        {platform !== 'custom' && (
          <div className="field">
            <span>Stream Key / Channel ID</span>
            <input
              type="text"
              placeholder={platform === 'youtube' ? 'e.g. jfKfPfyJRdk' : platform === 'twitch' ? 'e.g. your_channel_name' : 'Stream key'}
              value={streamKey}
              onChange={e => setStreamKey(e.target.value)}
            />
          </div>
        )}
        {platform === 'custom' && (
          <div className="field">
            <span>Custom Embed URL</span>
            <input
              type="url"
              placeholder="https://..."
              value={embedUrl}
              onChange={e => setEmbedUrl(e.target.value)}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="button button--primary" onClick={save}>
            {saved ? '✅ Saved!' : '💾 Save Stream Config'}
          </button>
          <button className="button button--ghost">
            📡 Test Embed
          </button>
        </div>
      </div>
    </div>

    <div className="admin-card">
      <div className="admin-card__header">
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Live Preview</span>
        <span className="livestream-badge">OFFLINE</span>
      </div>
      <div className="livestream-embed">
        {(streamKey || embedUrl) ? (
          <iframe
            src={platform === 'youtube'
              ? `https://www.youtube.com/embed/${streamKey}?autoplay=0`
              : platform === 'twitch'
              ? `https://player.twitch.tv/?channel=${streamKey}&parent=${window.location.hostname}`
              : embedUrl}
            style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', inset: 0 }}
            allowFullScreen
            title="Live Stream Preview"
          />
        ) : (
          <div className="livestream-offline">
            <h3>No stream configured</h3>
            <p>Enter your stream key above and save to see a preview.</p>
          </div>
        )}
      </div>
    </div>
  </div>
)
}

function StorePanel() {
const [products] = useState([
  { name: 'VoiceToWebsite Pro', price: '$49/mo', status: 'Active', type: 'Subscription' },
  { name: 'Agency License', price: '$149/mo', status: 'Active', type: 'Subscription' },
  { name: 'Lifetime Deal', price: '$297', status: 'Active', type: 'One-time' },
  { name: 'Done-For-You Setup', price: '$497', status: 'Draft', type: 'Service' }
])

return (
  <div className="stack-lg">
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>Product Store</h2>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Manage your products, pricing, and checkout links.</p>
      </div>
      <button className="button button--primary">+ Add Product</button>
    </div>

    <div className="admin-card">
      <div className="admin-card__header">
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Products ({products.length})</span>
      </div>
      <div style={{ padding: '0 1.5rem' }}>
        {products.map((p, i) => (
          <div key={i} className="commit-row">
            <div>
              <strong>{p.name}</strong>
              <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--ink-faint)' }}>{p.type}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{p.price}</span>
              <span style={{
                fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
                padding: '2px 8px', borderRadius: '999px',
                background: p.status === 'Active' ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${p.status === 'Active' ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.1)'}`,
                color: p.status === 'Active' ? 'var(--accent-2)' : 'var(--ink-faint)'
              }}>{p.status}</span>
              <button className="button button--ghost" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)
}

function AdSensePanel() {
return (
  <div className="stack-lg">
    <div>
      <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>AdSense Configuration</h2>
      <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Manage your ad slots and publisher ID.</p>
    </div>

    <div className="admin-card">
      <div className="admin-card__header">
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Publisher Settings</span>
      </div>
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="field">
          <span>Publisher ID (ca-pub-XXXXXXXXXXXXXXXX)</span>
          <input type="text" placeholder="ca-pub-replace-me" defaultValue="ca-pub-replace-me" />
        </div>
        <button className="button button--primary" style={{ alignSelf: 'flex-start' }}>Save Publisher ID</button>
      </div>
    </div>

    <div className="admin-card">
      <div className="admin-card__header">
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Ad Slots</span>
      </div>
      <div style={{ padding: '0 1.5rem' }}>
        {[
          { name: 'Homepage Leaderboard', slot: '1234567890', format: 'auto', location: 'Below hero' },
          { name: 'Homepage Rectangle', slot: '0987654321', format: 'rectangle', location: 'Mid-page' },
          { name: 'Homepage Bottom', slot: '1122334455', format: 'auto', location: 'Above footer' },
          { name: 'Blog Top', slot: '2233445566', format: 'auto', location: 'Below blog hero' },
          { name: 'Blog Bottom', slot: '3344556677', format: 'auto', location: 'Below posts grid' }
        ].map((slot, i) => (
          <div key={i} className="commit-row">
            <div>
              <strong>{slot.name}</strong>
              <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--ink-faint)' }}>{slot.location}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-2)', background: 'rgba(6,182,212,0.08)', padding: '2px 6px', borderRadius: '4px' }}>{slot.slot}</code>
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-faint)' }}>{slot.format}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="admin-card">
      <div className="admin-card__header">
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>ads.txt Status</span>
      </div>
      <div style={{ padding: '1.5rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-2)', background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: '8px', padding: '1rem' }}>
          google.com, pub-replace-me, DIRECT, f08c47fec0942fa0
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.75rem' }}>
          Replace <code style={{ color: 'var(--accent)' }}>pub-replace-me</code> with your real publisher ID once approved by Google AdSense.
        </p>
      </div>
    </div>
  </div>
)
}

function SettingsPanel({ onLogout }) {
return (
  <div className="stack-lg">
    <div>
      <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>Settings</h2>
      <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Site configuration and admin preferences.</p>
    </div>
    <div className="admin-card">
      <div className="admin-card__header">
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Site Info</span>
      </div>
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="field">
          <span>Site Name</span>
          <input type="text" defaultValue="VoiceToWebsite" />
        </div>
        <div className="field">
          <span>Tagline</span>
          <input type="text" defaultValue="Your Voice. A Live Website. In Minutes." />
        </div>
        <div className="field">
          <span>Contact Email</span>
          <input type="email" defaultValue="hello@voicetowebsite.com" />
        </div>
        <button className="button button--primary" style={{ alignSelf: 'flex-start' }}>Save Settings</button>
      </div>
    </div>
    <div className="admin-card">
      <div className="admin-card__header">
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Session</span>
      </div>
      <div style={{ padding: '1.5rem' }}>
        <button className="button button--ghost" onClick={onLogout}>
          🔒 Log Out
        </button>
      </div>
    </div>
  </div>
)
}

export default function AdminDashboardPage({ onLogout }) {
const [active, setActive] = useState('overview')

const panels = {
  overview: <OverviewPanel />,
  content: <ContentPanel />,
  livestream: <LiveStreamPanel />,
  store: <StorePanel />,
  adsense: <AdSensePanel />,
  settings: <SettingsPanel onLogout={onLogout} />
}

return (
  <div className="admin-app" style={{ paddingTop: 'calc(var(--ticker-h) + var(--topbar-h))' }}>
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <span className="admin-sidebar__mark" />
        <nav className="admin-nav">
          {NAV.map(item => (
            <button
              key={item.id}
              className={`admin-nav-link${active === item.id ? ' active' : ''}`}
              onClick={() => setActive(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label.replace(/^[^\s]+\s/, '')}</span>
            </button>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', fontSize: '0.7rem', color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
          v2.0.0 · 3000 Studios
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {panels[active]}
        </motion.div>
      </main>
    </div>
  </div>
)
}
