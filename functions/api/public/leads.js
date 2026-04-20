import { errorJson, json, readJsonBody } from '../../_lib/http.js'
import { hash, putJson } from '../../_lib/storage.js'

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return errorJson('Method not allowed.', 405)
  }

  const bucket = context.env?.DATA_BUCKET
  if (!bucket) {
    return errorJson('Lead capture storage is not configured.', 501)
  }

  const payload = await readJsonBody(context.request)
  if (!payload) {
    return errorJson('Invalid JSON payload.', 400)
  }

  const email = String(payload.email ?? '').trim().toLowerCase()
  if (!email) {
    return errorJson('Email is required.', 400)
  }

  const id = `lead-${Date.now()}-${hash(email)}`
  await putJson(bucket, `leads/${id}.json`, {
    id,
    email,
    source: payload.source ?? null,
    interest: payload.interest ?? null,
    notes: payload.notes ?? null,
    createdAt: new Date().toISOString()
  })

  return json({ ok: true, lead: { id } }, { status: 201 })
}
