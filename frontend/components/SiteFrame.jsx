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
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink className="brand" to="/">
            <BrandWireframe size={34} />
            <span className="brand__pulse" aria-hidden="true" />
            <img className="brand__logo" src="/media/voicetowebsite-logo.jpg" alt="Voicetowebsite.com" />
            <span className="brand__wordmark sr-only">{SITE_DISPLAY_NAME}</span>
          </NavLink>

          <button
            className={`site-header__menu-toggle${menuOpen ? ' site-header__menu-toggle--open' : ''}`}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="site-primary-nav"
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span />
            <span />
          </button>

          <nav
            id="site-primary-nav"
            className={`site-nav${menuOpen ? ' site-nav--open' : ''}`}
            aria-label="Primary navigation"
          >
            {topNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `site-nav__link${isActive ? ' site-nav__link--active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="site-header__actions">
            <Link className="button button--ghost" to="/pricing">
              Pricing
            </Link>
            <Link className="button button--primary" to="/contact">
              Start project
            </Link>
          </div>
        </div>
      </header>
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
    </div>
  )
}
