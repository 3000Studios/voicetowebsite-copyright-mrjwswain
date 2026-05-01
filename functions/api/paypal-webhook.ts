export interface Env {
  DB: D1Database;
  PAYPAL_WEBHOOK_TOKEN?: string;
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
  if (!context.env.PAYPAL_WEBHOOK_TOKEN || token !== context.env.PAYPAL_WEBHOOK_TOKEN) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await context.request.json()) as {
    event_type?: string;
    resource?: { custom_id?: string };
  };
  if (payload.event_type?.includes("PAYMENT.SALE.COMPLETED") && payload.resource?.custom_id) {
    await context.env.DB.prepare(
      "UPDATE orders SET status = 'paid', error = NULL WHERE id = ?",
    ).bind(payload.resource.custom_id).run();
  }

  return json({ ok: true });
};

