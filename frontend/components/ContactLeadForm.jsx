import React, { useState } from 'react'
import { submitLead } from '../src/siteApi.js'

const INITIAL_FORM = {
  name: '',
  email: '',
  company: '',
  interest: 'Launch Sprint',
  notes: ''
}

export default function ContactLeadForm() {
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
      await submitLead(form)
      setSuccess('Lead captured. You can now follow up from content/system/leads.json or wire this into CRM/email next.')
      setForm(INITIAL_FORM)
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section-card">
      <span className="eyebrow">Lead capture</span>
      <h2>Send serious buyers into a real pipeline</h2>
      <form className="lead-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Name</span>
          <input name="name" value={form.name} onChange={updateField} placeholder="Your name" />
        </label>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" value={form.email} onChange={updateField} placeholder="you@company.com" required />
        </label>
        <label className="field">
          <span>Company</span>
          <input name="company" value={form.company} onChange={updateField} placeholder="Company or brand" />
        </label>
        <label className="field">
          <span>Best-fit offer</span>
          <select name="interest" value={form.interest} onChange={updateField}>
            <option>Operator OS</option>
            <option>Launch Sprint</option>
            <option>Enterprise Deployment</option>
          </select>
        </label>
        <label className="field field--full">
          <span>What outcome do you want?</span>
          <textarea name="notes" rows="5" value={form.notes} onChange={updateField} placeholder="Describe the workflow, launch, or deployment you want help with." />
        </label>
        <div className="checkout-actions">
          <button className="button button--primary" type="submit" disabled={busy}>
            {busy ? 'Sending...' : 'Submit lead'}
          </button>
        </div>
        {success ? <p className="form-success">{success}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </form>
    </section>
  )
}
