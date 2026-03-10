#!/usr/bin/env node
/**
 * Apply Cloudflare zone settings for load speed and smooth site.
 * Uses CLOUD_FLARE_API_TOKEN and CF_ZONE_ID from environment or .env.
 *
 * Required token permissions: Zone > Zone Settings > Read, Edit
 *
 * Run: npm run apply:zone-settings (with vars in .env or shell)
 */

import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  }
}

const BASE = "https://api.cloudflare.com/client/v4";

const token =
  process.env.CLOUD_FLARE_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
const zoneId = process.env.CF_ZONE_ID || process.env.ZONE_ID;

if (!token) {
  console.error(
    "Missing token. Set CLOUD_FLARE_API_TOKEN or CLOUDFLARE_API_TOKEN."
  );
  process.exit(1);
}
if (!zoneId) {
  console.error("Missing zone ID. Set CF_ZONE_ID or ZONE_ID.");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

async function patchSetting(name, value) {
  const url = `${BASE}/zones/${zoneId}/settings/${name}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ value }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data, name };
}

async function main() {
  const results = [];

  // Speed → Optimization
  results.push(
    await patchSetting("minify", { css: "on", html: "on", js: "on" })
  );
  results.push(await patchSetting("brotli", "on"));
  results.push(await patchSetting("early_hints", "on"));
  results.push(await patchSetting("rocket_loader", "off"));

  // Speed → Polish (images)
  results.push(await patchSetting("polish", "lossless"));

  // Caching
  results.push(await patchSetting("cache_level", "standard"));
  // 0 = Respect Existing Headers
  results.push(await patchSetting("browser_cache_ttl", 0));

  // Network
  results.push(await patchSetting("http2", "on"));
  results.push(await patchSetting("http3", "on"));
  results.push(await patchSetting("zero_rtt", "on"));

  // SSL/TLS (strict = Full strict)
  results.push(await patchSetting("ssl", "full"));
  results.push(await patchSetting("always_use_https", "on"));

  const failed = results.filter((r) => !r.ok);
  const ok = results.filter((r) => r.ok);

  for (const r of ok) {
    console.log(`OK ${r.name} (${r.status})`);
  }
  for (const r of failed) {
    console.error(
      `FAIL ${r.name} (${r.status})`,
      r.data?.errors?.[0]?.message || r.data?.errors || ""
    );
  }

  if (failed.length > 0) {
    console.error(
      "\nSome settings may not exist on your plan or use different IDs. Apply those in Dashboard: Cloudflare → your domain → Speed / Caching / Network / SSL."
    );
    process.exit(1);
  }

  console.log(
    "\nZone settings applied. Build caching must be enabled in Workers & Pages → voicetowebsite → Builds (see CLOUDFLARE_BUILDS.md)."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
