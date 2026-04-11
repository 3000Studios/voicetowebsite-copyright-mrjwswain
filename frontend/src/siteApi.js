const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })

  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.message ?? 'Request failed.')
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

export function startStripeCheckout(offerSlug) {
  return request('/api/public/checkout/stripe', {
    method: 'POST',
    body: { offerSlug }
  })
}

export function startPayPalCheckout(offerSlug) {
  return request('/api/public/checkout/paypal', {
    method: 'POST',
    body: { offerSlug }
  })
}

export function verifyStripeCheckout(sessionId) {
  return request(`/api/public/checkout/stripe/success?session_id=${encodeURIComponent(sessionId)}`)
}

export function capturePayPalCheckout(orderId) {
  return request(`/api/public/checkout/paypal/capture?token=${encodeURIComponent(orderId)}`)
}
