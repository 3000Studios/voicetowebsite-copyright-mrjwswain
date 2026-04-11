import React, { useState } from 'react'
import { submitLead } from '../src/siteApi.js'

const INITIAL_FORM = {
  name: '',
  email: ''
}

export default function NewsletterSignupForm() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setBusy(true)
      setError('')
      setSuccess('')
      await submitLead({
        ...form,
        interest: 'Newsletter',
        notes: 'Newsletter subscriber',
        source: 'newsletter'
      })
      setForm(INITIAL_FORM)
      setSuccess('Subscribed. Future product stories and release notes will now land in the newsletter queue.')
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section-card newsletter-panel">
      <div>
        <span className="eyebrow">Newsletter</span>
        <h2>Get one high-signal update instead of endless noise</h2>
        <p className="section-intro">
          Subscribe for product releases, new stories, monetization updates, and deployment notes. The form writes into the same lead system the admin dashboard already tracks.
        </p>
      </div>
      <form className="newsletter-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Name</span>
          <input name="name" value={form.name} onChange={updateField} placeholder="Your name" />
        </label>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" value={form.email} onChange={updateField} placeholder="you@company.com" required />
        </label>
        <button className="button button--primary" type="submit" disabled={busy}>
          {busy ? 'Subscribing...' : 'Join the newsletter'}
        </button>
      </form>
      {success ? <p className="form-success">{success}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  )
}
