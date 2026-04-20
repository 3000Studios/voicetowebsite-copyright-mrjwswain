const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })

  const text = await response.text()
  const payload = text ? (() => {
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  })() : null

  if (!response.ok) {
    if (payload?.message) {
      throw new Error(payload.message)
    }
    throw new Error('Request failed.')
  }

  if (!payload) {
    throw new Error('API returned an empty response.')
  }

  return payload
}

export function getPublicSiteSnapshot() {
  return request('/api/public/site')
}

export function trackSiteEvent(event) {
  return request('/api/public/events', {
    method: 'POST',
    body: event
  })
}

export function submitLead(lead) {
  return request('/api/public/leads', {
    method: 'POST',
    body: lead
  })
}

export function createWebsitePreview(previewPayload) {
  return request('/api/public/previews', {
    method: 'POST',
    body: previewPayload
  })
}

export function startStripeCheckout(offerSlug, checkoutContext = {}) {
  return request('/api/public/checkout/stripe', {
    method: 'POST',
    body: {
      offerSlug,
      ...checkoutContext
    }
  })
}

export function startPayPalCheckout(offerSlug, checkoutContext = {}) {
  return request('/api/public/checkout/paypal', {
    method: 'POST',
    body: {
      offerSlug,
      ...checkoutContext
    }
  })
}

export function requestCustomerDashboardAccess(email) {
  return request('/api/public/customer/access', {
    method: 'POST',
    body: { email }
  })
}

export function getCustomerSession(token) {
  return request(`/api/public/customer/session?token=${encodeURIComponent(token)}`)
}

export function verifyStripeCheckout(sessionId) {
  return request(`/api/public/checkout/stripe/success?session_id=${encodeURIComponent(sessionId)}`)
}

export function capturePayPalCheckout(orderId) {
  return request(`/api/public/checkout/paypal/capture?token=${encodeURIComponent(orderId)}`)
}
