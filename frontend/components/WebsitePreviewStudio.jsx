import React, { useRef, useState } from 'react'
import { generatePreview } from '../src/previewEngine.js'
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

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim())
}

export default function WebsitePreviewStudio() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [error, setError] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [voiceBusy, setVoiceBusy] = useState(false)
  const [generationCount, setGenerationCount] = useState(0)
  const audioContextRef = useRef(null)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function playUiTone(kind = 'success') {
    if (!soundEnabled || typeof window === 'undefined') {
      return
    }

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextCtor) {
      return
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor()
    }

    const context = audioContextRef.current
    if (context.state === 'suspended') {
      context.resume().catch(() => {})
    }

    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const frequency = kind === 'success' ? 560 : 220

    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.value = 0.0001
    oscillator.connect(gain)
    gain.connect(context.destination)
    const now = context.currentTime
    gain.gain.exponentialRampToValueAtTime(0.03, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14)
    oscillator.start(now)
    oscillator.stop(now + 0.16)
  }

  async function generateViaServer(payload) {
    const response = await createWebsitePreview(payload)
    if (!response?.preview?.previewHtml) {
      throw new Error('Generator response was incomplete.')
    }
    return response.preview
  }

  function handleGenerate(event) {
    event.preventDefault()
    setError('')

    const email = form.email.trim()
    const brief = form.brief.trim()

    if (!isValidEmail(email)) {
      setError('Enter a valid email so we can reserve the source pack for your build.')
      playUiTone('error')
      return
    }
    if (brief.length < 20) {
      setError('Describe the website in at least 20 characters so the engine has something to render.')
      playUiTone('error')
      return
    }

    setBusy(true)
    const payload = { ...form, email, brief }
    const clientPreview = generatePreview(payload)
    setPreview(clientPreview)

    generateViaServer(payload)
      .then((serverPreview) => {
        setPreview({ ...clientPreview, ...serverPreview, serverRecorded: true })
        setGenerationCount((n) => n + 1)
        playUiTone('success')
      })
      .catch((nextError) => {
        setError(nextError?.message ?? 'The generator could not build a preview.')
        playUiTone('error')
      })
      .finally(() => {
        setBusy(false)
      })
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
      if (response?.url) {
        window.location.assign(response.url)
      } else {
        throw new Error('Checkout URL is not available yet. Try again in a moment.')
      }
    } catch (nextError) {
      setError(nextError.message)
      setCheckoutBusy(false)
    }
  }

  function handleVoicePrompt() {
    if (typeof window === 'undefined') {
      return
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      setError('Voice input is not available in this browser.')
      return
    }

    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setVoiceBusy(true)
    setError('')
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim()
      if (transcript) {
        updateField('brief', transcript)
      }
      setVoiceBusy(false)
      playUiTone('success')
    }
    recognition.onerror = () => {
      setVoiceBusy(false)
      setError('Voice capture failed. Please try again or type your website request.')
      playUiTone('error')
    }
    recognition.onend = () => {
      setVoiceBusy(false)
    }
    recognition.start()
  }

  return (
    <section className="preview-studio section-card" id="website-generator">
      <div className="preview-studio__intro">
        <span className="eyebrow">Live website generator</span>
        <h2>Describe the site, see the preview, then buy the source pack</h2>
        <p className="section-intro">
          A draft appears instantly in the browser, then the saved preview updates from the live generator with
          prompt-matched structure and media. Fill in the brief, generate, and inspect the full homepage before checkout.
        </p>
        <div className="preview-studio__toolbar">
          <label className="preview-sound-toggle">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(event) => setSoundEnabled(event.target.checked)}
            />
            <span>{soundEnabled ? 'Sound on' : 'Sound muted'}</span>
          </label>
          {generationCount > 0 ? (
            <span className="tag">Builds this session: {generationCount}</span>
          ) : null}
        </div>
      </div>

      <div className="preview-studio__layout">
        <form className="preview-form" onSubmit={handleGenerate} noValidate>
          <label className="field">
            <span>Email for source delivery</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
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
            <div className="hero__actions">
              <button className="button button--ghost" type="button" onClick={handleVoicePrompt} disabled={voiceBusy}>
                {voiceBusy ? 'Listening...' : 'Speak your website idea'}
              </button>
            </div>
          </label>
          <div className="preview-form__grid">
            <label className="field">
              <span>Website type</span>
              <select
                value={form.websiteType}
                onChange={(event) => updateField('websiteType', event.target.value)}
              >
                {WEBSITE_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Art direction</span>
              <select
                value={form.styleTone}
                onChange={(event) => updateField('styleTone', event.target.value)}
              >
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
              {busy ? 'Generating…' : preview ? 'Regenerate preview' : 'Generate preview'}
            </button>
            <p className="field-note">
              The source pack is reserved to the email above. The live preview may use your brief to fetch matching
              media and store the generated page.
            </p>
          </div>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>

        <div className="preview-stage">
          <div className="preview-stage__header">
            <div>
              <span className="eyebrow">Protected preview output</span>
              <h3>{preview?.title ?? 'Your generated preview appears here'}</h3>
            </div>
            {preview ? (
              <div className="preview-stage__meta">
                <span className="tag">Quality {preview.qualityScore}/100</span>
              </div>
            ) : null}
          </div>

          <div className="preview-device">
            {preview ? (
              <iframe
                key={preview.requestId}
                className="preview-device__frame"
                title={preview.title}
                srcDoc={preview.previewHtml}
                loading="lazy"
                sandbox="allow-same-origin"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="preview-device__placeholder">
                <strong>Scroll-ready preview window</strong>
                <p>
                  Fill in the brief and press <em>Generate preview</em>. A full scrollable homepage mockup renders
                  inside this window instantly.
                </p>
              </div>
            )}
          </div>

          {preview ? (
            <div className="preview-stage__footer">
              <div>
                <strong>VoiceToWebsite Builder source pack</strong>
                <p>{preview.summary}</p>
                <p className="field-note">Includes: {preview.sourceFiles.join(', ')}</p>
                {preview.media?.attribution?.length ? (
                  <p className="field-note">
                    Media credits:{' '}
                    {preview.media.attribution
                      .filter((entry) => entry?.url)
                      .slice(0, 4)
                      .map((entry, index) => (
                        <React.Fragment key={`${entry.url}-${index}`}>
                          {index ? ', ' : ''}
                          <a href={entry.pageUrl ?? entry.url} target="_blank" rel="noreferrer">
                            {entry.provider}
                          </a>
                        </React.Fragment>
                      ))}
                  </p>
                ) : null}
              </div>
              <button
                className="button button--primary"
                type="button"
                onClick={handlePurchase}
                disabled={checkoutBusy}
              >
                {checkoutBusy ? 'Opening checkout…' : 'Buy source pack'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
