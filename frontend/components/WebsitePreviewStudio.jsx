import React, { useState } from 'react'
import { createWebsitePreview, startStripeCheckout } from '../src/siteApi.js'

const WEBSITE_TYPES = [
  { value: 'saas', label: 'SaaS' },
  { value: 'local_service', label: 'Local service' },
  { value: 'creator', label: 'Creator' },
  { value: 'ecommerce', label: 'Ecommerce' }
]

const STYLE_TONES = [
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'conversion', label: 'Conversion-heavy' }
]

const DEFAULT_FORM = {
  email: '',
  brief: 'A voice-first website that sells a launch sprint and shows off the product in motion.',
  audience: 'founders and small teams',
  websiteType: 'saas',
  styleTone: 'cinematic',
  primaryCta: 'Start building now'
}

export default function WebsitePreviewStudio() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [error, setError] = useState('')

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }))
  }

  async function handleGenerate(event) {
    event.preventDefault()

    try {
      setBusy(true)
      setError('')
      const response = await createWebsitePreview(form)
      setPreview(response.preview)
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handlePurchase() {
    if (!preview) {
      return
    }

    try {
      setCheckoutBusy(true)
      setError('')
      const response = await startStripeCheckout(preview.recommendedOfferSlug, {
        customerEmail: preview.email,
        previewRequestId: preview.requestId
      })
      window.location.assign(response.url)
    } catch (nextError) {
      setError(nextError.message)
      setCheckoutBusy(false)
    }
  }

  return (
    <section className="preview-studio section-card">
      <div className="preview-studio__intro">
        <span className="eyebrow">Preview studio</span>
        <h2>Generate a sellable homepage, inspect it, then buy the source pack</h2>
        <p className="section-intro">
          Enter the idea, audience, and tone. The homepage preview renders in a scrollable window so buyers can inspect the outcome before they purchase the source bundle.
        </p>
      </div>

      <div className="preview-studio__layout">
        <form className="preview-form" onSubmit={handleGenerate}>
          <label className="field">
            <span>Email for source delivery</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="field">
            <span>What should the site sell?</span>
            <textarea
              value={form.brief}
              onChange={(event) => updateField('brief', event.target.value)}
              rows={5}
              placeholder="Describe the website, offer, and what you want the first page to do."
              required
            />
          </label>
          <div className="preview-form__grid">
            <label className="field">
              <span>Website type</span>
              <select value={form.websiteType} onChange={(event) => updateField('websiteType', event.target.value)}>
                {WEBSITE_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Art direction</span>
              <select value={form.styleTone} onChange={(event) => updateField('styleTone', event.target.value)}>
                {STYLE_TONES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="preview-form__grid">
            <label className="field">
              <span>Buyer audience</span>
              <input
                type="text"
                value={form.audience}
                onChange={(event) => updateField('audience', event.target.value)}
                placeholder="founders, local service owners, creators"
              />
            </label>
            <label className="field">
              <span>Primary CTA</span>
              <input
                type="text"
                value={form.primaryCta}
                onChange={(event) => updateField('primaryCta', event.target.value)}
                placeholder="Book a demo"
              />
            </label>
          </div>

          <div className="preview-form__actions">
            <button className="button button--primary" type="submit" disabled={busy}>
              {busy ? 'Generating preview...' : 'Generate preview'}
            </button>
            <p className="field-note">
              The source pack is reserved to the email above. When checkout automation is configured, delivery can be emailed automatically from the same purchase flow.
            </p>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
        </form>

        <div className="preview-stage">
          <div className="preview-stage__header">
            <div>
              <span className="eyebrow">Inspectable output</span>
              <h3>{preview?.title ?? 'Your generated preview appears here'}</h3>
            </div>
            {preview ? <span className="tag">{preview.requestId}</span> : null}
          </div>

          <div className="preview-device">
            {preview ? (
              <iframe className="preview-device__frame" title={preview.title} srcDoc={preview.previewHtml} />
            ) : (
              <div className="preview-device__placeholder">
                <strong>Scroll-ready preview window</strong>
                <p>Generate a concept and this area becomes a live, scrollable website mockup.</p>
              </div>
            )}
          </div>

          {preview ? (
            <div className="preview-stage__footer">
              <div>
                <strong>VoiceToWebsite Builder source pack</strong>
                <p>{preview.summary}</p>
                <p className="field-note">Includes: {preview.sourceFiles.join(', ')}</p>
              </div>
              <button className="button button--primary" type="button" onClick={handlePurchase} disabled={checkoutBusy}>
                {checkoutBusy ? 'Opening checkout...' : 'Buy source pack'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
