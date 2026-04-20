import catalog from '../../content/products/catalog.json'

function normalizePaymentLink(value) {
  const link = String(value ?? '').trim()
  return /^https:\/\/buy\.stripe\.com\//i.test(link) ? link : null
}

function getCatalogProducts() {
  return Array.isArray(catalog?.products) ? catalog.products : []
}

function resolveStripePaymentLink(product, env = {}) {
  const slug = String(product?.slug ?? '')
  const suffix = slug.replace(/[^a-z0-9]+/gi, '_').toUpperCase()
  const aliases = {
    starter: ['VITE_STRIPE_STARTER_LINK'],
    'pro-starter': ['VITE_STRIPE_PRO_LINK', 'VITE_STRIPE_PRO_STARTER_LINK'],
    'enterprise-deployment': ['VITE_STRIPE_ENTERPRISE_LINK', 'VITE_STRIPE_ENTERPRISE_DEPLOYMENT_LINK']
  }

  return normalizePaymentLink(
    env[`STRIPE_PAYMENT_LINK_${suffix}`] ??
      aliases[slug]?.map((key) => env[key]).find(Boolean) ??
      product?.stripePaymentLink
  )
}

export function getOffersSnapshot(env = {}) {
  return getCatalogProducts().map((product) => {
    const paymentLink = resolveStripePaymentLink(product, env)
    return {
      slug: product.slug,
      name: product.name,
      headline: product.headline ?? product.name,
      summary: product.description ?? product.summary ?? '',
      priceAnchor: product.priceAnchor ?? 'Custom',
      idealFor: product.idealFor ?? null,
      badge: product.badge ?? null,
      category: product.category ?? 'offer',
      deliveryType: product.deliveryType ?? null,
      deliveryCopy: product.deliveryCopy ?? null,
      contactOnly: product.slug === 'enterprise-deployment' && !paymentLink,
      providers: {
        stripe: Boolean(paymentLink),
        paypal: false
      }
    }
  })
}

export function getOfferBySlug(slug, env = {}) {
  const product = getCatalogProducts().find((entry) => entry.slug === slug)
  if (!product) {
    return null
  }

  const paymentLink = resolveStripePaymentLink(product, env)

  return {
    ...product,
    stripePaymentLink: paymentLink
  }
}
