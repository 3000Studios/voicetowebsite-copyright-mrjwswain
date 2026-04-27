export async function onRequestGet(context) {
  const { env } = context;

  if (!env.DATA_BUCKET) {
    return new Response(JSON.stringify({ error: "R2 bucket not bound." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // List objects in the voicetowebsite bucket
    const options = { limit: 50, delimiter: '/' };
    const objects = await env.DATA_BUCKET.list(options);

    const history = objects.objects.map(obj => ({
      key: obj.key,
      uploaded: obj.uploaded,
      size: `${(obj.size / 1024).toFixed(1)} KB`
    }));

    return new Response(JSON.stringify(history), {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
