import React from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import PrismEnvironment from './PrismEnvironment.jsx'
import { publicNavItems, publicStatusLines, publicTickerItems } from '../src/siteChrome.js'
import { REPOSITORY_URL, SITE_DISPLAY_NAME, SITE_URL, getCopyrightLine } from '../src/siteMeta.js'
import { trackSiteEvent } from '../src/siteApi.js'

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

  const nextId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  window.localStorage.setItem(VISITOR_SESSION_KEY, nextId)
  return nextId
}

export default function SiteFrame() {
  const location = useLocation()

  React.useEffect(() => {
    trackSiteEvent({
      type: 'page_view',
      path: `${location.pathname}${location.search}`,
      sessionId: getSessionId(),
      referrer: document.referrer
    }).catch(() => {})
  }, [location.pathname, location.search])

  return (
    <div className="shell">
      <PrismEnvironment navItems={publicNavItems} statusLines={publicStatusLines} tickerItems={publicTickerItems} />
      <header className="topbar">
        <NavLink className="brand" to="/">
          <span className="brand__pulse" />
          <span className="brand__wordmark">{SITE_DISPLAY_NAME}</span>
        </NavLink>
        <div className="topbar__status">
          <span className="topbar__status-line">Voice to live site</span>
          <span className="topbar__status-line">From spoken brief to published pages</span>
        </div>
      </header>
      <main className="page">
        <Outlet />
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
