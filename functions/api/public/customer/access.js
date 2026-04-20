import { errorJson, json, readJsonBody } from '../../../_lib/http.js'
import { isValidEmail, requestCustomerAccess } from '../../../_lib/customers.js'

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return errorJson('Method not allowed.', 405)
  }

  if (!context.env?.DATA_BUCKET) {
    return errorJson('Customer access is not configured.', 501)
  }

  const body = await readJsonBody(context.request)
  const email = String(body?.email ?? '').trim().toLowerCase()

  if (!isValidEmail(email)) {
    return errorJson('Enter a valid email.', 400)
  }

  const session = await requestCustomerAccess(context.env.DATA_BUCKET, email)
  if (!session) {
    return errorJson('No customer record exists for that email yet.', 404)
  }

  return json({
    ok: true,
    ...session
  })
}
