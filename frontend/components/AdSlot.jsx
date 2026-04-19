import React, { useEffect, useMemo } from 'react'

const DEFAULT_ADSENSE_PUBLISHER = 'ca-pub-5800977493749262'

function getAdsEnabled() {
  const raw = import.meta.env.VITE_ENABLE_ADS
  const normalized = String(raw ?? '').toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  return Boolean(import.meta.env.PROD)
}

function getSlotId(variant) {
  if (variant === 'rectangle') return import.meta.env.VITE_ADSENSE_SLOT_RECTANGLE
  return import.meta.env.VITE_ADSENSE_SLOT_LEADERBOARD
}

export default function AdSlot({ variant = 'leaderboard' }) {
  const adsEnabled = useMemo(() => getAdsEnabled(), [])
  const publisher = import.meta.env.VITE_ADSENSE_PUBLISHER || DEFAULT_ADSENSE_PUBLISHER
  const hasPublisher = typeof publisher === 'string' && publisher.startsWith('ca-pub-')
  const slotId = getSlotId(variant)
  const hasSlotId = typeof slotId === 'string' && /^\d+$/.test(slotId)

  useEffect(() => {
    if (!adsEnabled || !hasPublisher || !hasSlotId || typeof window === 'undefined') {
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

  if (!adsEnabled || !hasPublisher || !hasSlotId) return null

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

