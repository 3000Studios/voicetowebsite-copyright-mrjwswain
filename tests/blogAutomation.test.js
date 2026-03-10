import { describe, expect, it } from "vitest";
import {
  BLOG_CONFIG_PATH,
  generateBlogFeedUpdate,
  storeBlogFeed,
} from "../functions/blogAutomation.js";
import worker from "../worker.js";

const staticFeed = {
  heroTitle: "VoiceToWebsite Blog",
  heroSubtitle: "Static fallback feed",
  generatedAt: "2026-03-10T00:00:00.000Z",
  refreshHours: 3,
  posts: [
    {
      id: "existing-post",
      slug: "existing-post",
      title: "Existing post",
      excerpt: "Existing excerpt",
      date: "2026-03-09T00:00:00.000Z",
      readTime: "5 min read",
      imageUrl: "https://example.com/image.jpg",
      imageAlt: "Existing image",
      tags: ["existing"],
      url: "/blog#existing-post",
    },
  ],
};

const mockAssets = {
  async fetch(request) {
    const url = new URL(typeof request === "string" ? request : request.url);
    if (url.pathname !== BLOG_CONFIG_PATH) {
      return new Response("not found", { status: 404 });
    }
    return new Response(JSON.stringify(staticFeed), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  },
};

class MemoryKv {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async put(key, value) {
    this.store.set(key, value);
  }
}

describe("blog automation", () => {
  it("builds a normalized blog update from the runtime feed", async () => {
    const now = new Date("2026-03-10T03:00:00.000Z");
    const nextFeed = await generateBlogFeedUpdate({
      env: {},
      assets: mockAssets,
      now,
    });

    expect(nextFeed.refreshHours).toBe(3);
    expect(nextFeed.generatedAt).toBe(now.toISOString());
    expect(nextFeed.posts[0].date).toBe(now.toISOString());
    expect(nextFeed.posts[0].slug).toMatch(/2026-03-10t03/i);
    expect(nextFeed.posts).toHaveLength(2);
  });

  it("stores the generated feed in KV and serves it through the worker", async () => {
    const env = {
      KV: new MemoryKv(),
      ASSETS: mockAssets,
      NODE_ENV: "test",
    };
    const now = new Date("2026-03-10T06:00:00.000Z");
    const nextFeed = await generateBlogFeedUpdate({
      env,
      assets: env.ASSETS,
      now,
    });

    await storeBlogFeed(env, nextFeed);
    await worker.scheduled({ scheduledTime: now.getTime() }, env, {});

    const response = await worker.fetch(
      new Request(`https://example.com${BLOG_CONFIG_PATH}`),
      env,
      {}
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.refreshHours).toBe(3);
    expect(payload.posts[0].slug).toMatch(/2026-03-10t06/i);
  });
});
