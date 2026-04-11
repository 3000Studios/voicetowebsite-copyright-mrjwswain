import { getContentBundle, getSystemDefault, readSystemDocument, writeSystemDocument } from './contentService.js'
import { getPaymentsSnapshot } from './commerceService.js'
import { listAvailableModels } from './ollamaService.js'

const DEFAULT_ANALYTICS = {
  aiActivity: {
    commandsToday: 0,
    deploymentsToday: 0,
    lastAction: 'idle'
  },
  updatedAt: null
}

const DEFAULT_EVENTS = {
  events: [],
  updatedAt: null
}

const DEFAULT_LEADS = {
  leads: [],
  updatedAt: null
}

function nowIso() {
  return new Date().toISOString()
}

export async function recordAiActivity(action) {
  const analytics = await readSystemDocument('analytics.json', DEFAULT_ANALYTICS)
  analytics.aiActivity = analytics.aiActivity ?? DEFAULT_ANALYTICS.aiActivity
  analytics.aiActivity.commandsToday += 1
  analytics.aiActivity.lastAction = action
  analytics.updatedAt = nowIso()
  await writeSystemDocument('analytics.json', analytics)
  return analytics
}

export async function recordDeploymentActivity() {
  const analytics = await readSystemDocument('analytics.json', DEFAULT_ANALYTICS)
  analytics.aiActivity = analytics.aiActivity ?? DEFAULT_ANALYTICS.aiActivity
  analytics.aiActivity.deploymentsToday += 1
  analytics.updatedAt = nowIso()
  await writeSystemDocument('analytics.json', analytics)
  return analytics
}

export async function recordSiteEvent(eventPayload) {
  const events = await readSystemDocument('events.json', DEFAULT_EVENTS)
  const nextEvent = {
    id: `${eventPayload.type ?? 'event'}-${Date.now()}`,
    type: eventPayload.type ?? 'page_view',
    path: eventPayload.path ?? '/',
    sessionId: eventPayload.sessionId ?? 'anonymous',
    referrer: eventPayload.referrer ?? '',
    createdAt: nowIso()
  }

  events.events = [nextEvent, ...(events.events ?? [])].slice(0, 5000)
  events.updatedAt = nextEvent.createdAt
  await writeSystemDocument('events.json', events)
  return nextEvent
}

export async function recordLead(leadPayload) {
  if (!leadPayload.email || !String(leadPayload.email).includes('@')) {
    throw new Error('A valid email address is required.')
  }

  const leads = await readSystemDocument('leads.json', DEFAULT_LEADS)
  const nextLead = {
    id: `lead-${Date.now()}`,
    name: String(leadPayload.name ?? '').trim(),
    email: String(leadPayload.email ?? '').trim().toLowerCase(),
    company: String(leadPayload.company ?? '').trim(),
    interest: String(leadPayload.interest ?? '').trim(),
    notes: String(leadPayload.notes ?? '').trim(),
    createdAt: nowIso()
  }

  leads.leads = [nextLead, ...(leads.leads ?? [])].slice(0, 1000)
  leads.updatedAt = nextLead.createdAt
  await writeSystemDocument('leads.json', leads)
  return nextLead
}

export async function getAnalyticsSnapshot() {
  const [analytics, bundle, models, traffic, events, leads, payments] = await Promise.all([
    readSystemDocument('analytics.json', DEFAULT_ANALYTICS),
    getContentBundle(),
    listAvailableModels(),
    readSystemDocument('traffic.json', getSystemDefault('traffic.json')),
    readSystemDocument('events.json', DEFAULT_EVENTS),
    readSystemDocument('leads.json', DEFAULT_LEADS),
    getPaymentsSnapshot()
  ])

  const pageViewEvents = (events.events ?? []).filter((entry) => entry.type === 'page_view')
  const visitorIds = new Set(pageViewEvents.map((entry) => entry.sessionId).filter(Boolean))
  const completedPayments = payments.filter((entry) => entry.status === 'completed')
  const revenue = completedPayments.reduce((sum, entry) => sum + (entry.amountCents ?? 0), 0) / 100
  const visitors = visitorIds.size
  const purchases = completedPayments.length
  const leadCount = (leads.leads ?? []).length

  return {
    ...analytics,
    visitors,
    pageViews: pageViewEvents.length,
    leads: leadCount,
    purchases,
    conversionRate: visitors > 0 ? purchases / visitors : 0,
    revenue,
    contentCounts: {
      pages: bundle.pages.length,
      blog: bundle.blog.length,
      products: bundle.products.length
    },
    traffic: {
      queuedTopics: traffic.queue?.length ?? 0,
      publishedPages: traffic.published?.length ?? 0,
      topQueuedTopic: traffic.queue?.[0] ?? null
    },
    models,
    dataSources: {
      visitors: 'content/system/events.json',
      leads: 'content/system/leads.json',
      revenue: 'content/system/payments.json'
    }
  }
}
