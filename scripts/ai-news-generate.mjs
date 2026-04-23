import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "uploads", "voicetowebsite.com", "src", "content", "ai-news");
const INDEX_PATH = path.join(CONTENT_DIR, "index.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

function isoHourKey(date) {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d.toISOString().replace(/:00\.000Z$/, "Z");
}

function generateStory(now) {
  const publishedAt = new Date(now).toISOString();
  const hourKey = isoHourKey(now);
  const theme = [
    "SEO compounding strategies",
    "conversion UX patterns",
    "subscription pricing psychology",
    "AI automation playbooks",
    "Cloudflare performance + analytics",
  ][Math.floor(Math.random() * 5)];

  const title = `AI News Briefing: ${theme}`;
  const slug = slugify(`${hourKey}-${title}`);

  return {
    slug,
    title,
    description:
      "A short, SEO-friendly briefing for builders: practical moves you can ship today to grow traffic, subscribers, and revenue.",
    keywords: [
      "AI news",
      "AI website builder",
      "voice to website",
      "SEO",
      "subscriptions",
      "Cloudflare",
      "conversion",
      "landing page",
    ],
    publishedAt,
    heroVideo: "/input_file_0.mp4",
    heroImage:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1600&auto=format&fit=crop",
    sections: [
      {
        heading: "Today’s Signal",
        body:
          `Builders win by publishing consistently. This briefing focuses on ${theme} and how to turn it into a measurable growth loop.`,
      },
      {
        heading: "What To Ship Next",
        body:
          "Pick one improvement and ship it: tighten the hero headline, strengthen the pricing page, add internal links, and keep page speed high. Compounding beats perfection.",
      },
      {
        heading: "SEO Checklist (Fast)",
        body:
          "Use a unique title + description, keep keyword density natural, add structured sections, include internal links to Pricing and Dashboard, and publish a clean index page that’s crawlable.",
      },
    ],
  };
}

function main() {
  if (!fs.existsSync(INDEX_PATH)) {
    throw new Error(`Missing index: ${INDEX_PATH}`);
  }
  const index = readJson(INDEX_PATH);
  const items = Array.isArray(index.items) ? index.items : [];

  const story = generateStory(Date.now());
  const storyPath = path.join(CONTENT_DIR, `${story.slug}.json`);

  if (fs.existsSync(storyPath)) {
    // already generated this hour in a rerun; exit clean
    return;
  }

  writeJson(storyPath, story);
  const nextItems = [
    {
      slug: story.slug,
      title: story.title,
      description: story.description,
      keywords: story.keywords,
      publishedAt: story.publishedAt,
      heroVideo: story.heroVideo,
      heroImage: story.heroImage,
    },
    ...items,
  ].slice(0, 500);

  writeJson(INDEX_PATH, { updatedAt: new Date().toISOString(), items: nextItems });
}

main();

