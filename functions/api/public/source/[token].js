import { errorJson } from '../../../_lib/http.js'

export async function onRequest(context) {
  const token = context.params?.token
  if (!token) {
    return errorJson('Missing token.', 400)
  }

  return errorJson('Source delivery is not enabled yet.', 501)
}

