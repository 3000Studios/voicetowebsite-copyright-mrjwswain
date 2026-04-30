export interface Env {
  SITES_BUCKET: R2Bucket;
}

export const onRequestGet = async (context: { params: { id?: string }; env: Env }) => {
  if (!context.env.SITES_BUCKET) return new Response("SITES_BUCKET binding not configured", { status: 500 });
  const id = (context.params.id || "").trim();
  if (!id) return new Response("Missing id", { status: 400 });

  const key = `sites/${id}/index.html`;
  const obj = await context.env.SITES_BUCKET.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "public, max-age=60");
  return new Response(obj.body, { headers });
};
