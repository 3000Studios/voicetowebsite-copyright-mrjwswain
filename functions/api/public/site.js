import { json } from '../../_lib/http.js'
import { listCount } from '../../_lib/storage.js'

export async function onRequest(context) {
  const bucket = context.env?.DATA_BUCKET
  const leads = bucket ? await listCount(bucket, 'leads/') : 0
  const previews = bucket ? await listCount(bucket, 'previews/') : 0

  return json({
    ok: true,
    analytics: {
      visitors: 0,
      leads,
      previews,
      purchases: 0,
      revenue: 0
    },
    commerce: {
      offers: []
    },
    updatedAt: new Date().toISOString()
  })
}
