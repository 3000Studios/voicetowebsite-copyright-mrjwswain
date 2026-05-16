import { chromium } from "playwright";
import fs from "fs";

const out = "diag-screenshots";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();

for (const [name, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  const ctx = await browser.newContext({ viewport, userAgent: viewport.width < 500 ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" : undefined });
  const page = await ctx.newPage();
  await page.goto("https://voicetowebsite.com", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${name}-home.png`, fullPage: true });
  console.log(`✓ ${out}/${name}-home.png`);

  await page.goto("https://voicetowebsite.com/pricing", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${name}-pricing.png`, fullPage: true });
  console.log(`✓ ${out}/${name}-pricing.png`);

  await ctx.close();
}

await browser.close();
