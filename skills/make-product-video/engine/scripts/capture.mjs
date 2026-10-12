// Gather real material about a product from its web page: screenshots, the share image, and the page's own words.
//   npm run capture -- https://example.com [--name acme] [--shots 3]
// Writes PNGs to public/assets/ and prints a JSON summary. Use only pages and images you have the right to use.
import {mkdir, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {chromium} from "playwright";

const args = process.argv.slice(2);
const url = args.find((arg) => /^https?:\/\//.test(arg));
const option = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
if (!url) { console.error("usage: npm run capture -- <https-url> [--name product] [--shots 3]"); process.exit(1); }

const name = (option("name") ?? new URL(url).hostname.replace(/^www\./, "").split(".")[0]).toLowerCase().replace(/[^a-z0-9]+/g, "-");
const shots = Math.min(5, Math.max(1, Number(option("shots") ?? 3)));
const outDir = resolve("public", "assets");
await mkdir(outDir, {recursive: true});

const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 1440, height: 900}, deviceScaleFactor: 1});
try { await page.goto(url, {waitUntil: "networkidle", timeout: 30000}); }
catch { await page.goto(url, {waitUntil: "load", timeout: 30000}); }
await page.waitForTimeout(1200);

const info = await page.evaluate(() => {
  const meta = (selector) => document.querySelector(selector)?.getAttribute("content") ?? null;
  const text = (selector, max) => [...document.querySelectorAll(selector)].map((el) => el.textContent.replace(/\s+/g, " ").trim()).filter((t) => t && t.length < 140).slice(0, max);
  const abs = (href) => { if (!href || href.startsWith("data:")) return null; try { return new URL(href, location.href).href; } catch { return null; } };
  return {
    title: document.title,
    description: meta('meta[name="description"]') ?? meta('meta[property="og:description"]'),
    themeColor: meta('meta[name="theme-color"]'),
    ogImage: abs(meta('meta[property="og:image"]') ?? meta('meta[name="twitter:image"]')),
    icon: abs(document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href") ?? document.querySelector('link[rel~="icon"]')?.getAttribute("href")),
    headings: {h1: text("h1", 4), h2: text("h2", 12), h3: text("h3", 16)},
    paragraphs: text("main p, section p, p", 8),
    navigation: text("nav a", 14),
    buttons: text("a[class*=btn], a[class*=button], button", 8)
  };
});

const files = [];
const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
for (let i = 0; i < shots; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.min(i * 800, Math.max(0, scrollHeight - 900)));
  await page.waitForTimeout(700);
  const file = `${name}-shot-${i + 1}.png`;
  await page.screenshot({path: resolve(outDir, file)});
  files.push(`./assets/${file}`);
}
await browser.close();

for (const [key, source] of [["share", info.ogImage], ["icon", info.icon]]) {
  if (!source) continue;
  try {
    const response = await fetch(source);
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !/image\/(png|jpe?g|webp)/.test(type)) continue;
    const extension = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    const file = `${name}-${key}.${extension}`;
    await writeFile(resolve(outDir, file), Buffer.from(await response.arrayBuffer()));
    files.push(`./assets/${file}`);
  } catch { /* optional */ }
}

console.log(JSON.stringify({url, ...info, savedImages: files}, null, 2));
