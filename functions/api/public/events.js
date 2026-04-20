import { errorJson, json, readJsonBody } from '../../_lib/http.js'
import { hash, putJson } from '../../_lib/storage.js'

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return errorJson('Method not allowed.', 405)
  }

  const bucket = context.env?.DATA_BUCKET
  if (!bucket) {
    return errorJson('Analytics storage is not configured.', 501)
  }

  const payload = await readJsonBody(context.request)
  if (!payload) {
    return errorJson('Invalid JSON payload.', 400)
  }

  const ip = context.request.headers.get('cf-connecting-ip') ?? ''
  const ua = context.request.headers.get('user-agent') ?? ''
  const anonVisitor = hash(`${ip}|${ua}`)
  const id = `evt-${Date.now()}-${anonVisitor}`

  await putJson(bucket, `events/${id}.json`, {
    id,
    anonVisitor,
    type: payload.type ?? null,
    path: payload.path ?? null,
    sessionId: payload.sessionId ? hash(payload.sessionId) : null,
    referrer: payload.referrer ?? null,
    createdAt: new Date().toISOString()
  })

  return json({ ok: true, event: { id } }, { status: 201 })
}
