export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    status: "ok",
    brand: "VoiceToWebsite.com"
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
