import { timingSafeEqual } from "../../../functions/adminAuth.js";

export function isOwner(request, env) {
  const ownerKey = request.headers.get("X-VTW-OWNER-KEY");
  if (!ownerKey) return false;

  const validKey = env.OWNER_KEY;
  if (!validKey) return false;

  // Uses constant-time comparison to prevent timing attacks
  return timingSafeEqual(ownerKey, validKey);
}

export function authResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
