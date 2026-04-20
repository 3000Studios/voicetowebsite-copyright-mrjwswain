import { errorJson, json, readJsonBody } from '../../../_lib/http.js'
import { isValidEmail, upsertCustomerAccess } from '../../../_lib/customers.js'
import { getOfferBySlug } from '../../../_lib/offers.js'

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return errorJson('Method not allowed.', 405)
  }

  const body = await readJsonBody(context.request)
  const slug = String(body?.offerSlug ?? '').trim()
  const customerEmail = String(body?.customerEmail ?? '').trim().toLowerCase()

  if (!slug) {
    return errorJson('Offer slug is required.', 400)
  }

  const offer = getOfferBySlug(slug, context.env ?? {})
  if (!offer) {
    return errorJson('Unknown offer.', 404)
  }

  if (!offer.paypalPaymentLink) {
    return errorJson('PayPal checkout is not configured.', 501)
  }

  let customer = null
  if (isValidEmail(customerEmail) && context.env?.DATA_BUCKET) {
    customer = await upsertCustomerAccess(context.env.DATA_BUCKET, {
      email: customerEmail,
      offerSlug: slug,
      provider: 'paypal',
      paymentLink: offer.paypalPaymentLink
    })
  }

  return json({
    ok: true,
    provider: 'paypal',
    url: offer.paypalPaymentLink,
    accessToken: customer?.accessToken ?? null,
    dashboardUrl: customer?.dashboardUrl ?? null,
    account: customer?.account ?? null
  })
}
