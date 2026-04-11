import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, staggerParent } from '../animations/variants.js'

const ADMIN_CODE = '5555'

export default function AdminLoginPage({ onLogin }) {
const [code, setCode] = useState('')
const [error, setError] = useState('')
const [loading, setLoading] = useState(false)

function handleSubmit(e) {
  e.preventDefault()
  setLoading(true)
  setError('')
  setTimeout(() => {
    if (code === ADMIN_CODE) {
      onLogin && onLogin()
    } else {
      setError('Invalid access code. Try again.')
      setCode('')
    }
    setLoading(false)
  }, 600)
}

return (
  <div className="admin-app admin-app--login" style={{ minHeight: '100vh', paddingTop: '6rem' }}>
    <motion.div
      className="admin-login"
      initial="hidden"
      animate="visible"
      variants={staggerParent}
    >
      <motion.div className="admin-login__card" variants={fadeUp}>
        {/* Brand */}
        <div className="admin-login__brand">
          <span className="admin-login__mark" />
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>
              VoiceToWebsite
            </div>
            <div className="admin-login__tagline">Admin Dashboard</div>
          </div>
        </div>

        {/* Heading */}
        <motion.div variants={fadeUp} style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem' }}>
            Secure Access
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
            Enter your admin passcode to continue.
          </p>
        </motion.div>

        {/* Form */}
        <motion.form onSubmit={handleSubmit} variants={fadeUp} className="stack-md">
          <div className="field">
            <span>Access Code</span>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              placeholder="••••"
              value={code}
              onChange={e => setCode(e.target.value)}
              autoFocus
              required
              style={{ letterSpacing: '0.3em', fontSize: '1.2rem', textAlign: 'center' }}
            />
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button
            type="submit"
            className="button button--primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading || !code}
          >
            {loading ? 'Verifying...' : 'Enter Dashboard →'}
          </button>
        </motion.form>

        <p className="admin-login__copyright">
          © {new Date().getFullYear()} VoiceToWebsite · 3000 Studios
        </p>
      </motion.div>
    </motion.div>
  </div>
)
}