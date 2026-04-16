import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import MetricStrip from '../components/MetricStrip.jsx'
import MediaShowcase from '../components/MediaShowcase.jsx'
import NewsletterSignupForm from '../components/NewsletterSignupForm.jsx'
import OfferCheckoutCard from '../components/OfferCheckoutCard.jsx'
import PrismHeadline from '../components/PrismHeadline.jsx'
import RichBlocks from '../components/RichBlocks.jsx'
import WebsitePreviewStudio from '../components/WebsitePreviewStudio.jsx'
import { fadeUp, staggerParent } from '../animations/variants.js'
import { useSiteRuntime } from '../src/SiteRuntimeContext.jsx'
import { featurePage, homepage, pricingPage, productCatalog } from '../src/siteData.js'

function getStoreArtwork(slug) {
  const assetMap = {
    'voice-to-website-builder': '/media/store-voice-builder.svg',
    'local-leads-launchpad': '/media/store-local-leads.svg',
    'bookings-engine': '/media/store-bookings.svg',
    'creator-course-kit': '/media/store-creator-course.svg'
  }

  return assetMap[slug] ?? '/media/operator-preview.svg'
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount)
}

export default function HomePage() {
  const { snapshot } = useSiteRuntime()
  const appStoreItems = productCatalog.filter((product) => product.category === 'app')
  const featuredStoreItems = appStoreItems.slice(0, 4)
  const spotlightOffers = pricingPage.tiers.slice(0, 3)
  const liveMetrics = [
    { label: 'Visitors tracked', value: String(snapshot?.analytics?.visitors ?? 0) },
    { label: 'Leads captured', value: String(snapshot?.analytics?.leads ?? 0) },
    { label: 'Payments closed', value: String(snapshot?.analytics?.purchases ?? 0) },
    { label: 'Revenue recorded', value: formatCurrency(snapshot?.analytics?.revenue ?? 0) }
  ]

  return (
    <div className="stack-xl home-remix">
      <motion.section className="hero hero--remix" variants={staggerParent} initial="hidden" animate="visible">
        <motion.div className="hero__copy" variants={fadeUp}>
          <span className="eyebrow">Award-style digital experience</span>
          <PrismHeadline text={homepage.headline} />
          <p>{homepage.subheadline}</p>
          <div className="home-remix__signal-grid">
            {homepage.operatorSignals.map((signal) => (
              <span key={signal} className="tag">
                {signal}
              </span>
            ))}
          </div>
          <div className="hero__actions">
            <Link className="button button--primary" to={homepage.primaryCta.to}>
              {homepage.primaryCta.label}
            </Link>
            <Link className="button button--ghost" to={homepage.secondaryCta.to}>
              {homepage.secondaryCta.label}
            </Link>
          </div>
        </motion.div>
        <motion.aside className="hero__panel hero__panel--media" variants={fadeUp}>
          <MediaShowcase
            compact
            media={{
              ...(homepage.media ?? {}),
              badges: homepage.media?.badges ?? homepage.operatorSignals
            }}
          />
          <div className="home-remix__float-panel">
            {homepage.heroPanel.points.map((point) => (
              <div key={point.label} className="commit-row">
                <strong>{point.label}</strong>
                <span>{point.value}</span>
              </div>
            ))}
          </div>
        </motion.aside>
      </motion.section>

      <MetricStrip items={liveMetrics} />

      <section className="section-card home-remix__workflow">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Launch flow</span>
            <h2>{homepage.workflowHeadline}</h2>
            <p className="section-intro">
              Completely redesigned flow: strategy-first messaging, motion-rich visuals, conversion checkpoints, and checkout-ready execution.
            </p>
          </div>
        </div>
        <div className="home-remix__timeline">
          {homepage.workflowSteps.map((step, index) => (
            <article key={step.title} className="content-card home-remix__timeline-card">
              <span className="step-number">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <WebsitePreviewStudio />

      <section className="section-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Featured builds</span>
            <h2>New product-first visual marketplace</h2>
            <p className="section-intro">
              A cleaner storefront with faster scanning, better hover behavior, and stronger path-to-checkout layout for mobile and desktop.
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
                  src={getStoreArtwork(product.slug)}
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
                <p className="content-card__outcome">{product.outcome}</p>
                <div className="hero__actions">
                  <Link className="button button--primary" to={product.ctaHref ?? `/products/${product.slug}`}>
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

      <section className="section-card home-remix__pricing-highlight">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Monetization stack</span>
            <h2>Revenue architecture redesigned</h2>
            <p className="section-intro">
              Tiered offer path with immediate CTA entry points and stronger conversion framing.
            </p>
          </div>
          <Link className="button button--ghost" to="/pricing">
            Open full pricing
          </Link>
        </div>
        <div className="card-grid">
          {spotlightOffers.map((tier) => (
            <article key={tier.name} className={`content-card pricing-card${tier.featured ? ' pricing-card--featured' : ''}`}>
              <span className="meta-line">{tier.price}</span>
              <h3>{tier.name}</h3>
              <p>{tier.description}</p>
              <ul className="bullet-list">
                {tier.features.slice(0, 4).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <RichBlocks title={featurePage.headline} intro={featurePage.intro} items={featurePage.items} />
      <RichBlocks title="Who it is built for" intro={homepage.audienceIntro} items={homepage.audiences} />

      {snapshot?.commerce?.offers?.length ? (
        <section className="section-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Live checkout</span>
              <h2>Direct buy experience</h2>
              <p className="section-intro">
                Every offer card is optimized for immediate checkout and tracks real conversion data from your active integrations.
              </p>
            </div>
          </div>
          <div className="card-grid">
            {snapshot.commerce.offers.filter((offer) => offer.slug !== 'enterprise-deployment').map((offer) => (
              <OfferCheckoutCard key={offer.slug} offer={offer} />
            ))}
          </div>
        </section>
      ) : null}

      <NewsletterSignupForm />

      <section className="section-card">
        <span className="eyebrow">Frequently asked</span>
        <h2>{homepage.faqHeadline}</h2>
        <div className="card-grid card-grid--compact">
          {homepage.faq.map((item) => (
            <article key={item.question} className="content-card">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card cta-band">
        <div>
          <span className="eyebrow">{homepage.finalCta.eyebrow}</span>
          <h2>{homepage.finalCta.heading}</h2>
          <p className="section-intro">{homepage.finalCta.body}</p>
        </div>
        <div className="hero__actions">
          <Link className="button button--primary" to={homepage.finalCta.primaryHref}>
            {homepage.finalCta.primaryLabel}
          </Link>
          <Link className="button button--ghost" to={homepage.finalCta.secondaryHref}>
            {homepage.finalCta.secondaryLabel}
          </Link>
        </div>
      </section>
    </div>
  )
}
