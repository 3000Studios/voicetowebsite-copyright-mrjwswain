import React from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import OfferCheckoutCard from '../components/OfferCheckoutCard.jsx'
import PrismHeadline from '../components/PrismHeadline.jsx'
import RichBlocks from '../components/RichBlocks.jsx'
import { useSiteRuntime } from '../src/SiteRuntimeContext.jsx'
import { productLookup } from '../src/siteData.js'

export default function ProductPage() {
  const { slug } = useParams()
  const product = productLookup[slug]
  const { snapshot } = useSiteRuntime()
  const liveOffer = snapshot?.commerce?.offers?.find((offer) => offer.slug === slug) ?? null

  if (!product) {
    return <Navigate to="/products" replace />
  }

  return (
    <div className="stack-xl">
      <section className="section-card">
        <span className="eyebrow">{product.eyebrow ?? 'Offer'}</span>
        <PrismHeadline text={product.headline ?? product.name} />
        <p className="section-intro">{product.description ?? product.summary}</p>
        <div className="tag-row">
          <span className="tag">{product.priceAnchor}</span>
          {product.idealFor ? <span className="tag">{product.idealFor}</span> : null}
        </div>
      </section>

      {product.bullets ? (
        <section className="section-card">
          <h2>What it unlocks</h2>
          <ul className="bullet-list">
            {product.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {product.sections ? <RichBlocks title="Included in the offer" items={product.sections} /> : null}
      {liveOffer ? <OfferCheckoutCard offer={liveOffer} /> : null}
      {product.cta ? (
        <section className="section-card cta-band">
          <div>
            <span className="eyebrow">{product.cta.eyebrow}</span>
            <h2>{product.cta.heading}</h2>
            <p className="section-intro">{product.cta.body}</p>
          </div>
          <div className="hero__actions">
            <Link className="button button--primary" to={product.cta.primaryHref}>
              {product.cta.primaryLabel}
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  )
}
