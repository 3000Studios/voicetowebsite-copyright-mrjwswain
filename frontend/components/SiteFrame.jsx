import React from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import PrismEnvironment from './PrismEnvironment.jsx'
import { publicNavItems, publicStatusLines, publicTickerItems } from '../src/siteChrome.js'
import { REPOSITORY_URL, SITE_DISPLAY_NAME, SITE_URL, getCopyrightLine } from '../src/siteMeta.js'
import { trackSiteEvent } from '../src/siteApi.js'
import AdSlot from './AdSlot.jsx'

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
      <PrismEnvironment navItems={[]} statusLines={publicStatusLines} tickerItems={publicTickerItems} />
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink className="brand" to="/">
            <span className="brand__pulse" />
            <span className="brand__wordmark">{SITE_DISPLAY_NAME}</span>
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
      <main className="page">
        <div className="adsense-wrap adsense-wrap--leaderboard">
          <AdSlot variant="leaderboard" />
        </div>
        <Outlet />
        <div className="adsense-wrap adsense-wrap--rectangle">
          <AdSlot variant="rectangle" />
        </div>
      </main>
      <footer className="site-footer">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <span className="eyebrow">{SITE_DISPLAY_NAME}</span>
            <h2>Ship marketing sites from voice and text without losing structure or speed.</h2>
            <p>
              {SITE_DISPLAY_NAME} turns spoken or written briefs into structured pages, SEO content, and deployments
              so your team can iterate from idea to live site in one pipeline.
            </p>
          </div>
          <div className="site-footer__links">
            {publicNavItems
              .filter((item) => item.to !== '/admin')
              .map((item) => (
                <Link key={item.to} to={item.to}>
                  {item.label}
                </Link>
              ))}
          </div>
          <div className="site-footer__cta">
            <span className="eyebrow">Best next step</span>
            <p>Start with the strategy pages, then move into pricing and implementation offers.</p>
            <div className="hero__actions">
              <Link className="button button--primary" to="/pricing">
                View pricing
              </Link>
              <Link className="button button--ghost" to="/contact">
                Book a build path
              </Link>
            </div>
          </div>
        </div>
        <p className="site-footer__legal">
          <a href={SITE_URL} rel="noopener noreferrer">
            {SITE_URL.replace(/^https:\/\//, '')}
          </a>
          <span aria-hidden="true"> · </span>
          <span>{getCopyrightLine()}</span>
          <span aria-hidden="true"> · </span>
          <a href={REPOSITORY_URL} rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </footer>
    </div>
  )
}
