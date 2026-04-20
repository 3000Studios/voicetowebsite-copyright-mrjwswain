export function json(payload, init = {}) {
  const headers = new Headers(init.headers ?? {})
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json; charset=utf-8')
  }
  return new Response(JSON.stringify(payload, null, 2), { ...init, headers })
}

export function errorJson(message, status = 400, extra = {}) {
  return json({ ok: false, message, ...extra }, { status })
}

export async function readJsonBody(request) {
  const text = await request.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

