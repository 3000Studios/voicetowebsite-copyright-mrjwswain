export interface Env {
  STRIPE_SECRET_KEY: string;
}

const STRIPE_API = "https://api.stripe.com/v1";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const body = (await context.request.json()) as { session_id?: string };
    const sessionId = body.session_id?.trim();
    if (!sessionId) return jsonResponse({ error: "Missing session_id" }, { status: 400 });

    const res = await fetch(`${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${context.env.STRIPE_SECRET_KEY}` },
    });

    const session = (await res.json()) as any;
    if (!res.ok) return jsonResponse({ error: "Unable to verify session" }, { status: 400 });

    const status = session?.status;
    const paymentStatus = session?.payment_status;
    const mode = session?.mode;
    const email = session?.customer_details?.email || session?.customer_email || null;
    const plan = session?.metadata?.plan || null;

    if (!email || !plan) return jsonResponse({ error: "Missing email/plan" }, { status: 400 });

    // Stripe marks subscription sessions as paid when the first invoice is paid.
    const ok = status === "complete" && (paymentStatus === "paid" || mode === "subscription");
    if (!ok) return jsonResponse({ error: "Session not complete" }, { status: 400 });

    return jsonResponse({ ok: true, email, plan, mode, payment_status: paymentStatus, status });
  } catch {
    return jsonResponse({ error: "Invalid request" }, { status: 400 });
  }
};

