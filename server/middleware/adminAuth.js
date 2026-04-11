import crypto from 'node:crypto'
import { getAdminSessionFromRequest, validateAdminCredentials } from '../services/adminAuthService.js'

const ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? process.env.X_ADMIN_KEY ?? ''

function matchesAdminApiKey(candidate) {
  if (!ADMIN_API_KEY || !candidate) {
    return false
  }

  const expectedBuffer = Buffer.from(ADMIN_API_KEY, 'utf8')
  const candidateBuffer = Buffer.from(String(candidate), 'utf8')
  if (expectedBuffer.length !== candidateBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(expectedBuffer, candidateBuffer)
}

export function adminAuth(request, response, next) {
  const adminKey = request.headers['x-admin-key']
  const email = request.headers['x-admin-email']
  const code = request.headers['x-admin-code']
  const session = getAdminSessionFromRequest(request)

  if (matchesAdminApiKey(adminKey)) {
    request.admin = {
      authMode: 'api-key'
    }
    next()
    return
  }

  if (session) {
    request.admin = session
    next()
    return
  }

  if (!validateAdminCredentials(email, code)) {
    response.status(403).json({
      error: 'Admin access required',
      message: 'A valid admin session or admin API key is required for this route.'
    })
    return
  }

  request.admin = {
    authMode: 'legacy-email-passcode',
    adminEmail: String(email).trim().toLowerCase()
  }
  next()
}
