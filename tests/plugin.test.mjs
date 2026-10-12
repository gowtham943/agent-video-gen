import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, readdirSync, rmSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {test} from "node:test";
import {fileURLToPath} from "node:url";
import {lintClaims, lintStory, validateConfig} from "../skills/make-product-video/engine/scripts/lib/validate.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const json = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));

test("the three agent manifests agree on name, version, and description", () => {
  const manifests = [".claude-plugin/plugin.json", ".cursor-plugin/plugin.json", ".codex-plugin/plugin.json"].map(json);
  for (const key of ["name", "version", "description"]) {
    assert.equal(new Set(manifests.map((m) => m[key])).size, 1, `${key} differs between manifests`);
  }
  assert.ok(manifests.every((m) => m.description.length > 20));
  assert.equal(json("package.json").version, manifests[0].version);
});

test("manifests point at directories that exist", () => {
  for (const [file, keys] of [[".cursor-plugin/plugin.json", ["skills", "commands", "rules"]], [".codex-plugin/plugin.json", ["skills"]]]) {
    const manifest = json(file);
    for (const key of keys) assert.ok(existsSync(join(root, manifest[key])), `${file}: ${key} -> ${manifest[key]} is missing`);
  }
});

test("every skill has valid frontmatter and resolvable references", () => {
  const skillsDir = join(root, "skills");
  for (const name of readdirSync(skillsDir)) {
    const text = readFileSync(join(skillsDir, name, "SKILL.md"), "utf8");
    const match = text.match(/^---\nname: (.+)\ndescription: (.+)\n---\n/);
    assert.ok(match, `${name}: frontmatter must be name then description`);
    assert.equal(match[1], name, `${name}: frontmatter name must equal the folder name`);
    assert.ok(match[2].length > 60 && match[2].length < 1024, `${name}: description length`);
    for (const ref of text.matchAll(/`(references\/[\w.-]+|scripts\/[\w.-]+)`/g)) {
      assert.ok(existsSync(join(skillsDir, name, ref[1])) || existsSync(join(skillsDir, "make-product-video", ref[1])), `${name}: missing ${ref[1]}`);
    }
  }
});

test("commands carry a description", () => {
  for (const file of readdirSync(join(root, "commands"))) {
    assert.match(readFileSync(join(root, "commands", file), "utf8"), /^---\ndescription: .+/, file);
  }
});

test("shipped configs are valid and pass the claims lint", () => {
  const configs = [
    "skills/make-product-video/engine/video.config.json",
    ...readdirSync(join(root, "examples")).map((name) => `examples/${name}/video.config.json`)
  ];
  for (const file of configs) {
    const config = json(file);
    assert.deepEqual(validateConfig(config), [], file);
    assert.deepEqual(lintClaims(config), [], file);
    assert.deepEqual(lintStory(config), [], file);
  }
});

test("scaffold creates a runnable project from the sample and from an example", () => {
  const scaffold = join(root, "skills/make-product-video/scripts/scaffold.mjs");
  const base = join(root, ".scratch", "scaffold-test");
  rmSync(base, {recursive: true, force: true});
  mkdirSync(base, {recursive: true});

  const plain = join(base, "My Cool Product");
  const a = spawnSync("node", [scaffold, plain], {encoding: "utf8"});
  assert.equal(a.status, 0, a.stderr);
  const pkg = JSON.parse(readFileSync(join(plain, "package.json"), "utf8"));
  assert.equal(pkg.name, "my-cool-product");
  assert.equal(JSON.parse(readFileSync(join(plain, "video.config.json"), "utf8")).slug, "my-cool-product");
  for (const file of ["brief.md", "AGENTS.md", "CLAUDE.md", "src/main.ts", "scripts/render.mjs", "public/assets"]) {
    assert.ok(existsSync(join(plain, file)), `missing ${file}`);
  }
  assert.ok(existsSync(join(plain, ".cursor")) || existsSync(join(plain, "_cursor")), "cursor rules were not copied");
  assert.ok(!existsSync(join(plain, "node_modules")));

  const refuse = spawnSync("node", [scaffold, plain], {encoding: "utf8"});
  assert.notEqual(refuse.status, 0, "must refuse a non-empty folder");

  const gx = join(base, "gx");
  const b = spawnSync("node", [scaffold, gx, "--example", "groundx-studio"], {encoding: "utf8"});
  assert.equal(b.status, 0, b.stderr);
  assert.equal(JSON.parse(readFileSync(join(gx, "video.config.json"), "utf8")).slug, "groundx-studio");
  assert.ok(existsSync(join(gx, "public/assets/groundx-studio-white.png")));

  const bad = spawnSync("node", [scaffold, join(base, "x"), "--example", "nope"], {encoding: "utf8"});
  assert.notEqual(bad.status, 0);
  rmSync(base, {recursive: true, force: true});
});
