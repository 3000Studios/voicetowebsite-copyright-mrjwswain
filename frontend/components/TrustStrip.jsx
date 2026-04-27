import React from 'react'

export default function TrustStrip() {
  return (
    <div className="trust-strip" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      padding: '2rem',
      borderTop: '1px solid var(--line)',
      marginTop: '2rem',
      textAlign: 'center'
    }}>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', opacity: 0.7, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span style={{ fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Secure Checkout</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          <span style={{ fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Money-Back Guarantee</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span style={{ fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Verified Provider</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', opacity: 0.4, marginTop: '0.5rem' }}>
        <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" style={{ height: '18px' }} />
        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" style={{ height: '18px' }} />
      </div>
    </div>
  )
}
