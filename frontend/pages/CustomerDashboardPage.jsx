import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import WebsitePreviewStudio from '../components/WebsitePreviewStudio.jsx'
import { clearCustomerSession, readCustomerSession, saveCustomerSession } from '../src/customerSession.js'
import { getCustomerSession, requestCustomerDashboardAccess } from '../src/siteApi.js'

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim())
}

export default function CustomerDashboardPage() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [session, setSession] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setBusy(true)
        setError('')
        const tokenFromUrl = searchParams.get('token')
        const saved = readCustomerSession()
        const token = tokenFromUrl || saved?.accessToken || ''

        if (!token) {
          setSession(null)
          return
        }

        const response = await getCustomerSession(token)
        const nextSession = {
          accessToken: response.accessToken,
          dashboardUrl: response.dashboardUrl,
          account: response.account
        }
        saveCustomerSession(nextSession)
        setSession(nextSession)
      } catch (nextError) {
        setSession(null)
        setError(nextError.message)
      } finally {
        setBusy(false)
      }
    }

    load()
  }, [searchParams])

  async function handleAccessRequest(event) {
    event.preventDefault()
    try {
      setError('')
      const normalizedEmail = email.trim().toLowerCase()
      if (!isValidEmail(normalizedEmail)) {
        throw new Error('Enter the checkout email used for your plan.')
      }

      setBusy(true)
      const response = await requestCustomerDashboardAccess(normalizedEmail)
      const nextSession = {
        accessToken: response.accessToken,
        dashboardUrl: response.dashboardUrl,
        account: response.account
      }
      saveCustomerSession(nextSession)
      setSession(nextSession)
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBusy(false)
    }
  }

  function handleSignOut() {
    clearCustomerSession()
    setSession(null)
  }

  if (!session) {
    return (
      <div className="stack-xl page-remix">
        <section className="section-card centered-card page-remix__hero">
          <div>
            <span className="eyebrow">Customer dashboard</span>
            <h1>Open your generator workspace</h1>
            <p className="section-intro">
              Enter the same email you used for checkout. If a customer record exists, your dashboard access will open immediately.
            </p>
          </div>
          <form className="preview-form" onSubmit={handleAccessRequest} noValidate style={{ width: 'min(460px, 100%)' }}>
            <label className="field">
              <span>Checkout email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
            <div className="hero__actions">
              <button className="button button--primary" type="submit" disabled={busy}>
                {busy ? 'Opening…' : 'Open dashboard'}
              </button>
              <Link className="button button--ghost" to="/products">
                View plans
              </Link>
            </div>
            {error ? <p className="form-error">{error}</p> : null}
          </form>
        </section>
      </div>
    )
  }

  return (
    <div className="stack-xl page-remix">
      <section className="section-card">
        <span className="eyebrow">Customer dashboard</span>
        <h1>{session.account.email}</h1>
        <p className="section-intro">
          Your account record is active. Use the generator below without re-entering your email, and your previews stay tied to this customer profile.
        </p>
        <div className="tag-row">
          {(session.account.entitlements ?? []).map((item) => (
            <span key={item} className="tag">
              {item}
            </span>
          ))}
          <span className="tag">Previews {session.account.generationCount ?? 0}</span>
        </div>
        <div className="hero__actions">
          <button className="button button--ghost" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </section>

      <WebsitePreviewStudio accountEmail={session.account.email} unrestricted />
    </div>
  )
}
