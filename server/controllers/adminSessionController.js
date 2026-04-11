import {
  clearAdminSessionCookie,
  createAdminSessionToken,
  getAdminSessionFromRequest,
  getLoginAttemptStatus,
  registerLoginAttempt,
  setAdminSessionCookie,
  validateAdminCredentials
} from '../services/adminAuthService.js'
import { recordOperationalEvent } from '../services/analyticsService.js'

export async function createAdminSession(request, response, next) {
  try {
    const status = getLoginAttemptStatus(request)
    if (status.lockedUntil) {
      response.status(429).json({
        error: 'TooManyAttempts',
        message: 'Admin login is temporarily locked. Try again later.',
        lockedUntil: new Date(status.lockedUntil).toISOString()
      })
      return
    }

    const email = String(request.body?.email ?? '').trim()
    const passcode = String(request.body?.passcode ?? '').trim()
    const valid = validateAdminCredentials(email, passcode)

    if (!valid) {
      const failure = registerLoginAttempt(request, false)
      await recordOperationalEvent('admin_login_failed', {
        adminEmail: email.toLowerCase(),
        ipAddress: failure.ipAddress
      })
      response.status(403).json({
        error: 'AdminAccessRequired',
        message: 'Valid admin credentials are required.',
        lockedUntil: failure.lockedUntil ? new Date(failure.lockedUntil).toISOString() : null
      })
      return
    }

    const token = createAdminSessionToken(email)
    const session = getAdminSessionFromRequest({
      headers: {
        cookie: `${encodeURIComponent('voicetowebsite_admin_session')}=${encodeURIComponent(token)}`
      }
    })

    setAdminSessionCookie(response, token)
    registerLoginAttempt(request, true)
    await recordOperationalEvent('admin_login_success', {
      adminEmail: session.adminEmail,
      ipAddress: status.ipAddress
    })

    response.status(201).json({
      ok: true,
      session
    })
  } catch (error) {
    next(error)
  }
}

export async function getAdminSessionStatus(request, response, next) {
  try {
    const session = getAdminSessionFromRequest(request)
    if (!session) {
      response.status(401).json({
        authenticated: false,
        message: 'Admin session not found.'
      })
      return
    }

    response.json({
      authenticated: true,
      session
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteAdminSession(request, response, next) {
  try {
    const session = getAdminSessionFromRequest(request)
    clearAdminSessionCookie(response)

    if (session) {
      await recordOperationalEvent('admin_logout', {
        adminEmail: session.adminEmail
      })
    }

    response.json({
      ok: true
    })
  } catch (error) {
    next(error)
  }
}
