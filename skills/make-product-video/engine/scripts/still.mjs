// Render stills straight from the built composition: seconds instead of minutes.
//   npm run still                  -> one still per scene (at 60% of each scene) + contact sheet
//   npm run still -- --time 12.5   -> a single still at 12.5 seconds
//   npm run still -- --at 0.35     -> sample 35% into each scene
// Run `npm run build` first (the npm script does this for you).
import {execFileSync} from "node:child_process";
import {existsSync} from "node:fs";
import {mkdir, readFile, rm} from "node:fs/promises";
import {createRequire} from "node:module";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const config = JSON.parse(await readFile(resolve("video.config.json"), "utf8"));
const args = process.argv.slice(2);
const value = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? Number(args[i + 1]) : undefined; };
const at = value("at") ?? 0.6;
const single = value("time");

const times = [];
if (single !== undefined) times.push({name: `t-${single.toFixed(2)}`, time: single, label: `${single}s`});
else {
  let cursor = 0;
  config.scenes.forEach((scene, i) => {
    times.push({name: `scene-${String(i + 1).padStart(2, "0")}`, time: cursor + scene.duration * at, label: `${scene.motif}, ${scene.chapter}`});
    cursor += scene.duration;
  });
}

const entry = resolve("dist/index.html");
if (!existsSync(entry)) { console.error("dist/index.html is missing. Run npm run build first."); process.exit(1); }

const outDir = resolve("output", "stills");
await rm(outDir, {recursive: true, force: true});
await mkdir(outDir, {recursive: true});

const browser = await chromium.launch({args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--allow-file-access-from-files"]});
const page = await browser.newPage({viewport: {width: config.width, height: config.height}});
page.on("pageerror", (error) => { console.error(`page error: ${error.message}`); });
// Helios follows window.__HELIOS_VIRTUAL_TIME__ (milliseconds) when it is a number, which is how the renderer scrubs time.
await page.addInitScript(() => { window.__HELIOS_VIRTUAL_TIME__ = 0; });
await page.goto(pathToFileURL(entry).href);
await page.waitForFunction(() => Boolean(window.helios), null, {timeout: 20000});
await page.evaluate(() => document.fonts.ready);

for (const {name, time, label} of times) {
  const ms = Math.round(time * config.fps) / config.fps * 1000;
  await page.evaluate((t) => { window.__HELIOS_VIRTUAL_TIME__ = t; }, ms);
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  const file = resolve(outDir, `${name}.png`);
  await page.screenshot({path: file});
  console.log(`${name} (${label}) at ${time.toFixed(2)}s -> ${file}`);
}
await browser.close();

if (times.length > 1) {
  let ffmpeg = "ffmpeg";
  try { ffmpeg = createRequire(import.meta.url)("@ffmpeg-installer/ffmpeg").path; } catch { /* use PATH */ }
  const cols = Math.min(3, times.length);
  const sheet = resolve(outDir, "contact-sheet.png");
  execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-framerate", "1", "-i", resolve(outDir, "scene-%02d.png"), "-vf", `scale=640:-1,tile=${cols}x${Math.ceil(times.length / cols)}`, "-frames:v", "1", sheet]);
  console.log(`contact sheet -> ${sheet}`);
}
