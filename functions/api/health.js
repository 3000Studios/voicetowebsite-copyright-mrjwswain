import { json } from '../_lib/http.js'

export async function onRequest(context) {
  return json({
    ok: true,
    status: 'ok',
    app: context.env?.APP_NAME ?? 'voicetowebsite',
    mode: 'pages-functions'
  })
}

