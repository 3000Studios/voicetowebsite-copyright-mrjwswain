import React from 'react'
import { Link } from 'react-router-dom'
import { publicNavItems } from '../src/siteChrome.js'
import { REPOSITORY_URL, SITE_DISPLAY_NAME, SITE_URL, getCopyrightLine } from '../src/siteMeta.js'

export default function SiteFooter() {
  return (
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
  )
}
