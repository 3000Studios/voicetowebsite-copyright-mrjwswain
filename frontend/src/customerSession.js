const STORAGE_KEY = 'voicetowebsite.customer.session'

export function saveCustomerSession(session) {
  if (typeof window === 'undefined' || !session?.accessToken) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function readCustomerSession() {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearCustomerSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}
