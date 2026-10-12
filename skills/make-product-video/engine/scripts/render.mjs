// Render the film straight to MP4: `npm run render`.
//   npm run render -- --jobs 6     parallel browsers (default: half the CPU cores, 1 to 6)
//   npm run render -- --fps 24     render at a lower frame rate to finish sooner
// Long films are split into chunks, rendered in parallel, and joined, so a 10-minute film is practical.
import {mkdir, readFile} from "node:fs/promises";
import {cpus} from "node:os";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {RenderOrchestrator} from "@helios-project/renderer";

function hashString(text) {
  let hash = 2166136261;
  for (const ch of String(text ?? "")) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  return hash | 0;
}

const config = JSON.parse(await readFile(resolve("video.config.json"), "utf8"));
const args = process.argv.slice(2);
const option = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? Number(args[i + 1]) : undefined; };

const durationInSeconds = config.scenes.reduce((sum, scene) => sum + scene.duration, 0);
const fps = option("fps") ?? config.fps;
const jobs = option("jobs") ?? Math.max(1, Math.min(6, Math.floor(cpus().length / 2)));
// Renderer 1.79 compares exact counters in its DOM loop, so avoid a fractional
// total such as 719.9999999999999 from decimal scene sums.
const frameCount = Math.round(durationInSeconds * fps);
await mkdir(resolve("output"), {recursive: true});

const input = pathToFileURL(resolve("dist/index.html")).href;
const output = resolve("output", `${config.slug}.mp4`);
const minutes = Math.floor(durationInSeconds / 60), seconds = Math.round(durationInSeconds % 60);
console.log(`Rendering ${minutes}m${String(seconds).padStart(2, "0")}s (${frameCount} frames) at ${config.width}x${config.height} / ${fps}fps with ${jobs} parallel browser(s)...`);

const started = Date.now();
let lastReported = -1;
await RenderOrchestrator.render(input, output, {
  width: config.width,
  height: config.height,
  fps,
  durationInSeconds,
  frameCount,
  mode: "dom",
  crf: 17,
  preset: "medium",
  intermediateImageFormat: "png",
  randomSeed: (config.seed ^ hashString(config.slug) ^ hashString(config.brand?.name)) | 0,
  webCodecsPreference: "software",
  concurrency: jobs
}, {
  onProgress: (progress) => {
    const percent = Math.floor(progress * 100);
    if (percent < lastReported + 5) return;
    lastReported = percent;
    const elapsed = (Date.now() - started) / 1000;
    const eta = progress > 0.02 ? Math.round((elapsed / progress) * (1 - progress) / 60) : "?";
    console.log(`progress ${percent}%  elapsed ${Math.round(elapsed / 60)}m  about ${eta}m left`);
  }
});
console.log(`Video saved to ${output}`);
