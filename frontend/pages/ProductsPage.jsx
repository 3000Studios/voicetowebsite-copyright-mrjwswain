import React from 'react'
import { Link } from 'react-router-dom'
import MediaShowcase from '../components/MediaShowcase.jsx'
import PrismHeadline from '../components/PrismHeadline.jsx'
import { productCatalog } from '../src/siteData.js'
import { SITE_DISPLAY_NAME } from '../src/siteMeta.js'

function getStoreArtwork(slug) {
  const assetMap = {
    'voice-to-website-builder': '/media/store-voice-builder.svg',
    'local-leads-launchpad': '/media/store-local-leads.svg',
    'bookings-engine': '/media/store-bookings.svg',
    'creator-course-kit': '/media/store-creator-course.svg'
  }

  return assetMap[slug] ?? '/media/operator-preview.svg'
}

export default function ProductsPage() {
  const appStoreItems = productCatalog.filter((product) => product.category === 'app')
  const platformItems = productCatalog.filter((product) => product.category !== 'app')

  return (
    <div className="stack-xl page-remix">
      <section className="section-card page-remix__hero">
        <span className="eyebrow">Digital products marketplace</span>
        <PrismHeadline text={`${SITE_DISPLAY_NAME} app store`} />
        <p className="section-intro">
          Browse a fully redesigned storefront with faster product scanning, cleaner conversion layout, and stronger checkout intent across devices.
        </p>
      </section>

      <MediaShowcase media={{ title: 'Product showcase', description: 'Designed to convert from first scroll.', ...(appStoreItems[0]?.media ?? {}) }} />

      <section className="section-card page-remix__surface">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Featured apps</span>
            <h2>Source packs buyers can purchase from the store</h2>
            <p className="section-intro">
              Each app includes a demo image, a clearer price point, and a product page that can connect into checkout.
            </p>
          </div>
        </div>
        <div className="store-grid">
          {appStoreItems.map((product) => (
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
                    <h2>{product.name}</h2>
                  </div>
                  <span className="store-card__price">{product.priceAnchor}</span>
                </div>
                <p>{product.summary}</p>
                <p>{product.idealFor}</p>
                <p className="content-card__outcome">{product.outcome}</p>
                <Link className="button button--primary" to={`/products/${product.slug}`}>
                  View app
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card-grid page-remix__surface">
        {platformItems.map((product) => (
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
