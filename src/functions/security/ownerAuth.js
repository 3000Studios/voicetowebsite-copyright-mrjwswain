export function isOwner(request, env) {
  const ownerKey = request.headers.get("X-VTW-OWNER-KEY");
  if (!ownerKey) return false;

  const validKey = env.OWNER_KEY;
  if (!validKey) return false;

  // Simple equality for now, could use crypto.subtle.timingSafeEqual for better security
  return ownerKey === validKey;
}

export function authResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
