import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PrismHeadline from '../components/PrismHeadline.jsx'
import AdminChrome from '../components/admin/AdminChrome.jsx'
import { saveAdminSession } from '../src/adminSession.js'
import { COPYRIGHT_HOLDER, SITE_DISPLAY_NAME, SITE_DOMAIN } from '../src/siteMeta.js'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    if (!email.trim() || !code.trim()) {
      setError('Enter the admin email and passcode to continue.')
      return
    }

    saveAdminSession({
      adminEmail: email.trim(),
      adminCode: code.trim()
    })
    navigate('/admin/overview')
  }

  return (
    <div className="admin-app admin-app--login">
      <AdminChrome />
      <main className="admin-login">
        <section className="auth-card admin-login__card">
          <div className="admin-login__brand">
            <span className="admin-sidebar__mark admin-login__mark" aria-hidden="true" />
            <div>
              <span className="eyebrow">{SITE_DISPLAY_NAME}</span>
              <p className="admin-login__tagline">Admin access · {SITE_DOMAIN}</p>
            </div>
          </div>
          <PrismHeadline text="Sign in to operations" />
          <p className="section-intro">
            Use your admin email and passcode for analytics, deployments, content edits, and AI commands.
          </p>
          <form className="stack-md" onSubmit={handleSubmit}>
            <label className="field">
              <span>Admin email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                placeholder="you@company.com"
              />
            </label>
            <label className="field">
              <span>Passcode</span>
              <input
                type="password"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </label>
            <div className="admin-actions">
              <button className="button button--primary" type="submit">
                Continue to dashboard
              </button>
            </div>
          </form>
          {error ? <div className="error-banner">{error}</div> : null}
          <p className="admin-login__copyright">
            © {new Date().getFullYear()} {COPYRIGHT_HOLDER}
          </p>
        </section>
      </main>
    </div>
  )
}
