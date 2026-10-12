import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {lintClaims, lintStory, validateConfig} from "./lib/validate.mjs";

const file = process.argv[2] ?? "video.config.json";
let config;
try {
  config = JSON.parse(await readFile(resolve(file), "utf8"));
} catch (error) {
  console.error(`Cannot read ${file}: ${error.message}`);
  process.exit(1);
}

const structural = validateConfig(config);
const claims = structural.length ? [] : lintClaims(config);
const story = structural.length ? [] : lintStory(config);
for (const message of structural) console.error(`structure: ${message}`);
for (const message of claims) console.error(`claims:    ${message}`);
for (const message of story) console.error(`story:     ${message}`);

if (structural.length || claims.length || story.length) {
  console.error(`\n${structural.length + claims.length + story.length} problem(s) in ${file}.`);
  process.exit(1);
}
const total = config.scenes.reduce((sum, scene) => sum + scene.duration, 0);
console.log(`${file} OK: ${config.scenes.length} scenes, ${Math.floor(total / 60)}m${String(Math.round(total % 60)).padStart(2, "0")}s (${total.toFixed(1)}s) at ${config.width}x${config.height} / ${config.fps}fps`);
