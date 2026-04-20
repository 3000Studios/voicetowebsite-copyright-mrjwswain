import dotenv from 'dotenv'
import { validateCommand } from '../ai/router/commandRouter.js'
import { bootstrapContent, getContentBundle } from '../server/services/contentService.js'
import { getAnalyticsSnapshot } from '../server/services/analyticsService.js'
import { resolveModelRoute } from '../ai/router/modelRouter.js'
import { previewTrafficTopics } from '../ai/trafficEngine.js'
import { createPreviewRequest } from '../server/services/previewStudioService.js'
import { generatePreview } from '../frontend/src/previewEngine.js'

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
const fidelityPreview = generatePreview({
  email: 'test@example.com',
  brief:
    'Create a website for Harborline Yacht Brokers with private yacht charters, fractional ownership consulting, Miami concierge onboarding, and a CTA to schedule a marina walkthrough.',
  audience: 'high-net-worth buyers and charter clients',
  websiteType: 'local_service',
  styleTone: 'editorial',
  primaryCta: 'Schedule a marina walkthrough'
})
const fidelityChecks = {
  containsBrand: /Harborline Yacht Brokers/i.test(fidelityPreview.previewHtml),
  containsCharters: /private yacht charters/i.test(fidelityPreview.previewHtml),
  containsFractional: /fractional ownership consulting/i.test(fidelityPreview.previewHtml),
  containsCta: /Schedule a marina walkthrough/i.test(fidelityPreview.previewHtml)
}

if (Object.values(fidelityChecks).some((value) => !value)) {
  throw new Error('Preview generator is not preserving prompt-specific content.')
}

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
      fidelityChecks,
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
