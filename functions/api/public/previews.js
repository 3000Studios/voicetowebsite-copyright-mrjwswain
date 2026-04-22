import { errorJson, json, readJsonBody } from '../../_lib/http.js'
import { touchCustomerPreview } from '../../_lib/customers.js'
import { generatePreview } from '../../../frontend/src/previewEngine.js'
import { getMediaForGeneration } from '../../../server/services/mediaEngine.js'
import { hash, putJson } from '../../_lib/storage.js'

const FALLBACK_MEDIA = {
  saas: {
    heroVideo: 'https://cdn.coverr.co/videos/coverr-man-working-on-a-laptop-1579/1080p.mp4',
    gallery: [
      'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  local_service: {
    heroVideo: 'https://cdn.coverr.co/videos/coverr-smiling-electrician-2209/1080p.mp4',
    gallery: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  creator: {
    heroVideo: 'https://cdn.coverr.co/videos/coverr-video-production-team-discussing-1578/1080p.mp4',
    gallery: [
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  ecommerce: {
    heroVideo: 'https://cdn.coverr.co/videos/coverr-online-shopping-1572/1080p.mp4',
    gallery: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80'
    ]
  }
}

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
      const fallback = FALLBACK_MEDIA[String(payload.websiteType ?? 'saas').trim().toLowerCase()] ?? FALLBACK_MEDIA.saas
      media = {
        heroVideo: fetched.heroVideo,
        gallery: Array.isArray(fetched.gallery) && fetched.gallery.length ? fetched.gallery : fallback.gallery,
        attribution: Array.isArray(fetched.attribution) ? fetched.attribution : []
      }
    }
  } catch {
    media = null
  }

  if (!media) {
    media = FALLBACK_MEDIA[String(payload.websiteType ?? 'saas').trim().toLowerCase()] ?? FALLBACK_MEDIA.saas
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

    await touchCustomerPreview(bucket, email, preview.requestId)
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
