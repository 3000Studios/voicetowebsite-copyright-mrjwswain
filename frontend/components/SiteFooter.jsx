import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { publicNavItems } from '../src/siteChrome.js'
import { REPOSITORY_URL, SITE_DISPLAY_NAME, SITE_URL, getCopyrightLine } from '../src/siteMeta.js'
import SecretAdminGateModal from './admin/SecretAdminGateModal.jsx'

export default function SiteFooter() {
  const navItems = publicNavItems.filter((item) => item.to !== '/admin')
  const [secretOpen, setSecretOpen] = useState(false)

  return (
    <footer className="site-footer site-footer--premium">
      <div className="site-footer__premium-grid">
        <section className="site-footer__premium-brand">
          <div className="site-footer__premium-logo">
            <img className="site-footer__logo" src="/media/voicetowebsite-logo.jpg" alt={SITE_DISPLAY_NAME} />
          </div>
          <h2>
            Speak.
            <br />
            Launch.
            <span> Convert.</span>
          </h2>
          <p>
            {SITE_DISPLAY_NAME} turns voice or typed intent into prompt-faithful websites, live revenue paths,
            protected ad inventory, and production-ready deployment.
          </p>
          <a className="site-footer__premium-mail" href="mailto:support@voicetowebsite.com">
            support@voicetowebsite.com
          </a>
        </section>

        <section className="site-footer__premium-column">
          <span className="eyebrow">Navigation</span>
          <div className="site-footer__premium-links">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="site-footer__premium-column">
          <span className="eyebrow">Protocol</span>
          <div className="site-footer__premium-links">
            <Link to="/pricing">Pricing</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/contact">Contact</Link>
            <a href={REPOSITORY_URL} rel="noreferrer">
              GitHub
            </a>
          </div>
        </section>

        <section className="site-footer__premium-column">
          <span className="eyebrow">Production</span>
          <div className="site-footer__premium-status">
            <div>
              <strong>Domain</strong>
              <span>{SITE_URL.replace(/^https:\/\//, '')}</span>
            </div>
            <div>
              <strong>AdSense</strong>
              <span>Root ads.txt active</span>
            </div>
            <div>
              <strong>Bridge</strong>
              <span>3000studios.VIP monitor linked</span>
            </div>
          </div>
        </section>
      </div>

      <div className="site-footer__premium-legal">
        <span>{getCopyrightLine()}</span>
        <span aria-hidden="true">·</span>
        <a href={SITE_URL} rel="noreferrer">
          {SITE_URL.replace(/^https:\/\//, '')}
        </a>
        <button
          type="button"
          className="site-footer__secret"
          aria-label="Admin login"
          onClick={() => setSecretOpen(true)}
        >
          ©
        </button>
      </div>

      <SecretAdminGateModal open={secretOpen} onClose={() => setSecretOpen(false)} />
    </footer>
  )
}
