import React from 'react'
import { Link } from 'react-router-dom'
import PrismHeadline from '../components/PrismHeadline.jsx'
import { productCatalog } from '../src/siteData.js'
import { SITE_DISPLAY_NAME } from '../src/siteMeta.js'

export default function ProductsPage() {
  return (
    <div className="stack-xl">
      <section className="section-card">
        <span className="eyebrow">Productized revenue</span>
        <PrismHeadline text={`Ways to buy ${SITE_DISPLAY_NAME}`} />
        <p className="section-intro">
          The strongest business model here is a mix of recurring software, implementation revenue, and
          enterprise deployment.
        </p>
      </section>

      <section className="card-grid">
        {productCatalog.map((product) => (
          <article key={product.slug} className="content-card">
            <span className="meta-line">{product.priceAnchor}</span>
            <h2>{product.name}</h2>
            <p>{product.summary}</p>
            <p>{product.idealFor}</p>
            <p className="content-card__outcome">{product.outcome}</p>
            <Link className="button button--ghost" to={`/products/${product.slug}`}>
              View details
            </Link>
          </article>
        ))}
      </section>
    </div>
  )
}
