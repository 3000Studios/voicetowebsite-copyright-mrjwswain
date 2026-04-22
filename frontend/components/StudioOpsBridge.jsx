import React from 'react'
import { useLocation } from 'react-router-dom'
import { SITE_DOMAIN, SITE_URL } from '../src/siteMeta.js'

const DEFAULT_MONITOR_ENDPOINT = 'https://3000studios.vip/api/site-monitor/ingest'

export default function StudioOpsBridge() {
  const location = useLocation()

  React.useEffect(() => {
    const bridge = {
      site: SITE_DOMAIN,
      origin: SITE_URL,
      path: `${location.pathname}${location.search}`,
      monitoredAt: new Date().toISOString(),
      adsProtectedSelectors: ['[data-ads-lock]', '.adsense-wrap'],
      endpoints: {
        snapshot: '/api/public/site',
        leads: '/api/public/leads',
        events: '/api/public/events',
        preview: '/api/public/previews',
        stripe: '/api/public/checkout/stripe',
        paypal: '/api/public/checkout/paypal',
        customerAccess: '/api/public/customer/access',
        customerSession: '/api/public/customer/session'
      },
      editSurfaces: {
        dashboard: '/dashboard',
        admin: '/admin',
        contentRoutes: ['/products', '/pricing', '/blog', '/contact']
      }
    }

    window.__VTW_SITE_BRIDGE__ = bridge

    const monitorEndpoint = import.meta.env.VITE_STUDIO_MONITOR_ENDPOINT || DEFAULT_MONITOR_ENDPOINT
    if (!monitorEndpoint || typeof navigator?.sendBeacon !== 'function') {
      return
    }

    try {
      const payload = new Blob([JSON.stringify({ type: 'page_view', ...bridge })], {
        type: 'application/json'
      })
      navigator.sendBeacon(monitorEndpoint, payload)
    } catch {
      // non-blocking
    }
  }, [location.pathname, location.search])

  return (
    <script
      id="studio-ops-bridge"
      type="application/json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          site: SITE_DOMAIN,
          origin: SITE_URL,
          monitorEndpoint: import.meta.env.VITE_STUDIO_MONITOR_ENDPOINT || DEFAULT_MONITOR_ENDPOINT
        })
      }}
    />
  )
}
