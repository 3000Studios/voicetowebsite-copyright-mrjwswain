function normalizeQuery(text) {
  return String(text ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 140)
}

function pickFirst(list, count) {
  const items = Array.isArray(list) ? list : []
  return items.filter(Boolean).slice(0, count)
}

function getCoverrHeroVideo(websiteType) {
  const videos = {
    saas: 'https://cdn.coverr.co/videos/coverr-working-on-the-laptop-4242/1080p.mp4',
    local_service: 'https://cdn.coverr.co/videos/coverr-cafe-owner-preparing-orders-1332/1080p.mp4',
    creator: 'https://cdn.coverr.co/videos/coverr-video-production-team-discussing-1578/1080p.mp4',
    ecommerce: 'https://cdn.coverr.co/videos/coverr-online-shopping-1572/1080p.mp4'
  }
  return videos[String(websiteType ?? '').toLowerCase()] ?? videos.saas
}

async function fetchUnsplashImages(query, count) {
  const key = process.env.UNSPLASH_API_KEY
  if (!key || key.startsWith('replace-with-')) return []

  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${Math.max(
      3,
      Math.min(10, count)
    )}&orientation=landscape`,
    {
      headers: {
        Authorization: `Client-ID ${key}`
      }
    }
  )

  if (!response.ok) return []

  const payload = await response.json()
  const results = Array.isArray(payload?.results) ? payload.results : []
  return results
    .map((item) => ({
      url: item?.urls?.regular ?? item?.urls?.full ?? null,
      pageUrl: item?.links?.html ?? null,
      authorName: item?.user?.name ?? null,
      authorUrl: item?.user?.links?.html ?? null,
      provider: 'Unsplash'
    }))
    .filter((item) => item.url)
}

async function fetchPexelsImages(query, count) {
  const key = process.env.PEXELS_API_KEY
  if (!key || key.startsWith('replace-with-')) return []

  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${Math.max(
      3,
      Math.min(10, count)
    )}&orientation=landscape`,
    {
      headers: {
        Authorization: key
      }
    }
  )

  if (!response.ok) return []

  const payload = await response.json()
  const photos = Array.isArray(payload?.photos) ? payload.photos : []
  return photos
    .map((item) => ({
      url: item?.src?.large2x ?? item?.src?.large ?? item?.src?.original ?? null,
      pageUrl: item?.url ?? null,
      authorName: item?.photographer ?? null,
      authorUrl: item?.photographer_url ?? null,
      provider: 'Pexels'
    }))
    .filter((item) => item.url)
}

export async function getMediaForGeneration({ brief, websiteType }) {
  const query = normalizeQuery(brief || websiteType || 'website')
  const heroVideo = getCoverrHeroVideo(websiteType)

  const [unsplash, pexels] = await Promise.allSettled([
    fetchUnsplashImages(query, 3),
    fetchPexelsImages(query, 3)
  ])

  const unsplashImages = unsplash.status === 'fulfilled' ? unsplash.value : []
  const pexelsImages = pexels.status === 'fulfilled' ? pexels.value : []

  const gallery = pickFirst(
    [
      ...unsplashImages.map((img) => img.url),
      ...pexelsImages.map((img) => img.url)
    ],
    3
  )

  const attribution = [
    { provider: 'Coverr', scope: 'heroVideo', url: heroVideo },
    ...unsplashImages
      .filter((img) => gallery.includes(img.url))
      .map((img) => ({
        provider: img.provider,
        scope: 'image',
        url: img.url,
        pageUrl: img.pageUrl,
        authorName: img.authorName,
        authorUrl: img.authorUrl
      })),
    ...pexelsImages
      .filter((img) => gallery.includes(img.url))
      .map((img) => ({
        provider: img.provider,
        scope: 'image',
        url: img.url,
        pageUrl: img.pageUrl,
        authorName: img.authorName,
        authorUrl: img.authorUrl
      }))
  ]

  if (gallery.length === 0) {
    return {
      heroVideo,
      gallery: [],
      attribution
    }
  }

  return {
    heroVideo,
    gallery,
    attribution
  }
}

