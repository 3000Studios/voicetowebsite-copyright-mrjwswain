import crypto from 'node:crypto'

function nowIso() {
  return new Date().toISOString()
}

function safeJson(value) {
  return JSON.stringify(value, null, 2)
}

export function hash(value) {
  return crypto.createHash('sha256').update(String(value ?? ''), 'utf8').digest('hex').slice(0, 16)
}

export async function putJson(bucket, key, value) {
  await bucket.put(key, safeJson({ ...value, storedAt: nowIso() }), {
    httpMetadata: { contentType: 'application/json; charset=utf-8' }
  })
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

