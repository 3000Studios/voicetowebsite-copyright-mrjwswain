export interface Env {
  STRIPE_SECRET_KEY?: string;
  STRIPE_SECRET?: string; // Support for drift from root config
}

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*", // Support cross-origin if needed
      ...(init.headers || {}),
    },
  });
}

const STRIPE_SESSION_URL_PREFIX = "https://api.stripe.com/v1/checkout/sessions/";

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const url = new URL(context.request.url);
  const sessionId = (url.searchParams.get("session_id") || "").trim();
  
  if (!sessionId) {
    return json({ 
      error: "Missing session_id",
      success: false,
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }

  const secret = context.env.STRIPE_SECRET_KEY || context.env.STRIPE_SECRET;
  if (!secret) {
    console.error("Stripe secret not found in environment");
    return json({ 
      error: "Stripe configuration missing on server", 
      success: false 
    }, { status: 500 });
  }

  try {
    const stripeUrl = `${STRIPE_SESSION_URL_PREFIX}${encodeURIComponent(sessionId)}?expand[]=line_items`;
    const res = await fetch(stripeUrl, {
      headers: { Authorization: `Bearer ${secret}` },
    });

    const data = (await res.json()) as any;
    
    if (!res.ok) {
      console.error("Stripe API error:", data?.error?.message);
      return json({ 
        error: data?.error?.message || "Stripe session lookup failed",
        success: false 
      }, { status: res.status });
    }

    const paid = data?.payment_status === "paid" || data?.status === "complete" || data?.mode === "subscription";

    return json({
      id: data?.id,
      mode: data?.mode,
      status: data?.status,
      payment_status: data?.payment_status,
      customer_email: data?.customer_details?.email || data?.customer_email || null,
      metadata: data?.metadata || {},
      paid,
      success: true
    });
  } catch (err: any) {
    console.error("Internal error in checkout-session:", err.message);
    return json({ 
      error: "Internal server error during session verification",
      success: false 
    }, { status: 500 });
  }
};


