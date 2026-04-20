import { errorJson, json } from '../../../_lib/http.js'
import { getCustomerSession } from '../../../_lib/customers.js'

export async function onRequest(context) {
  if (context.request.method !== 'GET') {
    return errorJson('Method not allowed.', 405)
  }

  if (!context.env?.DATA_BUCKET) {
    return errorJson('Customer access is not configured.', 501)
  }

  const token = new URL(context.request.url).searchParams.get('token') ?? ''
  if (!token) {
    return errorJson('Customer token is required.', 400)
  }

  const session = await getCustomerSession(context.env.DATA_BUCKET, token)
  if (!session) {
    return errorJson('Customer session was not found.', 404)
  }

  return json({
    ok: true,
    ...session
  })
}
