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
  for (const route of [["home", "https://voicetowebsite.com"], ["pricing", "https://voicetowebsite.com/pricing"]]) {
    await page.goto(route[1], { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1200);
    // Scroll through the whole page so Framer Motion whileInView reveals fire
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    const step = viewport.height * 0.6;
    for (let y = 0; y < h; y += step) {
      await page.evaluate((py) => window.scrollTo(0, py), y);
      await page.waitForTimeout(180);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/${name}-${route[0]}.png`, fullPage: true });
    console.log(`✓ ${out}/${name}-${route[0]}.png`);
  }

  await ctx.close();
}

await browser.close();
