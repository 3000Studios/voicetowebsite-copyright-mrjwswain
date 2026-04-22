import Stripe from 'stripe'
import { errorJson } from '../_lib/http.js'

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET || !env.STRIPE_WEBHOOK_SECRET) {
    return errorJson('Stripe webhook is not configured.', 501)
  }

  const stripe = new Stripe(env.STRIPE_SECRET)
  const signature = request.headers.get('stripe-signature')
  const body = await request.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    return new Response(`Webhook error: ${error.message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    console.log('User upgraded:', session.id)
  }

  return new Response('ok', { status: 200 })
}
