import {
  capturePayPalOrder,
  createPayPalCheckout,
  createStripeCheckout,
  getCommerceSnapshot,
  verifyStripeCheckoutSession
} from '../services/commerceService.js'
import { getAnalyticsSnapshot, recordLead, recordSiteEvent } from '../services/analyticsService.js'

function getOrigin(request) {
  const originHeader = request.headers.origin
  if (typeof originHeader === 'string' && originHeader.length > 0) {
    return originHeader
  }

  return `${request.protocol}://${request.get('host')}`
}

export async function getPublicSiteSnapshot(_request, response, next) {
  try {
    const [analytics, commerce] = await Promise.all([getAnalyticsSnapshot(), getCommerceSnapshot()])
    response.json({
      analytics,
      commerce
    })
  } catch (error) {
    next(error)
  }
}

export async function postSiteEvent(request, response, next) {
  try {
    const event = await recordSiteEvent(request.body ?? {})
    response.json({
      ok: true,
      event
    })
  } catch (error) {
    next(error)
  }
}

export async function postLeadCapture(request, response, next) {
  try {
    const lead = await recordLead(request.body ?? {})
    response.status(201).json({
      ok: true,
      lead
    })
  } catch (error) {
    next(error)
  }
}

export async function postStripeCheckout(request, response, next) {
  try {
    const checkout = await createStripeCheckout({
      slug: request.body?.offerSlug,
      origin: getOrigin(request)
    })
    response.json(checkout)
  } catch (error) {
    next(error)
  }
}

export async function postPayPalCheckout(request, response, next) {
  try {
    const checkout = await createPayPalCheckout({
      slug: request.body?.offerSlug,
      origin: getOrigin(request)
    })
    response.json(checkout)
  } catch (error) {
    next(error)
  }
}

export async function getStripeCheckoutSuccess(request, response, next) {
  try {
    const sessionId = typeof request.query.session_id === 'string' ? request.query.session_id : ''
    const result = await verifyStripeCheckoutSession(sessionId)
    response.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getPayPalCheckoutSuccess(request, response, next) {
  try {
    const orderId = typeof request.query.token === 'string' ? request.query.token : ''
    const result = await capturePayPalOrder(orderId)
    response.json(result)
  } catch (error) {
    next(error)
  }
}
