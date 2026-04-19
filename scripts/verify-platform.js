import dotenv from 'dotenv'
import { validateCommand } from '../ai/router/commandRouter.js'
import { bootstrapContent, getContentBundle } from '../server/services/contentService.js'
import { getAnalyticsSnapshot } from '../server/services/analyticsService.js'
import { resolveModelRoute } from '../ai/router/modelRouter.js'
import { previewTrafficTopics } from '../ai/trafficEngine.js'
import { createPreviewRequest } from '../server/services/previewStudioService.js'

dotenv.config({ path: '.env.local' })
dotenv.config()

await bootstrapContent()

const content = await getContentBundle()
const analytics = await getAnalyticsSnapshot()
const command = validateCommand({
  action: 'create_blog_post',
  topic: 'AI automation',
  autoDeploy: false
})
const modelRoute = await resolveModelRoute({ action: 'create_blog_post' })
const discovery = await previewTrafficTopics({ limit: 3 })
const generatorCheck = await createPreviewRequest({
  dryRun: true,
  email: 'test@example.com',
  brief: 'A voice-first website that sells a launch sprint and shows the product in motion, with a clear CTA and FAQ.',
  audience: 'founders and small teams',
  websiteType: 'saas',
  styleTone: 'cinematic',
  primaryCta: 'Start building now'
})

console.log(
  JSON.stringify(
    {
      ok: true,
      contentCounts: {
        pages: content.pages.length,
        blog: content.blog.length,
        products: content.products.length
      },
      generator: {
        requestId: generatorCheck.requestId,
        qualityScore: generatorCheck.qualityScore,
        hasHtml: Boolean(generatorCheck.previewHtml),
        hasMedia: Boolean(generatorCheck.media?.heroVideo)
      },
      analyticsSummary: {
        visitors: analytics.visitors,
        conversionRate: analytics.conversionRate
      },
      trafficSummary: {
        queuedTopics: analytics.traffic.queuedTopics,
        discoveredTopics: discovery.topics.length
      },
      sampleCommand: command,
      modelRoute
    },
    null,
    2
  )
)
