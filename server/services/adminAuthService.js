import crypto from 'node:crypto'

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'mr.jwswain@gmail.com'
const DEFAULT_ADMIN_CODE = process.env.ADMIN_PASSCODE ?? '5555'
const DEFAULT_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ?? process.env.JWT_SECRET ?? 'change-this-session-secret'
const DEFAULT_SESSION_TTL_MS = Number(process.env.ADMIN_SESSION_TTL_MS ?? 1000 * 60 * 60 * 8)
const LOGIN_WINDOW_MS = Number(process.env.ADMIN_LOGIN_WINDOW_MS ?? 1000 * 60 * 15)
const LOGIN_LOCKOUT_MS = Number(process.env.ADMIN_LOGIN_LOCKOUT_MS ?? 1000 * 60 * 15)
const MAX_LOGIN_ATTEMPTS = Number(process.env.ADMIN_MAX_LOGIN_ATTEMPTS ?? 6)
const COOKIE_NAME = 'voicetowebsite_admin_session'

const loginAttemptState = new Map()

function base64urlEncode(value) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function base64urlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function timingSafeEqualString(left, right) {
  const leftBuffer = Buffer.from(String(left), 'utf8')
  const rightBuffer = Buffer.from(String(right), 'utf8')

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

function signPayload(payload) {
  return crypto.createHmac('sha256', DEFAULT_SESSION_SECRET).update(payload).digest('base64url')
}

function getClientIp(request) {
  const forwarded = request.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim()
  }

  return request.ip ?? request.socket?.remoteAddress ?? 'unknown'
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) {
    return {}
  }

  return String(cookieHeader)
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((cookies, entry) => {
      const separatorIndex = entry.indexOf('=')
      if (separatorIndex <= 0) {
        return cookies
      }

      const key = entry.slice(0, separatorIndex).trim()
      const value = entry.slice(separatorIndex + 1).trim()
      cookies[key] = decodeURIComponent(value)
      return cookies
    }, {})
}

function toExpiresAt(issuedAt) {
  return new Date(issuedAt + DEFAULT_SESSION_TTL_MS).toISOString()
}

function getAttemptRecord(ipAddress) {
  const current = loginAttemptState.get(ipAddress)
  if (!current) {
    return {
      attempts: [],
      lockedUntil: null
    }
  }

  const now = Date.now()
  return {
    attempts: current.attempts.filter((timestamp) => now - timestamp < LOGIN_WINDOW_MS),
    lockedUntil:
      current.lockedUntil && current.lockedUntil > now ? current.lockedUntil : null
  }
}

export function getAdminCookieName() {
  return COOKIE_NAME
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DEFAULT_SESSION_TTL_MS
  }
}

export function getLoginAttemptStatus(request) {
  const ipAddress = getClientIp(request)
  const record = getAttemptRecord(ipAddress)
  loginAttemptState.set(ipAddress, record)

  return {
    ipAddress,
    attemptsRemaining: Math.max(0, MAX_LOGIN_ATTEMPTS - record.attempts.length),
    lockedUntil: record.lockedUntil
  }
}

export function registerLoginAttempt(request, successful) {
  const ipAddress = getClientIp(request)
  const record = getAttemptRecord(ipAddress)

  if (successful) {
    loginAttemptState.delete(ipAddress)
    return { ipAddress, lockedUntil: null }
  }

  const now = Date.now()
  record.attempts.push(now)
  if (record.attempts.length >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + LOGIN_LOCKOUT_MS
  }

  loginAttemptState.set(ipAddress, record)
  return { ipAddress, lockedUntil: record.lockedUntil }
}

export function validateAdminCredentials(email, passcode) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase()
  const normalizedCode = String(passcode ?? '').trim()

  return (
    timingSafeEqualString(normalizedEmail, DEFAULT_ADMIN_EMAIL.trim().toLowerCase()) &&
    timingSafeEqualString(normalizedCode, DEFAULT_ADMIN_CODE.trim())
  )
}

export function createAdminSessionToken(email) {
  const issuedAt = Date.now()
  const payload = {
    adminEmail: String(email).trim().toLowerCase(),
    issuedAt,
    expiresAt: toExpiresAt(issuedAt)
  }
  const encodedPayload = base64urlEncode(JSON.stringify(payload))
  const signature = signPayload(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export function verifyAdminSessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null
  }

  const [encodedPayload, signature] = token.split('.', 2)
  const expectedSignature = signPayload(encodedPayload)
  if (!timingSafeEqualString(signature, expectedSignature)) {
    return null
  }

  try {
    const payload = JSON.parse(base64urlDecode(encodedPayload))
    const expiresAtMs = new Date(payload.expiresAt).getTime()

    if (!payload.adminEmail || !Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
      return null
    }

    return {
      adminEmail: payload.adminEmail,
      authMode: 'session',
      expiresAt: payload.expiresAt,
      issuedAt: new Date(payload.issuedAt).toISOString()
    }
  } catch {
    return null
  }
}

export function getAdminSessionFromRequest(request) {
  const cookies = parseCookies(request.headers.cookie)
  return verifyAdminSessionToken(cookies[COOKIE_NAME])
}

export function setAdminSessionCookie(response, token) {
  const options = getAdminCookieOptions()
  response.cookie(COOKIE_NAME, token, options)
}

export function clearAdminSessionCookie(response) {
  response.clearCookie(COOKIE_NAME, {
    ...getAdminCookieOptions(),
    maxAge: undefined
  })
}
