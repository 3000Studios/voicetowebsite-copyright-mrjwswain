export interface Env {
  DB: D1Database;
  ORDERS_KV: KVNamespace;
  RATE_LIMIT: any; // Durable Object for rate limiting
}

// Rate limiting store (simple in-memory for edge functions)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000,
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

function getClientIP(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    "unknown"
  );
}

export const onRequest: PagesFunction<Env> = async ({ request, next, env }) => {
  const url = new URL(request.url);
  const clientIP = getClientIP(request);

  // 1. Rate Limiting - 100 requests per 15 minutes per IP
  if (!checkRateLimit(clientIP, 100, 15 * 60 * 1000)) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        retryAfter: 900,
      }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "Retry-After": "900",
        },
      },
    );
  }

  // 2. Stricter rate limiting for mutation endpoints
  if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    const endpointKey = `${clientIP}:${url.pathname}`;
    if (!checkRateLimit(endpointKey, 20, 60 * 1000)) {
      // 20 requests per minute
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          retryAfter: 60,
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            "Retry-After": "60",
          },
        },
      );
    }
  }

  // 3. Origin Verification for state-changing requests
  if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const allowedOrigins = [
      "https://voicetowebsite.com",
      "https://www.voicetowebsite.com",
      "https://*.voicetowebsite.pages.dev",
      "http://localhost:3000",
      "http://localhost:5173",
    ];

    const isAllowed =
      !origin ||
      allowedOrigins.some((allowed) => {
        if (allowed.includes("*")) {
          const regex = new RegExp(allowed.replace("*", ".*"));
          return regex.test(origin);
        }
        return origin === allowed;
      });

    if (!isAllowed) {
      return new Response(JSON.stringify({ error: "Unauthorized origin" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // 4. Global JSON error wrapper with security headers
  try {
    const response = await next();

    // Add comprehensive security headers
    const newHeaders = new Headers(response.headers);

    // Prevent MIME type sniffing
    newHeaders.set("X-Content-Type-Options", "nosniff");

    // Prevent clickjacking
    newHeaders.set("X-Frame-Options", "DENY");

    // XSS Protection
    newHeaders.set("X-XSS-Protection", "1; mode=block");

    // Referrer policy
    newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Content Security Policy
    newHeaders.set(
      "Content-Security-Policy",
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://js.stripe.com https://accounts.google.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' data: https: blob:; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co; " +
        "frame-src https://js.stripe.com https://hooks.stripe.com; " +
        "media-src 'self' https:;",
    );

    // Permissions Policy
    newHeaders.set(
      "Permissions-Policy",
      "camera=(), microphone=(self), geolocation=(), payment=(self), usb=()",
    );

    // HSTS (HTTPS Strict Transport Security)
    newHeaders.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );

    // Remove server fingerprinting
    newHeaders.delete("Server");
    newHeaders.delete("X-Powered-By");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (err) {
    console.error("Middleware caught error:", err);

    // Sanitize error messages to prevent info leakage
    const isDev = url.hostname === "localhost";
    const safeError = isDev
      ? err instanceof Error
        ? err.message
        : "Unknown error"
      : "Internal system error";

    return new Response(
      JSON.stringify({
        error: "Internal system error",
        ...(isDev && { detail: safeError }),
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
};
