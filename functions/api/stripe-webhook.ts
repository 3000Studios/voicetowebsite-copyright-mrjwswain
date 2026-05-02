export interface Env {
  DB: D1Database;
  STRIPE_WEBHOOK_SECRET?: string;
}

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...(init.headers || {}) },
  });
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  if (!context.env.DB) return json({ error: "DB binding not configured" }, { status: 500 });
  if (!context.env.STRIPE_WEBHOOK_SECRET) {
    return json({ error: "Stripe webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await context.request.text();
  const signature = context.request.headers.get("stripe-signature") || "";
  const verified = await verifyStripeSignature(rawBody, signature, context.env.STRIPE_WEBHOOK_SECRET);
  if (!verified) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
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

function parseStripeSignature(header: string) {
  return header.split(",").reduce(
    (acc, part) => {
      const [key, value] = part.split("=");
      if (key === "t") acc.timestamp = value;
      if (key === "v1") acc.signatures.push(value);
      return acc;
    },
    { timestamp: "", signatures: [] as string[] },
  );
}

async function verifyStripeSignature(rawBody: string, header: string, secret: string) {
  const parsed = parseStripeSignature(header);
  if (!parsed.timestamp || !parsed.signatures.length) return false;

  const timestamp = Number(parsed.timestamp);
  if (!Number.isFinite(timestamp)) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - timestamp);
  if (ageSeconds > 300) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signedPayload = `${parsed.timestamp}.${rawBody}`;
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expected = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return parsed.signatures.some((signature) => timingSafeEqual(signature, expected));
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
