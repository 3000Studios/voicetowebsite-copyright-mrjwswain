import {
  Env,
  json,
} from "./_shared";
import { publishNextPost } from "./_publisher";

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  if (!context.env.DB) return json({ error: "DB binding not configured" }, { status: 500 });

  const token = context.request.headers.get("x-blog-publish-token") || "";
  if (!context.env.BLOG_PUBLISH_TOKEN || token !== context.env.BLOG_PUBLISH_TOKEN) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await publishNextPost(context.env);
  if (result.status === "failed") return json({ error: result.reason }, { status: 422 });
  return json(result);
};
