import { chromium } from "playwright";

const url = process.argv[2] || "https://voicetowebsite.com";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

const errors = [];
const pageErrors = [];
const consoles = [];
const failedRequests = [];

page.on("pageerror", (e) => pageErrors.push(`${e.name}: ${e.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warning") {
    consoles.push(`[${msg.type()}] ${msg.text()}`);
  }
});
page.on("requestfailed", (req) => failedRequests.push(`${req.url()} -> ${req.failure()?.errorText}`));

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
} catch (e) {
  errors.push(`navigation: ${e.message}`);
}

await page.waitForTimeout(2000);

const rootHtml = await page.evaluate(() => document.getElementById("root")?.innerHTML?.length || 0);
const bootStillThere = await page.evaluate(() => !!document.getElementById("boot"));
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));

console.log("=== DIAGNOSIS ===");
console.log(`URL: ${url}`);
console.log(`#root content length: ${rootHtml}`);
console.log(`#boot still mounted: ${bootStillThere}`);
console.log(`Body text (first 500 chars): ${bodyText}`);
console.log(`\nPage errors (${pageErrors.length}):`);
pageErrors.forEach((e) => console.log("  -", e));
console.log(`\nConsole errors/warnings (${consoles.length}):`);
consoles.forEach((e) => console.log("  -", e));
console.log(`\nFailed requests (${failedRequests.length}):`);
failedRequests.forEach((e) => console.log("  -", e));
console.log(`\nOther errors (${errors.length}):`);
errors.forEach((e) => console.log("  -", e));

await browser.close();
