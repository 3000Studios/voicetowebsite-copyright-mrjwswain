import React from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import ContactLeadForm from '../components/ContactLeadForm.jsx'
import MediaShowcase from '../components/MediaShowcase.jsx'
import MetricStrip from '../components/MetricStrip.jsx'
import NewsletterSignupForm from '../components/NewsletterSignupForm.jsx'
import OfferCheckoutCard from '../components/OfferCheckoutCard.jsx'
import PrismHeadline from '../components/PrismHeadline.jsx'
import RichBlocks from '../components/RichBlocks.jsx'
import { useSiteRuntime } from '../src/SiteRuntimeContext.jsx'
import { pageLookup } from '../src/siteData.js'
import { SITE_DISPLAY_NAME } from '../src/siteMeta.js'
import NotFoundPage from './NotFoundPage.jsx'
import AdSlot from '../components/AdSlot.jsx'
import TrustStrip from '../components/TrustStrip.jsx'

const reserved = new Set(['admin', 'blog', 'products'])

function isExternalHref(href) {
  return typeof href === 'string' && (/^(?:[a-z]+:)?\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:'))
}

export default function GenericPage() {
  const { slug } = useParams()
  const { snapshot } = useSiteRuntime()

  if (reserved.has(slug)) {
    return <Navigate to="/" replace />
  }

  const page = pageLookup[slug]

  if (!page) {
    return <NotFoundPage />
  }

  return (
    <div className={`stack-xl generic-page generic-page--${slug}`}>
      <section className="generic-page__hero">
        <span className="eyebrow">{page.eyebrow ?? SITE_DISPLAY_NAME}</span>
        <PrismHeadline text={page.headline ?? page.title ?? slug} />
        <p className="section-intro">{page.subheadline ?? page.intro ?? 'Generated from the repo content layer.'}</p>
      </section>

      {page.heroStats ? <MetricStrip items={page.heroStats} /> : null}
      
      <div className="adsense-wrap adsense-wrap--mid ads-locked" data-ads-lock="mid-generic">
        <AdSlot variant="rectangle" />
      </div>

      <MediaShowcase media={page.media} />
      {page.steps ? (
        <section className="generic-page__steps">
          <span className="eyebrow">{page.stepsEyebrow ?? 'Workflow'}</span>
          <h2>{page.stepsHeadline ?? 'How the flow works'}</h2>
          <div className="generic-page__steps-grid">
            {page.steps.map((step, index) => (
              <article key={step.title} className="generic-page__step">
                <span className="step-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {page.sections ? <RichBlocks items={page.sections} /> : null}
      {page.items ? <RichBlocks items={page.items} /> : null}
      {page.tiers ? (
        <section className="generic-page__pricing">
          <div className="section-heading section-heading--open">
            <div>
              <span className="eyebrow">Plans</span>
              <h2>Choose the path that matches how you want to buy</h2>
            </div>
          </div>
          <div className="pricing-ladder pricing-ladder--page">
          {page.tiers.map((tier) => {
            const ctaLabel = tier.ctaLabel ?? (tier.featured ? 'Buy now' : 'Choose plan')
            const ctaHref = tier.ctaHref ?? '/contact'
            const ctaClassName = `button ${tier.featured ? 'button--primary' : 'button--ghost'} pricing-card__cta`
            const ctaIsInternal = isExternalHref(ctaHref)
              ? false
              : typeof ctaHref === 'string' && ctaHref.startsWith('/') && !ctaHref.includes('#')
            return (
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
                {ctaIsInternal ? (
                  <Link className={ctaClassName} to={ctaHref}>
                    {ctaLabel}
                  </Link>
                ) : (
                  <a className={ctaClassName} href={ctaHref}>
                    {ctaLabel}
                  </a>
                )}
              </article>
            )
          })}
          </div>
        </section>
      ) : null}
      {slug === 'pricing' && snapshot?.commerce?.offers?.length ? (
        <section className="generic-page__checkout" id="checkout">
          <span className="eyebrow">Buy the product</span>
          <h2>Choose a live checkout and unlock your dashboard access</h2>
          <p className="section-intro">
            Every purchase path below saves the customer email, issues dashboard access, and routes to the real live payment link.
          </p>
          <div className="card-grid">
            {snapshot.commerce.offers.map((offer) => (
              <OfferCheckoutCard key={offer.slug} offer={offer} />
            ))}
          </div>
        </section>
      ) : null}
      {page.faq ? (
        <section className="generic-page__faq">
          <span className="eyebrow">FAQ</span>
          <h2>{page.faqHeadline ?? 'Questions buyers usually ask before they commit'}</h2>
          <div className="generic-page__faq-grid">
            {page.faq.map((entry) => (
              <article key={entry.question} className="generic-page__faq-item">
                <h3>{entry.question}</h3>
                <p>{entry.answer}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {page.cta ? (
        <section className="cta-band cta-band--open">
          <div>
            <span className="eyebrow">{page.cta.eyebrow}</span>
            <h2>{page.cta.heading}</h2>
            <p className="section-intro">{page.cta.body}</p>
          </div>
          <div className="hero__actions">
            {isExternalHref(page.cta.primaryHref) ? (
              <a className="button button--primary" href={page.cta.primaryHref}>
                {page.cta.primaryLabel}
              </a>
            ) : (
              <Link className="button button--primary" to={page.cta.primaryHref}>
                {page.cta.primaryLabel}
              </Link>
            )}
            {page.cta.secondaryHref && page.cta.secondaryLabel
              ? isExternalHref(page.cta.secondaryHref)
                ? (
                  <a className="button button--ghost" href={page.cta.secondaryHref}>
                    {page.cta.secondaryLabel}
                  </a>
                )
                : (
                  <Link className="button button--ghost" to={page.cta.secondaryHref}>
                    {page.cta.secondaryLabel}
                  </Link>
                )
              : null}
          </div>
        </section>
      ) : null}
      {slug === 'contact' ? <ContactLeadForm /> : null}
      {slug === 'newsletter' ? <NewsletterSignupForm /> : null}
      <TrustStrip />
    </div>
  )
}
