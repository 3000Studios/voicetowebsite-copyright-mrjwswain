const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
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

export function createAdminSession(email, passcode) {
  return request('/api/admin/session', {
    method: 'POST',
    body: { email, passcode }
  })
}

export function getAdminSessionStatus() {
  return request('/api/admin/session')
}

export function deleteAdminSession() {
  return request('/api/admin/session', { method: 'DELETE' })
}

export function getAnalytics() {
  return request('/api/analytics')
}

export function getDeployments() {
  return request('/api/deployments')
}

export function getContent() {
  return request('/api/content')
}

export function sendCommand(command) {
  return request('/api/command', {
    method: 'POST',
    body: command
  })
}
