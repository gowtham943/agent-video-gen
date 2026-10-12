import {describe, expect, it} from "vitest";
import rawConfig from "../video.config.json";
import {ICON_NAMES as SCRIPT_ICONS, MOTIF_NAMES as SCRIPT_MOTIFS, lintClaims, lintStory, validateConfig} from "../scripts/lib/validate.mjs";
import {ICON_NAMES} from "../src/icons";
import {MOTIF_NAMES} from "../src/motifs";

const clone = () => JSON.parse(JSON.stringify(rawConfig));

describe("shipped sample config", () => {
  it("is structurally valid and passes the claims lint", () => {
    expect(validateConfig(rawConfig)).toEqual([]);
    expect(lintClaims(rawConfig)).toEqual([]);
    expect(lintStory(rawConfig)).toEqual([]);
  });

  it("keeps the validator's motif list in sync with the engine registry", () => {
    expect([...SCRIPT_MOTIFS].sort()).toEqual([...MOTIF_NAMES].sort());
    expect([...SCRIPT_ICONS].sort()).toEqual([...ICON_NAMES].sort());
  });
});

describe("validateConfig", () => {
  it("rejects unknown motifs, bad colours, and oversized headings", () => {
    const config = clone();
    config.scenes[0].motif = "confetti";
    config.theme.primary = "green";
    config.scenes[1].heading = "This single heading line is far too long to fit";
    const errors = validateConfig(config).join("\n");
    expect(errors).toContain("scenes[0].motif");
    expect(errors).toContain("theme.primary");
    expect(errors).toContain("scenes[1].heading");
  });

  it("requires pillar indexes to exist", () => {
    const config = clone();
    config.scenes[1].pillar = 9;
    expect(validateConfig(config).join("\n")).toContain("scenes[1].pillar");
  });

  it("rejects absolute logo paths so file-based rendering can load assets", () => {
    const config = clone();
    config.brand.logo = "/assets/logo.png";
    expect(validateConfig(config).join("\n")).toContain("brand.logo");
  });
});

describe("length and content rules", () => {
  it("allows up to ten minutes and no more", () => {
    const config = clone();
    config.scenes = Array.from({length: 60}, (_, i) => ({...rawConfig.scenes[i % 2], duration: 10}));
    expect(validateConfig(config).join("\n")).not.toContain("maximum");
    config.scenes.push({...rawConfig.scenes[0], duration: 5});
    expect(validateConfig(config).join("\n")).toContain("the maximum is 600s");
  });

  it("requires the content each motif needs", () => {
    const config = clone();
    config.scenes[0] = {...config.scenes[0], motif: "media", images: undefined};
    config.scenes[1] = {...config.scenes[1], motif: "icon", icon: undefined};
    const errors = validateConfig(config).join("\n");
    expect(errors).toContain("media motif needs at least one image");
    expect(errors).toContain("icon motif needs");
  });

  it("rejects absolute image paths, long items, and unsafe icon paths", () => {
    const config = clone();
    config.scenes[0].images = ["/etc/passwd"];
    config.scenes[1].items = ["this item name is definitely far too long"];
    config.scenes[2].iconPath = "M0 0 L1 1 <script>";
    const errors = validateConfig(config).join("\n");
    expect(errors).toContain("scenes[0].images");
    expect(errors).toContain("scenes[1].items");
    expect(errors).toContain("scenes[2].iconPath");
  });

  it("flags repeated motifs and films with too little product-specific content", () => {
    const config = clone();
    config.scenes.forEach((scene: Record<string, unknown>) => { delete scene.items; delete scene.images; delete scene.icon; delete scene.iconPath; });
    config.scenes[1].motif = config.scenes[0].motif;
    const issues = lintStory(config).join("\n");
    expect(issues).toContain("repeats the previous scene");
    expect(issues).toContain("carry product-specific visuals");
  });

  it("rejects leftover sample headlines on a real product film", () => {
    const config = clone();
    config.slug = "acme-billing";
    config.scenes[0].heading = "One place for\nthe work.";
    expect(lintStory(config).join("\n")).toContain("leftover sample copy");
  });

  it("applies the claims lint to items too", () => {
    const config = clone();
    config.scenes[1].items = ["Best in class"];
    expect(lintClaims(config).join("\n")).toContain("superlative");
  });
});

describe("lintClaims", () => {
  it("flags unsourced numbers and superlatives", () => {
    const config = clone();
    config.scenes[1].body = "Teams save 40% of their time with the best tool.";
    const issues = lintClaims(config).join("\n");
    expect(issues).toContain("numeric claim");
    expect(issues).toContain('superlative "best"');
  });

  it("allows a claim once it has an approved source", () => {
    const config = clone();
    config.scenes[1].body = "Teams save 40% of their time.";
    config.claims.sourced = [{text: "40%", source: "Customer study, 2026"}];
    expect(lintClaims(config)).toEqual([]);
  });

  it("enforces forbidden and required phrases", () => {
    const config = clone();
    config.scenes[0].body = "It is available now for everyone.";
    config.claims.required = [{phrase: "in development", scope: "last"}];
    const issues = lintClaims(config).join("\n");
    expect(issues).toContain('forbidden phrase "available now"');
    expect(issues).toContain('required phrase "in development"');
  });

  it("does not flag the numbering in an eyebrow such as 01 / STEP", () => {
    expect(lintClaims(rawConfig).join("")).not.toContain("eyebrow");
  });
});

describe("stylesheet determinism", () => {
  it("has no CSS transitions, animations, or will-change (they keep state between frames)", async () => {
    const {readFileSync} = await import("node:fs");
    const css = readFileSync(new URL("../src/style.css", import.meta.url), "utf8");
    expect(css).not.toMatch(/(^|[\s;{])(transition|animation|will-change)\s*:/);
  });
});
