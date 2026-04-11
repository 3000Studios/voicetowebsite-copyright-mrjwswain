import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { startPayPalCheckout, startStripeCheckout } from '../src/siteApi.js'

export default function OfferCheckoutCard({ offer }) {
  const [busyProvider, setBusyProvider] = useState('')
  const [error, setError] = useState('')

  async function beginCheckout(provider) {
    try {
      setBusyProvider(provider)
      setError('')
      const response =
        provider === 'stripe'
          ? await startStripeCheckout(offer.slug)
          : await startPayPalCheckout(offer.slug)

      window.location.assign(response.url)
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBusyProvider('')
    }
  }

  return (
    <article className={`content-card pricing-card${offer.providers.stripe ? ' pricing-card--featured' : ''}`}>
      <span className="meta-line">{offer.priceAnchor}</span>
      <h3>{offer.name}</h3>
      <p>{offer.summary}</p>
      {offer.idealFor ? <p className="content-card__outcome">{offer.idealFor}</p> : null}
      <div className="checkout-actions">
        {offer.providers.stripe ? (
          <button className="button button--primary" type="button" onClick={() => beginCheckout('stripe')} disabled={busyProvider !== ''}>
            {busyProvider === 'stripe' ? 'Opening Stripe...' : 'Pay with Stripe'}
          </button>
        ) : null}
        {offer.providers.paypal ? (
          <button className="button button--ghost" type="button" onClick={() => beginCheckout('paypal')} disabled={busyProvider !== ''}>
            {busyProvider === 'paypal' ? 'Opening PayPal...' : 'Pay with PayPal'}
          </button>
        ) : null}
        {offer.contactOnly ? (
          <Link className="button button--ghost" to="/contact">
            Contact for rollout
          </Link>
        ) : null}
      </div>
      {!offer.providers.stripe && !offer.providers.paypal && !offer.contactOnly ? (
        <p className="field-note">Live checkout appears here automatically when the corresponding Stripe or PayPal env vars are configured.</p>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
    </article>
  )
}
