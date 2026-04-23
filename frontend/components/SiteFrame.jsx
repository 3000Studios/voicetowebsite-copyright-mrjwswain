import React from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import PrismEnvironment from './PrismEnvironment.jsx'
import StarClusterSynth from '../backgrounds/StarClusterSynth.jsx'
import SiteFooter from './SiteFooter.jsx'
import { publicNavItems, publicStatusLines, publicTickerItems } from '../src/siteChrome.js'
import { SITE_DISPLAY_NAME } from '../src/siteMeta.js'
import { trackSiteEvent } from '../src/siteApi.js'
import AdSlot from './AdSlot.jsx'
import BrandWireframe from './BrandWireframe.jsx'
import StudioOpsBridge from './StudioOpsBridge.jsx'
import PremiumAICompanion from './PremiumAICompanion.jsx'

const VISITOR_SESSION_KEY = 'voicetowebsite_session_id'
const LEGACY_VISITOR_SESSION_KEY = 'myappai_session_id'

function getSessionId() {
  let existing = window.localStorage.getItem(VISITOR_SESSION_KEY)
  if (!existing) {
    const legacy = window.localStorage.getItem(LEGACY_VISITOR_SESSION_KEY)
    if (legacy) {
      window.localStorage.setItem(VISITOR_SESSION_KEY, legacy)
      window.localStorage.removeItem(LEGACY_VISITOR_SESSION_KEY)
      existing = legacy
    }
  }
  if (existing) {
    return existing
  }

  const nextId = `session-${crypto.randomUUID()}`
  window.localStorage.setItem(VISITOR_SESSION_KEY, nextId)
  return nextId
}

export default function SiteFrame() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const pageClass = React.useMemo(() => {
    if (location.pathname === '/') {
      return 'page--home'
    }
    if (location.pathname.startsWith('/pricing')) {
      return 'page--pricing'
    }
    if (location.pathname.startsWith('/products')) {
      return 'page--products'
    }
    if (location.pathname.startsWith('/blog')) {
      return 'page--blog'
    }
    if (location.pathname.startsWith('/contact')) {
      return 'page--contact'
    }
    if (location.pathname.startsWith('/dashboard')) {
      return 'page--dashboard'
    }
    return 'page--default'
  }, [location.pathname])
  const topNavItems = publicNavItems.filter((item) =>
    ['/', '/products', '/pricing', '/blog', '/contact'].includes(item.to)
  )

  React.useEffect(() => {
    trackSiteEvent({
      type: 'page_view',
      path: `${location.pathname}${location.search}`,
      sessionId: getSessionId(),
      referrer: document.referrer
    }).catch(() => {})
  }, [location.pathname, location.search])

  React.useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="shell">
      <StudioOpsBridge />
      <PrismEnvironment navItems={[]} statusLines={publicStatusLines} tickerItems={publicTickerItems} />
      <StarClusterSynth />
      <header className="studio-header">
        <div className="studio-header__inner">
          <NavLink className="studio-brand" to="/" aria-label={SITE_DISPLAY_NAME}>
            <div className="brand__signal" aria-hidden="true">
              {[20, 44, 72, 36, 92, 58, 84, 46, 64, 28, 52].map((height, index) => (
                <span key={`${height}-${index}`} style={{ '--signal-height': `${height}%`, '--signal-delay': `${index * 0.08}s` }} />
              ))}
            </div>
            <BrandWireframe size={34} />
            <span className="brand__pulse" aria-hidden="true" />
            <div className="brand__copy">
              <img className="brand__logo" src="/media/voicetowebsite-logo.jpg" alt="Voicetowebsite.com" />
              <span className="brand__meta">Neural manifestation engine</span>
            </div>
          </NavLink>

          <div className="studio-header__actions">
            <Link className="studio-pill" to="/pricing">
              Pricing
            </Link>
            <Link className="studio-pill studio-pill--primary" to="/contact">
              Start build
            </Link>
            <span className="studio-menu-label" aria-hidden="true">
              {menuOpen ? 'TERMINATE' : 'INITIALIZE'}
            </span>
            <button
              className={`studio-menu-trigger${menuOpen ? ' studio-menu-trigger--active' : ''}`}
              type="button"
              aria-expanded={menuOpen}
              aria-controls="studio-menu"
              onClick={() => setMenuOpen((current) => !current)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div
        id="studio-menu"
        className={`studio-menu${menuOpen ? ' studio-menu--open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <div className="studio-menu__background" aria-hidden="true">
          <video className="studio-menu__video" src="/media/hero-operator.mp4" autoPlay muted loop playsInline />
          <div className="studio-menu__scrim" />
        </div>
        <div className="noise-overlay" aria-hidden="true" />
        <div className="grid-structure" aria-hidden="true" />
        <nav className="studio-menu__nav" aria-label="Menu">
          {topNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `studio-menu__link${isActive ? ' studio-menu__link--active' : ''}`}
            >
              <span className="split-link__text">{item.label}</span>
            </NavLink>
          ))}
          <NavLink to="/dashboard" onClick={() => setMenuOpen(false)} className="studio-menu__link">
            <span className="split-link__text">Dashboard</span>
          </NavLink>
        </nav>
        <div className="studio-menu__footer">
          <span className="studio-menu__status">Monetization engine online</span>
          <div className="studio-menu__footer-actions">
            <Link className="studio-pill studio-pill--primary" to="/pricing" onClick={() => setMenuOpen(false)}>
              Upgrade
            </Link>
            <button className="studio-pill" type="button" onClick={() => setMenuOpen(false)}>
              Close
            </button>
          </div>
        </div>
      </div>
      <main className={`page ${pageClass}`}>
        <div className="adsense-wrap adsense-wrap--leaderboard" data-ads-lock="leaderboard">
          <AdSlot variant="leaderboard" />
        </div>
        <Outlet />
        <div className="adsense-wrap adsense-wrap--rectangle" data-ads-lock="rectangle">
          <AdSlot variant="rectangle" />
        </div>
      </main>
      <SiteFooter />
      <PremiumAICompanion />
    </div>
  )
}
