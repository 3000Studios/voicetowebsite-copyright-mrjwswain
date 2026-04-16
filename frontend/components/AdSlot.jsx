import React, { useEffect, useMemo } from 'react'

const slotIds = {
  leaderboard: '1234567890',
  rectangle: '0987654321'
}

function getAdsEnabled() {
  const raw = import.meta.env.VITE_ENABLE_ADS
  return String(raw ?? '').toLowerCase() === 'true'
}

export default function AdSlot({ variant = 'leaderboard' }) {
  const adsEnabled = useMemo(() => getAdsEnabled(), [])
  const publisher = import.meta.env.VITE_ADSENSE_PUBLISHER
  const hasPublisher = typeof publisher === 'string' && publisher.startsWith('ca-pub-')
  const slotId = slotIds[variant] ?? slotIds.leaderboard

  useEffect(() => {
    if (!adsEnabled || !hasPublisher || typeof window === 'undefined') {
      return
    }

    let attempts = 0
    const maxAttempts = 30 // ~7.5 seconds

    const tick = () => {
      attempts += 1
      if (Array.isArray(window.adsbygoogle)) {
        try {
          window.adsbygoogle.push({})
        } catch {
          // Ignore: AdSense can throw if the slot is not ready yet.
        }
        return true
      }
      return false
    }

    if (tick()) {
      return
    }

    const handle = window.setInterval(() => {
      if (tick() || attempts >= maxAttempts) {
        window.clearInterval(handle)
      }
    }, 250)

    return () => window.clearInterval(handle)
  }, [adsEnabled, hasPublisher, variant])

  // Always reserve space to prevent layout shift (even if AdSense is not yet enabled).
  const reservedHeight = variant === 'rectangle' ? 250 : 90
  const reservedWidth = variant === 'rectangle' ? 300 : 728

  if (!adsEnabled || !hasPublisher) {
    return (
      <div
        className="adsense-placeholder"
        aria-hidden="true"
        style={{ minHeight: reservedHeight, width: '100%', maxWidth: reservedWidth }}
      />
    )
  }

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={publisher}
      data-ad-slot={slotId}
      data-ad-format={variant === 'rectangle' ? 'rectangle' : 'auto'}
    />
  )
}

