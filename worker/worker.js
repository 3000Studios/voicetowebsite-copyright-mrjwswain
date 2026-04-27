function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'content-type': 'application/json'
    }
  })
}

async function proxyToAdmin(request, env) {
  if (!env.ADMIN_API_ORIGIN) {
    return jsonResponse(
      {
        status: 'repo-local',
        message:
          'This worker can proxy to the local admin API when ADMIN_API_ORIGIN is configured. Use the Node server for write operations.'
      },
      501
    )
  }

  const url = new URL(request.url)
  const targetUrl = new URL(`${url.pathname}${url.search}`, env.ADMIN_API_ORIGIN)

  return fetch(targetUrl, request)
}

async function handleCheckout(request, env) {
  if (!env.STRIPE_SECRET) {
    return jsonResponse({ error: 'Stripe is not configured.' }, 501)
  }

  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(env.STRIPE_SECRET)
  const { priceId } = await request.json()
  const price = String(priceId ?? '').trim()
  if (!price) {
    return jsonResponse({ error: 'priceId is required.' }, 400)
  }

  const plan = price.toLowerCase().includes('elite') ? 'elite' : 'pro'
  const successOrigin = env.SITE_ORIGIN ?? 'https://voicetowebsite.com'
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price, quantity: 1 }],
    success_url: `${successOrigin}/success.html?plan=${encodeURIComponent(plan)}`,
    cancel_url: `${successOrigin}/pricing.html`,
    metadata: { plan }
  })

  return jsonResponse({ id: session.id, url: session.url, plan })
}

async function handleWebhook(request, env) {
  if (!env.STRIPE_SECRET || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response('Stripe webhook is not configured.', { status: 501 })
  }

  const { default: Stripe } = await import('stripe')
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
    console.info({ message: 'User upgraded', sessionId: session.id })
  }

  return new Response('ok')
}

function enforceLimit(user = {}) {
  const limits = { free: 5, pro: 100, elite: Number.POSITIVE_INFINITY }
  const plan = String(user.plan ?? 'free').trim().toLowerCase()
  const normalizedPlan = Object.prototype.hasOwnProperty.call(limits, plan) ? plan : 'free'
  const commandsUsed = Number(user.commandsUsed ?? 0)

  if (commandsUsed >= limits[normalizedPlan]) {
    return {
      blocked: true,
      error: 'PAYWALL_TRIGGERED',
      message: 'Free limit reached',
      upgrade: '/pricing.html',
      commandsUsed,
      plan: normalizedPlan
    }
  }

  return {
    blocked: false,
    commandsUsed,
    nextCommandsUsed: commandsUsed + 1,
    plan: normalizedPlan
  }
}

async function handleOrchestrator(request) {
  const payload = await request.json()
  const gate = enforceLimit(payload)

  if (gate.blocked) {
    return jsonResponse(gate, 402)
  }

  const command = String(payload.command ?? '').trim().toLowerCase()
  if (command.includes('create product')) {
    return jsonResponse({
      success: true,
      action: 'create_product',
      productSectionHtml: '<section><h2>Product</h2><p>$49</p><a href="/checkout.html"><button>Buy Now</button></a></section>',
      commandsUsed: gate.nextCommandsUsed,
      plan: gate.plan
    })
  }

  return jsonResponse({
    success: true,
    action: 'apply',
    commandsUsed: gate.nextCommandsUsed,
    plan: gate.plan
  })
}

async function handleDemo(request, env) {
  const blob = await request.arrayBuffer();
  
  try {
    // 1. Whisper Transcription
    const whisperRes = await env.AI.run("@cf/openai/whisper", {
      audio: [...new Uint8Array(blob)]
    });
    const transcript = whisperRes.text;

    // 2. Llama 3 Site Skeleton Generation
    const prompt = `Based on this voice request: "${transcript}", generate a website skeleton.
    Return a JSON object with: 
    - title: A catchy site title
    - sections: Array of 3 objects with {heading, body}
    - imagePrompt: A descriptive prompt for a hero image
    Keep it professional and high-converting.`;

    const llamaRes = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
      prompt,
      stream: false
    });
    
    // Attempt to parse JSON from Llama response (it might include markdown)
    let skeleton = llamaRes.response;
    try {
      const match = skeleton.match(/\{[\s\S]*\}/);
      if (match) skeleton = JSON.parse(match[0]);
    } catch {
      // Fallback
      skeleton = { title: "Custom AI Site", sections: [], imagePrompt: transcript };
    }

    return jsonResponse({
      success: true,
      transcript,
      skeleton
    });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/ads.txt') {
      return new Response('google.com, pub-5800977493749262, DIRECT, f08c47fec0942fa0', {
        headers: { 'content-type': 'text/plain; charset=utf-8' }
      })
    }

    if (url.pathname.startsWith('/api/')) {
      if (url.pathname === '/api/health') {
        return jsonResponse({
          status: 'AI system online',
          app: env.APP_NAME ?? 'AI System Manager',
          mode: env.API_MODE ?? 'repo-local'
        })
      }

      if (url.pathname === '/api/checkout' && request.method === 'POST') {
        return handleCheckout(request, env)
      }

      if (url.pathname === '/api/webhook' && request.method === 'POST') {
        return handleWebhook(request, env)
      }

      if (url.pathname === '/api/orchestrator' && request.method === 'POST') {
        return handleOrchestrator(request)
      }

      if (url.pathname === '/api/demo' && request.method === 'POST') {
        return handleDemo(request, env)
      }

      if (url.pathname === '/api/stripe-config') {
        return jsonResponse({ publishableKey: env.STRIPE_PUBLISHABLE_KEY ?? '' })
      }

      return proxyToAdmin(request, env)
    }

    return jsonResponse({
      status: 'AI system online',
      app: env.APP_NAME ?? 'AI System Manager',
      siteOrigin: env.SITE_ORIGIN ?? null
    })
  }
}
