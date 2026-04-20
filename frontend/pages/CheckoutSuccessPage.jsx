import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { capturePayPalCheckout, verifyStripeCheckout } from '../src/siteApi.js'
import { readCustomerSession } from '../src/customerSession.js'
import { useSiteRuntime } from '../src/SiteRuntimeContext.jsx'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams()
  const { refresh } = useSiteRuntime()
  const savedSession = readCustomerSession()
  const [state, setState] = useState({
    loading: true,
    error: '',
    amountCents: 0,
    offerSlug: '',
    dashboardUrl: savedSession?.dashboardUrl ?? '/dashboard'
  })

  useEffect(() => {
    async function confirm() {
      try {
        const provider = searchParams.get('provider')
        const sessionId = searchParams.get('session_id')
        const token = searchParams.get('token')
        const result =
          provider === 'paypal' && token
            ? await capturePayPalCheckout(token)
            : await verifyStripeCheckout(sessionId ?? '')

        setState({
          loading: false,
          error: result.completed ? '' : 'Payment is not marked complete yet.',
          amountCents: result.amountCents ?? 0,
          offerSlug: result.offerSlug ?? '',
          dashboardUrl: savedSession?.dashboardUrl ?? '/dashboard'
        })
        await refresh()
      } catch (error) {
        setState({
          loading: false,
          error: error.message,
          amountCents: 0,
          offerSlug: '',
          dashboardUrl: savedSession?.dashboardUrl ?? '/dashboard'
        })
      }
    }

    confirm()
  }, [refresh, savedSession?.dashboardUrl, searchParams])

  return (
    <div className="stack-xl page-remix">
      <section className="section-card centered-card page-remix__hero">
        <span className="eyebrow">Checkout</span>
        <h1>{state.loading ? 'Confirming payment...' : state.error ? 'Checkout needs attention' : 'Payment received'}</h1>
        {state.error ? (
          <p className="section-intro">{state.error}</p>
        ) : (
          <p className="section-intro">
            {state.amountCents > 0 ? `${formatCurrency(state.amountCents / 100)} recorded for ${state.offerSlug || 'your offer'}.` : 'Your payment has been recorded.'}
          </p>
        )}
        <div className="hero__actions">
          <Link className="button button--primary" to={state.dashboardUrl}>
            Open dashboard
          </Link>
          <Link className="button button--ghost" to="/products">
            View offers
          </Link>
        </div>
      </section>
    </div>
  )
}
