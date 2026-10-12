#!/usr/bin/env node
// Create a new video project from the bundled engine.
//
//   node scaffold.mjs <target-dir> [--slug my-product] [--example sample-saas] [--install] [--force]
//
// The engine is copied (not linked) so each video is a self-contained project the user can edit.
import {spawnSync} from "node:child_process";
import {cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync} from "node:fs";
import {basename, dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(here, "..");
const engineDir = join(skillDir, "engine");
const examplesDir = resolve(skillDir, "..", "..", "examples");

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const positional = args.filter((arg, i) => !arg.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--") && ["slug", "example"].includes(args[i - 1].slice(2))));

if (!positional[0] || flag("help")) {
  console.log("usage: node scaffold.mjs <target-dir> [--slug name] [--example name] [--install] [--force]");
  process.exit(positional[0] ? 0 : 1);
}

const target = resolve(positional[0]);
const slug = (option("slug") ?? basename(target)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "agent-video-gen";

if (existsSync(target) && readdirSync(target).filter((name) => name !== ".DS_Store").length && !flag("force")) {
  console.error(`${target} is not empty. Choose another folder or pass --force.`);
  process.exit(1);
}

const skip = new Set(["node_modules", "dist", "output", ".DS_Store"]);
mkdirSync(target, {recursive: true});
cpSync(engineDir, target, {recursive: true, filter: (source) => !skip.has(basename(source))});

// npm and some installers strip dotfiles, so the engine stores them with a leading underscore.
for (const [from, to] of [["_gitignore", ".gitignore"], ["_cursor", ".cursor"]]) {
  if (!existsSync(join(target, from))) continue;
  try {
    renameSync(join(target, from), join(target, to));
  } catch (error) {
    console.warn(`warning: could not rename ${from} to ${to} (${error.code}). Rename it manually.`);
  }
}

const pkgPath = join(target, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.name = slug;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

const configPath = join(target, "video.config.json");
const briefPath = join(target, "brief.md");

if (option("example")) {
  const example = join(examplesDir, option("example"));
  if (!existsSync(example)) {
    console.error(`Unknown example "${option("example")}". Available: ${readdirSync(examplesDir).join(", ")}`);
    process.exit(1);
  }
  cpSync(join(example, "video.config.json"), configPath);
  cpSync(join(example, "brief.md"), briefPath);
  if (existsSync(join(example, "assets"))) cpSync(join(example, "assets"), join(target, "public", "assets"), {recursive: true});
} else {
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  config.slug = slug;
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  cpSync(join(skillDir, "references", "brief-template.md"), briefPath);
}

if (flag("install")) {
  const result = spawnSync("npm", ["install"], {cwd: target, stdio: "inherit", shell: process.platform === "win32"});
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`
Created ${target}
  slug:   ${slug}
  config: video.config.json   (edit scenes, theme, claims)
  brief:  brief.md            (fill in before writing copy)

Next:
  cd ${target}
  ${flag("install") ? "" : "npm install\n  "}npm run doctor
  npm run validate
  npm run render
`);
