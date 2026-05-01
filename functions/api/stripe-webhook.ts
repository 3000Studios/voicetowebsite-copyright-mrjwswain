export interface Env {
  DB: D1Database;
  STRIPE_WEBHOOK_TOKEN?: string;
}

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...(init.headers || {}) },
  });
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  if (!context.env.DB) return json({ error: "DB binding not configured" }, { status: 500 });

  const token = context.request.headers.get("x-webhook-token") || "";
  if (!context.env.STRIPE_WEBHOOK_TOKEN || token !== context.env.STRIPE_WEBHOOK_TOKEN) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = (await context.request.json()) as {
    type?: string;
    data?: { object?: { id?: string; payment_status?: string; status?: string } };
  };
  const session = event.data?.object;
  if (!session?.id) return json({ ok: true, ignored: true });

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await context.env.DB.prepare(
      "UPDATE orders SET status = 'paid', error = NULL WHERE stripe_session_id = ?",
    ).bind(session.id).run();
  }

  return json({ ok: true });
};

