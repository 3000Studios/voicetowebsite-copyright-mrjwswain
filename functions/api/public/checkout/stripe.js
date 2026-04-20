import { errorJson } from '../../../_lib/http.js'

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return errorJson('Method not allowed.', 405)
  }

  return errorJson('Stripe checkout is not configured.', 501)
}

