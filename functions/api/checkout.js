import Stripe from 'stripe'
import { errorJson, json, readJsonBody } from '../_lib/http.js'

function resolvePlan(priceId, env) {
  if (priceId === env?.STRIPE_PRICE_ELITE || String(priceId).toLowerCase().includes('elite')) {
    return 'elite'
  }
  return 'pro'
}

export async function onRequestPost({ request, env }) {
  if (!env?.STRIPE_SECRET) {
    return errorJson('Stripe is not configured.', 501)
  }

  const body = await readJsonBody(request)
  const priceId = String(body?.priceId ?? '').trim()
  if (!priceId) {
    return errorJson('priceId is required.', 400)
  }

  const stripe = new Stripe(env.STRIPE_SECRET)
  const plan = resolvePlan(priceId, env)
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `https://voicetowebsite.com/success.html?plan=${encodeURIComponent(plan)}`,
    cancel_url: 'https://voicetowebsite.com/pricing.html',
    metadata: { plan }
  })

  return json({ id: session.id, url: session.url, plan })
}
