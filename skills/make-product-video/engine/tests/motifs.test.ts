import * as THREE from "three";
import {describe, expect, it} from "vitest";
import {MOTIFS, MOTIF_NAMES} from "../src/motifs";
import type {MotifContext, Palette} from "../src/motifs/common";
import type {VideoScene} from "../src/types";
import {seededRandom} from "../src/timeline";

const palette: Palette = {
  background: new THREE.Color("#10162c"), primary: new THREE.Color("#a1ec83"), secondary: new THREE.Color("#c1e8ee"),
  highlight: new THREE.Color("#f3663f"), ink: new THREE.Color("#29335c"), text: new THREE.Color("#ffffff")
};

function snapshot(group: THREE.Object3D) {
  const out: number[] = [];
  group.traverse((node) => {
    out.push(...node.position.toArray(), ...node.scale.toArray(), node.rotation.x, node.rotation.y, node.rotation.z, node.visible ? 1 : 0);
    const material = (node as THREE.Mesh).material as THREE.Material | undefined;
    if (material && "opacity" in material) out.push(material.opacity as number);
    const position = (node as THREE.Points).geometry?.getAttribute?.("position");
    if (position && position.count < 2000) out.push(...Array.from(position.array as Float32Array));
  });
  return out;
}

const frames = (duration: number) => [0, 0.4, 1.1, 2.3, 3.7, duration, duration + 0.5].map((time) => ({
  time, local: time, duration, energy: Math.min(1, Math.max(0, (time + 0.9) / 1.7)), exit: Math.min(1, Math.max(0, (time - (duration - 1.1)) / 2.2))
}));

const base = {duration: 4.5, chapter: "A", eyebrow: "A", heading: "A"};
const variants: Record<string, Partial<VideoScene>> = {
  "with product content": {items: ["Invoices", "Clients", "Payments", "Reports", "Alerts", "Teams", "Audit"], images: ["./assets/a.png", "./assets/b.png", "./assets/c.png"], icon: "shield", device: "phone"},
  "with no content": {}
};

const stubs = (scene: VideoScene): MotifContext => ({
  palette, random: seededRandom(1234), glow: new THREE.Texture(), scene,
  label: () => new THREE.Sprite(new THREE.SpriteMaterial()),
  assets: {image: () => ({texture: new THREE.Texture(), aspect: 1.6})}
});

describe.each(MOTIF_NAMES.flatMap((name) => Object.keys(variants).map((variant) => [name, variant] as const)))("motif %s %s", (name, variant) => {
  const scene = {...base, motif: name, ...variants[variant]} as VideoScene;
  const make = () => MOTIFS[name].create(stubs(scene));

  it("declares a usable span and view distance", () => {
    expect(MOTIFS[name].span).toBeGreaterThan(0);
    expect(MOTIFS[name].view).toBeGreaterThan(0);
  });

  it("renders the same state for the same frame regardless of order", () => {
    const sequence = frames(4.5);
    const forward = make(), reverse = make();
    const forwardStates = sequence.map((frame) => { forward.update(frame); return snapshot(forward.group); });
    const reverseStates = [...sequence].reverse().map((frame) => { reverse.update(frame); return snapshot(reverse.group); }).reverse();
    expect(reverseStates).toEqual(forwardStates);
  });

  it("produces finite values at every sampled frame", () => {
    const motif = make();
    for (const frame of frames(4.5)) {
      motif.update(frame);
      expect(snapshot(motif.group).every(Number.isFinite)).toBe(true);
    }
  });
});
