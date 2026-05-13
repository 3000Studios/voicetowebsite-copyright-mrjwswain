import React from 'react'
import { Link } from 'react-router-dom'
import PrismHeadline from '../components/PrismHeadline.jsx'

export default function NotFoundPage() {
  return (
    <div className="section-card centered-card">
      <span className="eyebrow">404</span>
      <PrismHeadline text="That page is not in the current growth path." />
      <p className="section-intro">Head back to the homepage, pricing, or contact page and keep the funnel moving.</p>
      <Link className="button button--primary" to="/">
        Return home
      </Link>
    </div>
  )
}
