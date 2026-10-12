import {Helios} from "@helios-project/core";
import * as THREE from "three";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer.js";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass.js";
import {UnrealBloomPass} from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import rawConfig from "../video.config.json";
import {loadAssets} from "./assets";
import {createLabelFactory, glowTexture, type MotifInstance, type Palette} from "./motifs/common";
import {MOTIFS} from "./motifs";
import {
  buildTimeline, clamp, easeInOutCubic, easeOutExpo, formatTimecode, hashString, monotoneCubic,
  motifEnergy, motifExit, seededRandom, totalDuration
} from "./timeline";
import type {Align, TimedScene, VideoConfig} from "./types";
import "./style.css";

const config = rawConfig as unknown as VideoConfig;
const worldSeed = (config.seed ^ hashString(config.slug) ^ hashString(config.brand.name)) | 0;
const timeline = buildTimeline(config.scenes);
const duration = totalDuration(config.scenes);
const root = document.querySelector<HTMLElement>("#video");
if (!root) throw new Error("The composition requires a #video element");

// ---------------------------------------------------------------- theme + DOM
const {theme} = config;
const style = document.documentElement.style;
style.setProperty("--bg", theme.background);
style.setProperty("--primary", theme.primary);
style.setProperty("--secondary", theme.secondary);
style.setProperty("--highlight", theme.highlight);
style.setProperty("--ink", theme.ink);
style.setProperty("--text", theme.text);
style.setProperty("--font", `"${theme.font}"`);
document.title = config.title;

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]!));
const brandMark = config.brand.logo
  ? `<img src="${escapeHtml(config.brand.logo)}" alt="${escapeHtml(config.brand.name)}">`
  : `<div class="wordmark">${escapeHtml(config.brand.name)}</div>`;

const defaultAlign = (scene: TimedScene): Align => scene.align ?? (scene.action && scene.index === timeline.length - 1 ? "center" : scene.index % 2 ? "right" : "left");
const widthFor = (align: Align) => (align === "center" ? 1120 : 840);

function beatHtml(scene: TimedScene) {
  const align = defaultAlign(scene);
  const lines = scene.heading.split("\n");
  const longest = Math.max(...lines.map((line) => line.length));
  const size = Math.round(clamp(widthFor(align) / (longest * 0.56), 58, align === "center" ? 106 : 104, ));
  const heading = lines.map((line) => `<span>${escapeHtml(line)}</span>`).join("");
  const body = scene.body ? `<p>${escapeHtml(scene.body)}</p>` : "";
  const action = scene.action ? `<div class="action">${escapeHtml(scene.action)}</div>` : "";
  const footnote = scene.footnote ? `<div class="footnote">${escapeHtml(scene.footnote)}</div>` : "";
  return `<section class="beat beat--${align} accent--${scene.accent ?? "primary"}" style="--h:${size}px">
    <div class="beat-kicker"><i></i>${escapeHtml(scene.eyebrow)}</div><h1>${heading}</h1>${body}${action}${footnote}</section>`;
}

const pillars = config.pillars ?? [];
root.innerHTML = `
  <canvas id="cinema"></canvas>
  <div class="atmosphere"></div><div class="grain"></div>
  <header class="hud">${brandMark}<div class="hud-mode">${escapeHtml(config.brand.hudLabel ?? "")}</div></header>
  <div class="editorial">${timeline.map(beatHtml).join("")}</div>
  ${pillars.length ? `<div class="mode-stack">${pillars.map((p) => `<span>${escapeHtml(p)}</span>`).join("")}</div>` : ""}
  <footer class="footer"><div class="chapter"></div><div class="timecode">00:00:00:00</div><div class="rail"><i></i></div></footer>`;

const canvas = root.querySelector<HTMLCanvasElement>("#cinema")!;
const beats = [...root.querySelectorAll<HTMLElement>(".beat")];
const chapter = root.querySelector<HTMLElement>(".chapter")!;
const timecode = root.querySelector<HTMLElement>(".timecode")!;
const rail = root.querySelector<HTMLElement>(".rail i")!;
const modeStack = root.querySelector<HTMLElement>(".mode-stack");
const modeItems = modeStack ? [...modeStack.children] as HTMLElement[] : [];

// ---------------------------------------------------------------- world
const palette: Palette = {
  background: new THREE.Color(theme.background),
  primary: new THREE.Color(theme.primary),
  secondary: new THREE.Color(theme.secondary),
  highlight: new THREE.Color(theme.highlight),
  ink: new THREE.Color(theme.ink),
  text: new THREE.Color(theme.text)
};

const SHIFT_RATIO = 0.27; // sideways camera offset (per unit of view distance) that parks the subject opposite the headline
const GAP = 14;      // empty space between neighbouring motifs along the journey
const shiftFor = (align: Align, view: number) => (align === "left" ? -1 : align === "right" ? 1 : 0) * SHIFT_RATIO * view;

const motifDefs = timeline.map((scene) => MOTIFS[scene.motif]);
const anchors: number[] = [];
motifDefs.forEach((def, i) => {
  anchors.push(i === 0 ? 0 : anchors[i - 1] - (motifDefs[i - 1].span / 2 + def.span / 2 + GAP));
});
const journeyEnd = anchors[anchors.length - 1] - motifDefs[motifDefs.length - 1].span / 2;
const journeyLength = -journeyEnd + 40;

const look = config.look ?? {};
const scene = new THREE.Scene();
scene.background = palette.background.clone();
scene.fog = new THREE.FogExp2(palette.background.clone().getHex(), look.fog ?? 0.0145);
const camera = new THREE.PerspectiveCamera(40, config.width / config.height, 0.1, journeyLength + 120);
const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: false, powerPreference: "high-performance"});
renderer.setSize(config.width, config.height, false);
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = look.exposure ?? 1.02;
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(config.width, config.height), look.bloom ?? 0.58, 0.64, 0.34));

const world = new THREE.Group();
const key = new THREE.PointLight(palette.primary, 38, 74, 1.6);
const rim = new THREE.PointLight(palette.highlight, 31, 68, 1.7);
scene.add(world, new THREE.HemisphereLight(palette.secondary, palette.background.clone().multiplyScalar(0.6), 0.55), key, rim);

const glow = glowTexture();

// A quiet data field gives every scene depth without turning it into a slide background.
const dustRandom = seededRandom(worldSeed);
const dustCount = look.dust === "none" ? 0 : Math.ceil(journeyLength * 15);
const dustPositions = new Float32Array(dustCount * 3);
for (let i = 0; i < dustPositions.length; i += 3) {
  dustPositions[i] = (dustRandom() - 0.5) * 95;
  dustPositions[i + 1] = (dustRandom() - 0.5) * 52;
  dustPositions[i + 2] = 22 - dustRandom() * (journeyLength + 22);
}
const dustGeometry = new THREE.BufferGeometry();
dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({color: palette.secondary, size: 0.045, transparent: true, opacity: 0.42, depthWrite: false}));
world.add(dust);

// Images must be decoded before the first frame; fonts before labels are drawn.
const imageUrls = config.scenes.flatMap((item) => item.images ?? []);
await document.fonts.load(`700 40px "${theme.font}"`).catch(() => undefined);
const assets = await loadAssets(imageUrls);
const label = createLabelFactory(theme.font, palette);

const motifs: MotifInstance[] = timeline.map((sceneItem, i) => {
  const instance = motifDefs[i].create({palette, random: seededRandom(worldSeed + i * 7919 + 1), glow, scene: sceneItem, label, assets});
  instance.group.position.z = anchors[i];
  world.add(instance.group);
  return instance;
});

// ---------------------------------------------------------------- camera journey
const lastIndex = timeline.length - 1;
const camRandom = seededRandom(worldSeed ^ 0x9e3779b9);
const holds = timeline.map((sceneItem, i) => new THREE.Vector3(
  shiftFor(defaultAlign(sceneItem), motifDefs[i].view),
  (camRandom() - 0.5) * 0.9,
  anchors[i] + motifDefs[i].view
));
const points = [
  holds[0].clone().add(new THREE.Vector3(holds[0].x * -0.3, 0.5, 5)),
  ...holds,
  holds[lastIndex].clone().add(new THREE.Vector3(0, -0.2, -4))
];
const path = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.34);
const knotTimes = [0, ...timeline.map((item) => item.start + item.duration * 0.5), duration];
const knotValues = points.map((_, k) => k / (points.length - 1));
const pathParam = monotoneCubic(knotTimes, knotValues);
const lookAhead = 0.42 / (points.length - 1);

function updateEditorial(active: TimedScene, time: number) {
  beats.forEach((beat, i) => { beat.style.visibility = i === active.index ? "visible" : "hidden"; });
  const beat = beats[active.index];
  const local = time - active.start;
  const reveal = easeOutExpo(clamp((local - 0.2) / 0.92));
  const depart = easeInOutCubic(clamp((active.end - time) / 0.72));
  const visibility = Math.min(reveal, depart);
  beat.style.opacity = String(visibility);
  beat.style.transform = `${beat.classList.contains("beat--center") ? "translate(-50%, -48%)" : "translateY(-48%)"} translate3d(${(1 - reveal) * -38 + (1 - depart) * 26}px, ${(1 - reveal) * 14}px, 0)`;
  beat.style.filter = visibility > 0.9999 ? "none" : `blur(${(1 - visibility) * 9}px)`;
  if (modeStack) {
    modeItems.forEach((item, i) => item.classList.toggle("on", active.pillar === i));
    modeStack.dataset.visible = active.pillar === undefined ? "false" : "true";
  }
}

function renderFrame(currentFrame: number) {
  const time = clamp(currentFrame / config.fps, 0, duration);
  const progress = clamp(time / duration);
  const u = pathParam(time);
  const p = path.getPoint(u), ahead = path.getPoint(clamp(u + lookAhead));
  camera.position.copy(p);
  camera.position.x += Math.sin(time * 0.38) * 0.28;
  camera.position.y += Math.sin(time * 0.29) * 0.18;
  // Blend sideways look-ahead so the camera glides forward without panning toward the next scene's offset.
  camera.lookAt(p.x + (ahead.x - p.x) * 0.25, p.y + (ahead.y - p.y) * 0.5, ahead.z - 2.3);
  camera.rotateZ(Math.sin(time * 0.19) * 0.006);
  key.position.set(p.x + 4, p.y + 5, p.z + 2);
  rim.position.set(p.x - 6, p.y - 3, p.z - 6);
  dust.rotation.z = time * 0.004;
  dust.position.z = Math.sin(time * 0.13) * 1.4;

  timeline.forEach((item, i) => {
    const instance = motifs[i];
    const near = Math.abs(p.z - anchors[i]) < 150;
    instance.group.visible = near;
    if (!near) return;
    instance.update({
      time,
      local: time - item.start,
      duration: item.duration,
      energy: motifEnergy(time, item),
      exit: i === lastIndex ? 0 : motifExit(time, item)
    });
  });

  const active = timeline.find((item) => time >= item.start && time < item.end) ?? timeline[lastIndex];
  updateEditorial(active, time);
  chapter.textContent = active.chapter;
  timecode.textContent = formatTimecode(currentFrame, config.fps);
  rail.style.transform = `scaleX(${progress})`;
  composer.render();
}

const helios = new Helios({duration, fps: config.fps});
helios.bindToDocumentTimeline();
helios.subscribe(({currentFrame}) => renderFrame(currentFrame));
renderFrame(0);
declare global { interface Window { helios: Helios; VIDEO_CONFIG: VideoConfig; } }
window.helios = helios;
window.VIDEO_CONFIG = config;
