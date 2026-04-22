import { json } from '../_lib/http.js'

export async function onRequestGet({ env }) {
  return json({
    publishableKey: env.STRIPE_PUBLISHABLE_KEY ?? ''
  })
}
