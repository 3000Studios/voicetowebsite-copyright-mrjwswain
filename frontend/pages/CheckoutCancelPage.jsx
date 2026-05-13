import React from 'react'
import { Link } from 'react-router-dom'

export default function CheckoutCancelPage() {
  return (
    <div className="stack-xl">
      <section className="section-card centered-card">
        <span className="eyebrow">Checkout</span>
        <h1>Checkout canceled</h1>
        <p className="section-intro">
          No payment was captured. You can review the offer again, compare plans, or talk through fit before restarting checkout.
        </p>
        <div className="hero__actions">
          <Link className="button button--primary" to="/pricing">
            Review pricing
          </Link>
          <Link className="button button--ghost" to="/contact">
            Ask a question
          </Link>
        </div>
      </section>
    </div>
  )
}
