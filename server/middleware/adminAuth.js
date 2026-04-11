const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'mr.jwswain@gmail.com'
const DEFAULT_ADMIN_CODE = process.env.ADMIN_PASSCODE ?? '5555'
const ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? process.env.X_ADMIN_KEY ?? ''

export function adminAuth(request, response, next) {
  const adminKey = request.headers['x-admin-key']
  const email = request.headers['x-admin-email']
  const code = request.headers['x-admin-code']

  if (ADMIN_API_KEY && adminKey === ADMIN_API_KEY) {
    request.admin = {
      authMode: 'api-key'
    }
    next()
    return
  }

  if (email !== DEFAULT_ADMIN_EMAIL || code !== DEFAULT_ADMIN_CODE) {
    response.status(403).json({
      error: 'Admin access required',
      message: 'Valid admin credentials or x-admin-key are required for this route.'
    })
    return
  }

  request.admin = {
    authMode: 'email-passcode',
    email
  }
  next()
}
