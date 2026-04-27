// Web Crypto API is global in Cloudflare Workers

function nowIso() {
  return new Date().toISOString()
}

function safeJson(value) {
  return JSON.stringify(value, null, 2)
}

export async function hash(value) {
  const msgUint8 = new TextEncoder().encode(String(value ?? ''))
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}

export async function putJson(bucket, key, value) {
  await bucket.put(key, safeJson({ ...value, storedAt: nowIso() }), {
    httpMetadata: { contentType: 'application/json; charset=utf-8' }
  })
}

export async function getJson(bucket, key) {
  const object = await bucket.get(key)
  if (!object) {
    return null
  }

  const text = await object.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function listCount(bucket, prefix) {
  let cursor = undefined
  let count = 0

  while (true) {
    const batch = await bucket.list({ prefix, cursor, limit: 1000 })
    count += batch.objects?.length ?? 0
    if (!batch.truncated) break
    cursor = batch.cursor
  }

  return count
}
