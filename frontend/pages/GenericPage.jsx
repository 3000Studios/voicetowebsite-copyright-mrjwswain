import React from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import ContactLeadForm from '../components/ContactLeadForm.jsx'
import MetricStrip from '../components/MetricStrip.jsx'
import OfferCheckoutCard from '../components/OfferCheckoutCard.jsx'
import PrismHeadline from '../components/PrismHeadline.jsx'
import RichBlocks from '../components/RichBlocks.jsx'
import { useSiteRuntime } from '../src/SiteRuntimeContext.jsx'
import { pageLookup } from '../src/siteData.js'
import { SITE_DISPLAY_NAME } from '../src/siteMeta.js'
import NotFoundPage from './NotFoundPage.jsx'

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
    <div className="stack-xl">
      <section className="section-card">
        <span className="eyebrow">{page.eyebrow ?? SITE_DISPLAY_NAME}</span>
        <PrismHeadline text={page.headline ?? page.title ?? slug} />
        <p className="section-intro">{page.subheadline ?? page.intro ?? 'Generated from the repo content layer.'}</p>
      </section>

      {page.heroStats ? <MetricStrip items={page.heroStats} /> : null}
      {page.steps ? (
        <section className="section-card">
          <span className="eyebrow">{page.stepsEyebrow ?? 'Workflow'}</span>
          <h2>{page.stepsHeadline ?? 'How the flow works'}</h2>
          <div className="card-grid card-grid--compact">
            {page.steps.map((step, index) => (
              <article key={step.title} className="content-card content-card--step">
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
        <section className="card-grid">
          {page.tiers.map((tier) => (
            <article key={tier.name} className={`content-card pricing-card${tier.featured ? ' pricing-card--featured' : ''}`}>
              <span className="meta-line">{tier.price}</span>
              <h2>{tier.name}</h2>
              <p>{tier.description}</p>
              <ul className="bullet-list">
                {tier.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      ) : null}
      {slug === 'pricing' && snapshot?.commerce?.offers?.length ? (
        <section className="section-card">
          <span className="eyebrow">Checkout</span>
          <h2>Accept live payments from the offers page</h2>
          <div className="card-grid">
            {snapshot.commerce.offers.map((offer) => (
              <OfferCheckoutCard key={offer.slug} offer={offer} />
            ))}
          </div>
        </section>
      ) : null}
      {page.faq ? (
        <section className="section-card">
          <span className="eyebrow">FAQ</span>
          <h2>{page.faqHeadline ?? 'Questions buyers usually ask before they commit'}</h2>
          <div className="card-grid card-grid--compact">
            {page.faq.map((entry) => (
              <article key={entry.question} className="content-card">
                <h3>{entry.question}</h3>
                <p>{entry.answer}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {page.cta ? (
        <section className="section-card cta-band">
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
    </div>
  )
}
