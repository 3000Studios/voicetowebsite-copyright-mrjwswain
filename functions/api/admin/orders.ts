export interface Env {
  DB: D1Database;
  ADMIN_API_TOKEN?: string;
  OWNER_ADMIN_EMAIL?: string;
}

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      ...(init.headers || {}),
    },
  });
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const authHeader = context.request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
  const ownerHeader = (context.request.headers.get("x-owner-email") || "")
    .trim()
    .toLowerCase();
  const expectedOwner = (context.env.OWNER_ADMIN_EMAIL || "").trim().toLowerCase();
  const tokenOk = !!context.env.ADMIN_API_TOKEN && token === context.env.ADMIN_API_TOKEN;
  const ownerOk = !!expectedOwner && ownerHeader === expectedOwner;
  if (!tokenOk && !ownerOk) {
    return json({ error: "Unauthorized", success: false }, { status: 401 });
  }

  if (!context.env.DB) {
    console.error("DB binding missing");
    return json({ error: "Database binding not configured on server", success: false }, { status: 500 });
  }

  try {
    const url = new URL(context.request.url);
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") || "50")));
    const status = (url.searchParams.get("status") || "").trim();

    const stmt =
      status.length > 0
        ? context.env.DB.prepare(
            `SELECT id, created_at, email, plan, cadence, launch_discount, status, site_url, error
             FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT ?`
          ).bind(status, limit)
        : context.env.DB.prepare(
            `SELECT id, created_at, email, plan, cadence, launch_discount, status, site_url, error
             FROM orders ORDER BY created_at DESC LIMIT ?`
          ).bind(limit);

    const res = await stmt.all();
    return json({ 
      rows: res.results || [], 
      success: true,
      count: res.results?.length || 0
    });
  } catch (err: any) {
    console.error("Database query error:", err.message);
    return json({ 
      error: "Failed to retrieve orders from database", 
      message: err.message,
      success: false 
    }, { status: 500 });
  }
};

