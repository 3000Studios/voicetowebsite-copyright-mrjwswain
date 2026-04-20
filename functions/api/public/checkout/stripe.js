import { errorJson, json, readJsonBody } from '../../../_lib/http.js'
import { getOfferBySlug } from '../../../_lib/offers.js'

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return errorJson('Method not allowed.', 405)
  }

  const body = await readJsonBody(context.request)
  const slug = String(body?.offerSlug ?? '').trim()

  if (!slug) {
    return errorJson('Offer slug is required.', 400)
  }

  const offer = getOfferBySlug(slug, context.env ?? {})
  if (!offer) {
    return errorJson('Unknown offer.', 404)
  }

  if (!offer.stripePaymentLink) {
    return errorJson('Stripe checkout is not configured.', 501)
  }

  return json({
    ok: true,
    provider: 'stripe',
    url: offer.stripePaymentLink
  })
}
