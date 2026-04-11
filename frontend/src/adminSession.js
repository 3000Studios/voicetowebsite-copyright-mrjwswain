const SESSION_KEY = 'voicetowebsite-admin-session'
const LEGACY_SESSION_KEY = 'myappai-admin-session'

export { SESSION_KEY }

export function getAdminSession() {
  try {
    let raw = localStorage.getItem(SESSION_KEY)
    if (!raw) {
      raw = localStorage.getItem(LEGACY_SESSION_KEY)
      if (raw) {
        localStorage.setItem(SESSION_KEY, raw)
        localStorage.removeItem(LEGACY_SESSION_KEY)
      }
    }
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw)
    if (!parsed?.adminEmail || !parsed?.adminCode) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveAdminSession(payload) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload))
  localStorage.removeItem(LEGACY_SESSION_KEY)
}

export function clearAdminSession() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(LEGACY_SESSION_KEY)
}
