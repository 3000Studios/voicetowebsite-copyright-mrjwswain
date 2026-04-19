import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import MetricStrip from '../components/MetricStrip.jsx'
import OfferCheckoutCard from '../components/OfferCheckoutCard.jsx'
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
  const workflowSteps = homepage.workflowSteps ?? []
  const pricingTiers = pricingPage.tiers ?? []
  const primaryCta = homepage.primaryCta ?? { label: 'Generate preview', to: '#website-generator' }
  const secondaryCta = homepage.secondaryCta ?? { label: 'See pricing', to: '/pricing' }
  const heroPanel = homepage.heroPanel ?? null

  const liveMetrics = [
    { label: 'Visitors tracked', value: String(snapshot?.analytics?.visitors ?? 0) },
    { label: 'Leads captured', value: String(snapshot?.analytics?.leads ?? 0) },
    { label: 'Payments closed', value: String(snapshot?.analytics?.purchases ?? 0) },
    { label: 'Revenue recorded', value: formatCurrency(snapshot?.analytics?.revenue ?? 0) }
  ]

  return (
    <div className="stack-xl home">
      <motion.section
        className="hero hero--focused"
        variants={staggerParent}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="hero__copy" variants={fadeUp}>
          <span className="eyebrow">{homepage.eyebrow ?? 'Voice → Website'}</span>
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

        <motion.aside className="hero__panel hero__panel--stats" variants={fadeUp}>
          {heroPanel ? (
            <div className="hero__panel-card">
              <div className="hero__brand-row">
                <img
                  className="hero__brand-logo"
                  src="/media/voicetowebsite-logo.jpg"
                  alt="Voicetowebsite.com logo"
                />
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
          <div className="hero__pulse">
            <span className="hero__pulse-dot" aria-hidden="true" />
            <div>
              <strong>Generator online</strong>
              <p>Runs in your browser. No sign-up required.</p>
            </div>
          </div>
        </motion.aside>
      </motion.section>

      <MetricStrip items={liveMetrics} />

      <WebsitePreviewStudio />

      {workflowSteps.length ? (
        <section className="section-card home__workflow">
          <div className="section-heading">
            <div>
              <span className="eyebrow">How it works</span>
              <h2>{homepage.workflowHeadline ?? 'From voice to website in three moves'}</h2>
              <p className="section-intro">
                Describe the site, render the preview, and ship the source. The whole loop is designed to keep
                you one click away from a real artifact.
              </p>
            </div>
          </div>
          <div className="home__workflow-grid">
            {workflowSteps.map((step, index) => (
              <article key={step.title} className="content-card home__workflow-card">
                <span className="step-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {pricingTiers.length ? (
        <section className="section-card home__pricing" id="pricing">
          <div className="section-heading">
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
          <div className="pricing-ladder">
            {pricingTiers.map((tier) => (
              <article
                key={tier.name}
                className={`pricing-card${tier.featured ? ' pricing-card--featured' : ''}`}
              >
                {tier.featured ? <span className="pricing-card__badge">Most popular</span> : null}
                <header className="pricing-card__head">
                  <span className="eyebrow">{tier.name}</span>
                  <div className="pricing-card__price">
                    <strong>{tier.price}</strong>
                    {tier.priceDetail ? <span>{tier.priceDetail}</span> : null}
                  </div>
                  <p>{tier.description}</p>
                </header>
                <ul className="bullet-list pricing-card__features">
                  {(tier.features ?? []).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <PricingCta tier={tier} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {featuredStoreItems.length ? (
        <section className="section-card">
          <div className="section-heading">
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
          <div className="store-grid">
            {featuredStoreItems.map((product) => (
              <article key={product.slug} className="store-card">
                <div className="store-card__media">
                  <img
                    src={storeArtwork(product.slug)}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="store-card__body">
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

      {snapshot?.commerce?.offers?.length ? (
        <section className="section-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Live checkout</span>
              <h2>Direct buy from the homepage</h2>
              <p className="section-intro">
                Every offer card is tied to a real Stripe or PayPal flow. Conversions record back to the admin
                dashboard automatically.
              </p>
            </div>
          </div>
          <div className="card-grid">
            {snapshot.commerce.offers
              .filter((offer) => offer.slug !== 'enterprise-deployment')
              .map((offer) => (
                <OfferCheckoutCard key={offer.slug} offer={offer} />
              ))}
          </div>
        </section>
      ) : null}

      {homepage.faq?.length ? (
        <section className="section-card">
          <span className="eyebrow">FAQ</span>
          <h2>{homepage.faqHeadline ?? 'Questions buyers ask first'}</h2>
          <div className="card-grid card-grid--compact">
            {homepage.faq.map((item) => (
              <article key={item.question} className="content-card">
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {homepage.finalCta ? (
        <section className="section-card cta-band">
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
