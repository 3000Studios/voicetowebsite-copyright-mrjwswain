const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function request(path, { adminEmail, adminCode, adminKey, method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-admin-email': adminEmail,
      'x-admin-code': adminCode,
      'x-admin-key': adminKey ?? ''
    },
    body: body ? JSON.stringify(body) : undefined
  })

  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.message ?? 'Request failed.')
  }

  return payload
}

export function getAnalytics(adminSession) {
  return request('/api/analytics', adminSession)
}

export function getDeployments(adminSession) {
  return request('/api/deployments', adminSession)
}

export function getContent(adminSession) {
  return request('/api/content', adminSession)
}

export function sendCommand(adminSession, command) {
  return request('/api/command', {
    ...adminSession,
    method: 'POST',
    body: command
  })
}
