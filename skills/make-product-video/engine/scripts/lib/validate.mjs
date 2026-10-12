// Pure config validation and claim linting. Shared by `npm run validate` and the test suite.

export const MOTIF_NAMES = [
  "document", "scan", "lattice", "constellation", "panels",
  "portals", "skyline", "orbit", "stream", "screen", "icon", "device", "media"
];
export const ICON_NAMES = [
  "shield", "bolt", "heart", "cloud", "pin", "star", "leaf", "drop", "flame",
  "chat", "lock", "home", "user", "cart", "doc", "bars", "gear", "sun", "rocket", "check"
];
export const MAX_SECONDS = 600;
const DEVICES = ["phone", "laptop", "monitor"];
const PATH_CHARS = /^[MmLlHhVvCcSsQqTtZz0-9eE.,\-+\s]+$/;
const ACCENTS = ["primary", "secondary", "highlight"];
const ALIGNS = ["left", "right", "center"];
const HEX = /^#[0-9a-fA-F]{6}$/;
const COPY_FIELDS = ["eyebrow", "heading", "body", "action", "footnote", "items"];

// Statements that need an approved source before they may appear on screen.
const SUPERLATIVES = /#\s?1\b|\b(best|best-in-class|number one|fastest|leading|world[- ]class|guarantee[sd]?|revolutionary|unmatched|unrivaled|industry[- ]first|risk[- ]free|instantly|effortless(?:ly)?|zero[- ](?:effort|risk|downtime|engineering))\b/i;
const NUMERIC = /\d|\b(double|triple|tenfold|hundreds|thousands|millions|billions)\b/i;

const norm = (text) => String(text ?? "").toLowerCase().replace(/\s+/g, " ").trim();

function stripSourced(text, claims) {
  let out = String(text ?? "");
  for (const claim of claims?.sourced ?? []) out = out.split(claim.text).join(" ");
  return out;
}

/** Structural problems that would break rendering. */
export function validateConfig(config) {
  const errors = [];
  const need = (cond, message) => { if (!cond) errors.push(message); };
  need(config && typeof config === "object", "config must be an object");
  if (errors.length) return errors;

  need(config.schema === 2, 'config.schema must be 2');
  need(/^[a-z0-9][a-z0-9-]*$/.test(config.slug ?? ""), "config.slug must be lowercase letters, digits, and dashes");
  need(typeof config.title === "string" && config.title.trim(), "config.title is required");
  need(typeof config.brand?.name === "string" && config.brand.name.trim(), "config.brand.name is required");
  if (config.brand?.logo) need(String(config.brand.logo).startsWith("./assets/"), 'config.brand.logo must use the relative "./assets/..." form');
  for (const key of ["background", "primary", "secondary", "highlight", "ink", "text"]) {
    need(HEX.test(config.theme?.[key] ?? ""), `config.theme.${key} must be a #rrggbb colour`);
  }
  need(typeof config.theme?.font === "string" && config.theme.font, "config.theme.font is required");
  need(Number.isInteger(config.fps) && config.fps >= 12 && config.fps <= 60, "config.fps must be an integer from 12 to 60");
  need(Number.isInteger(config.width) && config.width >= 320, "config.width must be an integer >= 320");
  need(Number.isInteger(config.height) && config.height >= 240, "config.height must be an integer >= 240");
  need(Number.isInteger(config.seed), "config.seed must be an integer");
  if (config.pillars !== undefined) need(Array.isArray(config.pillars) && config.pillars.every((p) => typeof p === "string"), "config.pillars must be an array of strings");

  if (config.look !== undefined) {
    const look = config.look;
    const range = (key, lo, hi) => { if (look[key] !== undefined) need(typeof look[key] === "number" && look[key] >= lo && look[key] <= hi, `config.look.${key} must be ${lo} to ${hi}`); };
    range("bloom", 0, 1.5); range("fog", 0.004, 0.03); range("exposure", 0.7, 1.4);
    if (look.dust !== undefined) need(["particles", "none"].includes(look.dust), 'config.look.dust must be "particles" or "none"');
  }

  const scenes = config.scenes;
  need(Array.isArray(scenes) && scenes.length >= 2, "config.scenes needs at least two scenes");
  if (!Array.isArray(scenes)) return errors;

  scenes.forEach((scene, i) => {
    const at = `scenes[${i}]`;
    need(MOTIF_NAMES.includes(scene.motif), `${at}.motif "${scene.motif}" is not one of: ${MOTIF_NAMES.join(", ")}`);
    need(typeof scene.duration === "number" && scene.duration >= 2 && scene.duration <= 20, `${at}.duration must be 2 to 20 seconds`);
    if (scene.items !== undefined) {
      need(Array.isArray(scene.items) && scene.items.length <= 8, `${at}.items must be an array of at most 8 strings`);
      need(Array.isArray(scene.items) && scene.items.every((item) => typeof item === "string" && item.trim() && item.length <= 26), `${at}.items entries must be 1 to 26 characters`);
    }
    if (scene.images !== undefined) {
      need(Array.isArray(scene.images) && scene.images.length <= 5, `${at}.images must be an array of at most 5 paths`);
      need(Array.isArray(scene.images) && scene.images.every((url) => typeof url === "string" && url.startsWith("./assets/")), `${at}.images entries must use the relative "./assets/..." form`);
    }
    if (scene.motif === "media") need(Array.isArray(scene.images) && scene.images.length >= 1, `${at}: the media motif needs at least one image`);
    if (scene.motif === "icon") need(Boolean(scene.iconPath) || ICON_NAMES.includes(scene.icon), `${at}: the icon motif needs "icon" (one of ${ICON_NAMES.join(", ")}) or "iconPath"`);
    if (scene.icon !== undefined) need(ICON_NAMES.includes(scene.icon), `${at}.icon "${scene.icon}" is not one of: ${ICON_NAMES.join(", ")}`);
    if (scene.iconPath !== undefined) need(typeof scene.iconPath === "string" && PATH_CHARS.test(scene.iconPath) && scene.iconPath.length < 4000, `${at}.iconPath may only use M L H V C S Q T Z commands and numbers`);
    if (scene.device !== undefined) need(DEVICES.includes(scene.device), `${at}.device must be ${DEVICES.join(", ")}`);
    need(typeof scene.chapter === "string" && scene.chapter.trim(), `${at}.chapter is required`);
    need(typeof scene.eyebrow === "string" && scene.eyebrow.trim(), `${at}.eyebrow is required`);
    need(typeof scene.heading === "string" && scene.heading.trim(), `${at}.heading is required`);
    if (scene.accent !== undefined) need(ACCENTS.includes(scene.accent), `${at}.accent must be ${ACCENTS.join(", ")}`);
    if (scene.align !== undefined) need(ALIGNS.includes(scene.align), `${at}.align must be ${ALIGNS.join(", ")}`);
    if (scene.pillar !== undefined) need(Number.isInteger(scene.pillar) && scene.pillar >= 0 && scene.pillar < (config.pillars?.length ?? 0), `${at}.pillar must index into config.pillars`);
    const lines = String(scene.heading ?? "").split("\n");
    need(lines.length <= 3, `${at}.heading may have at most 3 lines`);
    need(lines.every((line) => line.length <= 30), `${at}.heading lines must be 30 characters or fewer so they fit the frame`);
    need(String(scene.body ?? "").length <= 190, `${at}.body must be 190 characters or fewer`);
  });
  const total = scenes.reduce((sum, scene) => sum + (Number(scene.duration) || 0), 0);
  need(total <= MAX_SECONDS, `total length is ${total.toFixed(1)}s; the maximum is ${MAX_SECONDS}s (10 minutes)`);
  return errors;
}

/** Is a scene carrying something that belongs to this product (words, a picture, or a symbol)? */
const hasPayload = (scene) => Boolean(scene.items?.length || scene.images?.length || scene.icon || scene.iconPath);

const SAMPLE_HEADINGS = new Set([
  "One place for\nthe work.",
  "Bring everything\ntogether.",
  "Let the busywork\nrun itself.",
  "Share what\nmatters.",
  "A clear line\nto the outcome."
]);

/** Story-level problems: films that would look the same for any product. */
export function lintStory(config) {
  const issues = [];
  const scenes = config.scenes ?? [];
  scenes.forEach((scene, i) => {
    if (i > 0 && scenes[i - 1].motif === scene.motif) issues.push(`scenes[${i}]: motif "${scene.motif}" repeats the previous scene; vary the visual`);
    if (config.slug !== "sample-film" && SAMPLE_HEADINGS.has(scene.heading)) {
      issues.push(`scenes[${i}].heading is leftover sample copy; write this product's own line`);
    }
  });
  const specific = scenes.filter(hasPayload).length;
  const needed = Math.ceil(scenes.length * 0.8);
  if (scenes.length && specific < needed) {
    issues.push(`only ${specific} of ${scenes.length} scenes carry product-specific visuals (items, images, icon); at least ${needed} (80%) must, or the film is generic`);
  }
  const uniqueItems = new Set(scenes.flatMap((scene) => scene.items ?? []));
  const itemFloor = Math.min(6, scenes.length);
  if (scenes.length >= 4 && uniqueItems.size < itemFloor) {
    issues.push(`only ${uniqueItems.size} distinct item labels across the film; use at least ${itemFloor} real names from this product so the 3D scenes are not generic`);
  }
  return issues;
}

/** Copy that makes unapproved claims, or violates the project's own policy. */
export function lintClaims(config) {
  const issues = [];
  const claims = config.claims;
  const scenes = config.scenes ?? [];

  scenes.forEach((scene, i) => {
    for (const field of COPY_FIELDS) {
      const value = scene[field];
      if (!value || (Array.isArray(value) && !value.length)) continue;
      const raw = Array.isArray(value) ? value.join(" | ") : value;
      const text = stripSourced(raw, claims);
      const where = `scenes[${i}].${field}`;
      const numericText = field === "eyebrow" ? text.replace(/^\s*\d{1,2}\s*\/\s*/, "") : text;
      if (NUMERIC.test(numericText)) issues.push(`${where}: numeric claim "${raw}" needs an approved source (add it to claims.sourced)`);
      const hit = text.match(SUPERLATIVES);
      if (hit) issues.push(`${where}: unsupported superlative "${hit[0]}" (add it to claims.sourced with a source, or reword)`);
      for (const phrase of claims?.forbidden ?? []) {
        if (norm(text).includes(norm(phrase))) issues.push(`${where}: forbidden phrase "${phrase}"`);
      }
    }
  });

  for (const claim of claims?.sourced ?? []) {
    if (!claim.text || !claim.source) issues.push("claims.sourced entries need both text and source");
  }

  const sceneText = (scene) => norm(COPY_FIELDS.map((field) => scene[field] ?? "").join(" "));
  for (const rule of claims?.required ?? []) {
    const pool = rule.scope === "last" ? scenes.slice(-1) : scenes;
    if (!pool.some((scene) => sceneText(scene).includes(norm(rule.phrase)))) {
      issues.push(`required phrase "${rule.phrase}" is missing${rule.scope === "last" ? " from the final scene" : ""}`);
    }
  }
  return issues;
}
