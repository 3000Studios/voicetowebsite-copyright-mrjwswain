import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import MetricStrip from '../components/MetricStrip.jsx'
import MediaShowcase from '../components/MediaShowcase.jsx'
import PrismHeadline from '../components/PrismHeadline.jsx'
import WebsitePreviewStudio from '../components/WebsitePreviewStudio.jsx'
import { fadeUp, staggerParent } from '../animations/variants.js'
import { useSiteRuntime } from '../src/SiteRuntimeContext.jsx'
import { homepage, pricingPage, productCatalog } from '../src/siteData.js'

const STORE_ARTWORK = {
  'voice-to-website-builder': '/media/store-voice-builder.svg',
  'local-leads-launchpad': '/media/store-local-leads.svg',
  'bookings-engine': '/media/store-bookings.svg',
  'creator-course-kit': '/media/store-creator-course.svg'
}

function storeArtwork(slug) {
  return STORE_ARTWORK[slug] ?? '/media/operator-preview.svg'
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount)
}

function isInternal(href) {
  return typeof href === 'string' && (href.startsWith('/') || href.startsWith('#')) && !href.startsWith('//')
}

function ActionLink({ cta, primary = false }) {
  const className = `button ${primary ? 'button--primary' : 'button--ghost'}`
  const href = cta.to ?? cta.href
  if (!href) {
    return null
  }

  if (isInternal(href) && !href.includes('#')) {
    return (
      <Link className={className} to={href}>
        {cta.label}
      </Link>
    )
  }

  return (
    <a className={className} href={href}>
      {cta.label}
    </a>
  )
}

function PricingCta({ tier }) {
  const label = tier.ctaLabel ?? (tier.featured ? 'Buy now' : 'Choose plan')
  const href = tier.ctaHref ?? '/contact'
  const className = `button ${tier.featured ? 'button--primary' : 'button--ghost'} pricing-card__cta`

  if (isInternal(href) && !href.includes('#')) {
    return (
      <Link className={className} to={href}>
        {label}
      </Link>
    )
  }

  return (
    <a className={className} href={href}>
      {label}
    </a>
  )
}

export default function HomePage() {
  const { snapshot } = useSiteRuntime()
  const appStoreItems = productCatalog.filter((product) => product.category === 'app')
  const featuredStoreItems = appStoreItems.slice(0, 4)
  const paidPlans = productCatalog.filter((product) => ['starter', 'pro-starter', 'enterprise-deployment'].includes(product.slug))
  const workflowSteps = homepage.workflowSteps ?? []
  const pricingTiers = pricingPage.tiers ?? []
  const primaryCta = homepage.primaryCta ?? { label: 'Generate preview', to: '#website-generator' }
  const secondaryCta = homepage.secondaryCta ?? { label: 'See pricing', to: '/pricing' }
  const heroPanel = homepage.heroPanel ?? null

  const liveMetrics = [
    { label: 'Previews generated', value: String(snapshot?.analytics?.previews ?? 0) },
    { label: 'Leads captured', value: String(snapshot?.analytics?.leads ?? 0) },
    { label: 'Payments closed', value: String(snapshot?.analytics?.purchases ?? 0) },
    { label: 'Revenue recorded', value: formatCurrency(snapshot?.analytics?.revenue ?? 0) }
  ]

  return (
    <div className="stack-xl home home-page">
      <motion.section
        className="hero hero--focused home-page__poster"
        variants={staggerParent}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="hero__copy home-page__poster-copy" variants={fadeUp}>
          <span className="eyebrow">{homepage.eyebrow ?? 'Voice → Website'}</span>
          <div className="home-page__logo-row">
            <img className="home-page__poster-logo" src="/media/voicetowebsite-logo.jpg" alt="Voicetowebsite.com logo" />
          </div>
          <PrismHeadline text={homepage.headline} />
          <p className="hero__lede">{homepage.subheadline}</p>
          <div className="hero__signals">
            {(homepage.operatorSignals ?? []).map((signal) => (
              <span key={signal} className="tag">
                {signal}
              </span>
            ))}
          </div>
          <div className="hero__actions">
            <ActionLink cta={primaryCta} primary />
            <ActionLink cta={secondaryCta} />
          </div>
        </motion.div>

        <motion.aside className="home-page__ops-rail" variants={fadeUp}>
          <div className="home-page__ops-screen">
          {heroPanel ? (
            <div className="hero__panel-card hero__panel-card--open">
              <div className="hero__brand-row">
                <span className="eyebrow">Live voice engine</span>
              </div>
              <h3>{heroPanel.heading}</h3>
              <p>{heroPanel.body}</p>
              <div className="hero__panel-points">
                {(heroPanel.points ?? []).map((point) => (
                  <div key={point.label} className="hero__panel-point">
                    <strong>{point.label}</strong>
                    <span>{point.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="hero__stat-grid">
            {(homepage.heroStats ?? []).slice(0, 3).map((stat) => (
              <div key={stat.label} className="hero__stat">
                <span className="eyebrow">{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
          <div className="home-page__plan-strip">
            {paidPlans.map((plan) => (
              <div key={plan.slug} className="home-page__plan-pill">
                <span>{plan.name}</span>
                <strong>{plan.priceAnchor}</strong>
              </div>
            ))}
          </div>
          <div className="hero__pulse">
            <span className="hero__pulse-dot" aria-hidden="true" />
            <div>
              <strong>Generator online</strong>
              <p>Live previews stay sandboxed so production ads and checkout paths do not get overwritten.</p>
            </div>
          </div>
          </div>
        </motion.aside>
      </motion.section>

      <MetricStrip items={liveMetrics} />

      <WebsitePreviewStudio />

      <section className="home-page__systems">
        <div className="section-heading section-heading--open">
          <div>
            <span className="eyebrow">Integrated system</span>
            <h2>Uploaded UI, live generator, paid checkout, and monitored production flow</h2>
            <p className="section-intro">
              The public website now keeps the generator, dashboard, pricing links, and production monitoring tied to the same live system.
            </p>
          </div>
        </div>
        <div className="home-page__systems-grid">
          <article className="home-page__systems-item">
            <span className="eyebrow">Generator fidelity</span>
            <h3>Prompt-specific structure</h3>
            <p>The server now uses the same prompt extraction flow as the browser preview so the generated homepage follows the real brief instead of falling back to generic filler.</p>
          </article>
          <article className="home-page__systems-item">
            <span className="eyebrow">Revenue routing</span>
            <h3>Stripe and PayPal stay wired</h3>
            <p>Starter, Pro, and Enterprise now map directly to the live checkout links and keep dashboard access tied to the customer email.</p>
          </article>
          <article className="home-page__systems-item">
            <span className="eyebrow">Studio monitoring</span>
            <h3>3000studios.VIP bridge</h3>
            <p>A monitor bridge now exposes telemetry, edit surfaces, and ads-protected selectors so the production site can be watched from outside this repo.</p>
          </article>
        </div>
      </section>

      <MediaShowcase media={homepage.media} />

      {workflowSteps.length ? (
        <section className="home-page__flow">
          <div className="section-heading section-heading--open">
            <div>
              <span className="eyebrow">How it works</span>
              <h2>{homepage.workflowHeadline ?? 'From voice to website in three moves'}</h2>
              <p className="section-intro">
                Describe the site, render the preview, and ship the source without leaving the live website.
              </p>
            </div>
          </div>
          <div className="home-page__flow-grid">
            {workflowSteps.map((step, index) => (
              <article key={step.title} className="home-page__flow-step">
                <span className="step-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {pricingTiers.length ? (
        <section className="home-page__pricing" id="pricing">
          <div className="section-heading section-heading--open">
            <div>
              <span className="eyebrow">Pricing</span>
              <h2>{pricingPage.headline ?? 'Pay only when you ship'}</h2>
              <p className="section-intro">
                {pricingPage.subheadline ?? 'Unlimited free previews. Upgrade only when you want the source.'}
              </p>
            </div>
            <Link className="button button--ghost" to="/pricing">
              Full pricing page
            </Link>
          </div>
          <div className="home-page__pricing-grid">
            {pricingTiers.slice(0, 3).map((tier) => (
              <article key={tier.name} className="home-page__pricing-line">
                <div>
                  <span className="eyebrow">{tier.name}</span>
                  <h3>{tier.price}</h3>
                  <p>{tier.description}</p>
                </div>
                <PricingCta tier={tier} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {featuredStoreItems.length ? (
        <section className="home-page__gallery">
          <div className="section-heading section-heading--open">
            <div>
              <span className="eyebrow">Ready-made builds</span>
              <h2>Source packs you can buy and ship today</h2>
              <p className="section-intro">
                Curated website templates with checkout-ready copy, SEO defaults, and a clear primary offer for
                each vertical.
              </p>
            </div>
            <Link className="button button--ghost" to="/products">
              View all products
            </Link>
          </div>
          <div className="home-page__gallery-grid">
            {featuredStoreItems.map((product) => (
              <article key={product.slug} className="home-page__gallery-item">
                <div className="home-page__gallery-media">
                  <img
                    src={storeArtwork(product.slug)}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="home-page__gallery-copy">
                  <div className="store-card__head">
                    <div>
                      <span className="meta-line">{product.badge ?? 'App'}</span>
                      <h3>{product.name}</h3>
                    </div>
                    <span className="store-card__price">{product.priceAnchor}</span>
                  </div>
                  <p>{product.summary}</p>
                  <div className="hero__actions">
                    <Link
                      className="button button--primary"
                      to={product.ctaHref ?? `/products/${product.slug}`}
                    >
                      {product.ctaLabel ?? 'View app'}
                    </Link>
                    <Link className="button button--ghost" to={`/products/${product.slug}`}>
                      Details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {homepage.faq?.length ? (
        <section className="home-page__faq">
          <span className="eyebrow">FAQ</span>
          <h2>{homepage.faqHeadline ?? 'Questions buyers ask first'}</h2>
          <div className="home-page__faq-grid">
            {homepage.faq.map((item) => (
              <article key={item.question} className="home-page__faq-item">
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {homepage.finalCta ? (
        <section className="cta-band cta-band--open">
          <div>
            <span className="eyebrow">{homepage.finalCta.eyebrow}</span>
            <h2>{homepage.finalCta.heading}</h2>
            <p className="section-intro">{homepage.finalCta.body}</p>
          </div>
          <div className="hero__actions">
            <a className="button button--primary" href="#website-generator">
              {homepage.finalCta.primaryLabel ?? 'Open the generator'}
            </a>
            <Link className="button button--ghost" to={homepage.finalCta.secondaryHref ?? '/contact'}>
              {homepage.finalCta.secondaryLabel ?? 'Talk to sales'}
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  )
}
