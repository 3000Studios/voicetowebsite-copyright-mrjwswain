export interface Env {
  DB: D1Database;
  ORDERS_KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async ({ request, next, env }) => {
  const url = new URL(request.url);
  
  // 1. Simple Origin Verification for POST requests
  if (request.method === 'POST') {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    // In production, ensure the request comes from the same site
    if (origin && !origin.includes('voicetowebsite.com') && !origin.includes('localhost')) {
      return new Response(JSON.stringify({ error: 'Unauthorized origin' }), { 
        status: 403, 
        headers: { 'content-type': 'application/json' } 
      });
    }
  }

  // 2. Global JSON error wrapper
  try {
    const response = await next();
    
    // Add security headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    newHeaders.set('X-Frame-Options', 'DENY');
    newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  } catch (err) {
    console.error('Middleware caught error:', err);
    return new Response(JSON.stringify({ 
      error: 'Internal system error', 
      detail: err instanceof Error ? err.message : 'Unknown' 
    }), { 
      status: 500, 
      headers: { 'content-type': 'application/json' } 
    });
  }
};
