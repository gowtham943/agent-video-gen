// Preflight: confirms this machine can render. Prints the exact fix for anything missing.
import {existsSync, readdirSync} from "node:fs";
import {homedir} from "node:os";
import {join} from "node:path";
import {createRequire} from "node:module";
import {execFileSync} from "node:child_process";

const problems = [];
const ok = (message) => console.log(`ok   ${message}`);
const bad = (message, fix) => { problems.push(message); console.error(`FAIL ${message}\n     fix: ${fix}`); };

const major = Number(process.versions.node.split(".")[0]);
major >= 20 ? ok(`Node ${process.versions.node}`) : bad(`Node ${process.versions.node} is too old`, "install Node 20 or newer");

const require = createRequire(import.meta.url);
try {
  require.resolve("playwright");
  ok("playwright package");
} catch {
  bad("playwright is not installed", "npm install");
}

// The renderer downloads its pinned headless Chromium on first use, so a missing browser is a note, not a failure.
const home = homedir();
const cache = process.env.PLAYWRIGHT_BROWSERS_PATH
  ?? (process.platform === "darwin" ? join(home, "Library", "Caches", "ms-playwright")
    : process.platform === "win32" ? join(process.env.LOCALAPPDATA ?? home, "ms-playwright")
      : join(home, ".cache", "ms-playwright"));
const hasBrowser = existsSync(cache) && readdirSync(cache).some((name) => name.startsWith("chromium_headless_shell") || name.startsWith("chromium-"));
console.log(hasBrowser ? "ok   Chromium found in the Playwright cache" : "note Chromium not cached yet; the first render downloads it (needs network, about 100 MB)");

let ffmpeg = "ffmpeg";
try { ffmpeg = require("@ffmpeg-installer/ffmpeg").path; } catch { /* use PATH */ }
try {
  execFileSync(ffmpeg, ["-version"], {stdio: "ignore"});
  ok(`ffmpeg (${ffmpeg})`);
} catch {
  bad("ffmpeg is not available", "npm install, or install ffmpeg and put it on PATH");
}

if (problems.length) process.exit(1);
console.log("Ready to render.");
