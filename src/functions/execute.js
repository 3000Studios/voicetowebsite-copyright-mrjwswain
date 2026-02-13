export async function handleExecuteRequest({ request, env }) {
  const url = new URL(request.url);
  const body = await request.json();
  const { action, params } = body;

  const ownerKey = request.headers.get("X-VTW-OWNER-KEY");
  const isValidOwner = ownerKey && ownerKey === env.OWNER_KEY; // Hash comparison recommended for production

  if (!isValidOwner) {
    // Check for admin session/cookie if not owner
    // For now, allow owner key as primary bypass
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const id = env.BOT_HUB.idFromName("global");
  const botHub = env.BOT_HUB.get(id);

  // Forward to Durable Object
  const botHubUrl = new URL(request.url);
  botHubUrl.pathname = "/";
  botHubUrl.searchParams.set("action", action);

  const response = await botHub.fetch(
    new Request(botHubUrl, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(params || {}),
    })
  );

  return response;
}
