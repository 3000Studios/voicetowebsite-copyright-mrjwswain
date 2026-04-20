import { errorJson, json, readJsonBody } from '../../_lib/http.js'
import { generatePreview } from '../../../frontend/src/previewEngine.js'
import { getMediaForGeneration } from '../../../server/services/mediaEngine.js'
import { hash, putJson } from '../../_lib/storage.js'

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim())
}

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return errorJson('Method not allowed.', 405)
  }

  const payload = await readJsonBody(context.request)
  if (!payload) {
    return errorJson('Invalid JSON payload.', 400)
  }

  const email = String(payload.email ?? '').trim().toLowerCase()
  const brief = String(payload.brief ?? '').trim()

  if (!isValidEmail(email)) {
    return errorJson('Enter a valid email.', 400)
  }
  if (brief.length < 20) {
    return errorJson('Describe the website in at least 20 characters.', 400)
  }

  let media = null
  try {
    const fetched = await getMediaForGeneration(
      { brief, websiteType: payload.websiteType },
      context.env ?? {}
    )
    if (fetched?.heroVideo) {
      media = fetched
    }
  } catch {
    media = null
  }

  const preview = generatePreview({ ...payload, email, brief, media })

  const bucket = context.env?.DATA_BUCKET
  if (bucket) {
    await putJson(bucket, `previews/${preview.requestId}.json`, {
      requestId: preview.requestId,
      email,
      brief,
      websiteType: preview.websiteType,
      styleTone: preview.styleTone,
      audience: preview.audience,
      primaryCta: preview.primaryCta,
      title: preview.title,
      summary: preview.summary,
      qualityScore: preview.qualityScore,
      seoKeywords: preview.seoKeywords,
      media,
      createdAt: new Date().toISOString()
    })
    await putJson(bucket, `generation_requests/${preview.requestId}.json`, {
      requestId: preview.requestId,
      email,
      brief,
      websiteType: preview.websiteType,
      styleTone: preview.styleTone,
      audience: preview.audience,
      primaryCta: preview.primaryCta,
      status: 'preview_ready',
      createdAt: new Date().toISOString()
    })
    await putJson(bucket, `quality_metrics/${preview.requestId}.json`, {
      requestId: preview.requestId,
      total: preview.qualityMetrics?.total ?? preview.qualityScore,
      metrics: preview.qualityMetrics?.metrics ?? {},
      createdAt: new Date().toISOString()
    })
    await putJson(bucket, `media_assets/${preview.requestId}.json`, {
      requestId: preview.requestId,
      heroVideo: media?.heroVideo ?? null,
      gallery: media?.gallery ?? [],
      attribution: media?.attribution ?? [],
      createdAt: new Date().toISOString()
    })
  }

  return json(
    {
      ok: true,
      leadId: bucket ? `lead-${hash(email)}` : null,
      preview: {
        ...preview,
        media
      }
    },
    { status: 201 }
  )
}
