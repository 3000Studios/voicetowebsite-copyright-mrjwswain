import { chromium } from "playwright";

const url = process.argv[2] || "https://voicetowebsite.com/pricing";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(1500);
const path = await page.evaluate(() => window.location.pathname);
const title = await page.title();
const h1 = await page.evaluate(() => document.querySelector("h1")?.innerText || "");
const snippet = await page.evaluate(() => document.body.innerText.slice(0, 600));
console.log("URL :", url);
console.log("Path:", path);
console.log("Title:", title);
console.log("First H1:", h1);
console.log("Body start:", snippet);
await browser.close();
