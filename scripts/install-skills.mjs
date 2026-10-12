#!/usr/bin/env node
// Fallback installer: symlink this plugin's skills into an agent's personal skills folder.
// Works in every agent version, whether or not it supports plugin marketplaces.
//
//   node scripts/install-skills.mjs --agent cursor|codex|claude|all [--uninstall]
import {existsSync, lstatSync, mkdirSync, readdirSync, readlinkSync, rmSync, symlinkSync} from "node:fs";
import {homedir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = join(root, "skills");
const args = process.argv.slice(2);
const agent = args[args.indexOf("--agent") + 1];
const uninstall = args.includes("--uninstall");

const homes = {
  cursor: join(homedir(), ".cursor", "skills"),
  codex: join(homedir(), ".codex", "skills"),
  claude: join(homedir(), ".claude", "skills")
};
const targets = agent === "all" ? Object.keys(homes) : homes[agent] ? [agent] : [];
if (!targets.length) {
  console.error("usage: node scripts/install-skills.mjs --agent cursor|codex|claude|all [--uninstall]");
  process.exit(1);
}

for (const name of targets) {
  const dest = homes[name];
  mkdirSync(dest, {recursive: true});
  for (const skill of readdirSync(skillsDir)) {
    const link = join(dest, skill);
    const source = join(skillsDir, skill);
    const exists = existsSync(link) || (() => { try { lstatSync(link); return true; } catch { return false; } })();
    if (exists) {
      const stat = lstatSync(link);
      if (!stat.isSymbolicLink() || resolve(dirname(link), readlinkSync(link)) !== source) {
        if (uninstall) { console.log(`skip  ${link} (not ours)`); continue; }
        if (!stat.isSymbolicLink()) { console.error(`skip  ${link} exists and is not a symlink`); continue; }
      }
      rmSync(link);
    }
    if (uninstall) { console.log(`removed ${link}`); continue; }
    symlinkSync(source, link, "dir");
    console.log(`linked ${link} -> ${source}`);
  }
}
