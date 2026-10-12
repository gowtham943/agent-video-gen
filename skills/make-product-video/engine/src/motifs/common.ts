import * as THREE from "three";
import type {VideoScene} from "../types";

export interface Palette {
  background: THREE.Color;
  primary: THREE.Color;
  secondary: THREE.Color;
  highlight: THREE.Color;
  ink: THREE.Color;
  text: THREE.Color;
}

/** Everything a motif may read. All values are pure functions of the Helios frame. */
export interface MotifFrame {
  time: number;
  /** Seconds since this motif's scene began (may be negative while the camera approaches). */
  local: number;
  /** Duration of this motif's scene in seconds. */
  duration: number;
  /** 0 to 1: how fully the motif has formed. */
  energy: number;
  /** 0 to 1: how far the motif has departed as the next scene approaches. */
  exit: number;
}

export interface MotifInstance {
  group: THREE.Group;
  update(frame: MotifFrame): void;
}

export interface LabelOptions {
  /** World-space text height. Default 0.5. */
  height?: number;
  /** Text colour. Default is the theme text colour. */
  color?: THREE.ColorRepresentation;
  /** Draw a rounded translucent chip behind the text. */
  pill?: boolean;
}

export interface LoadedImage {
  texture: THREE.Texture;
  /** width / height */
  aspect: number;
}

export interface Assets {
  image(url: string): LoadedImage;
}

export interface MotifContext {
  palette: Palette;
  /** Seeded generator. Use it for every random decision so frames reproduce exactly. */
  random: () => number;
  glow: THREE.Texture;
  /** The scene this motif belongs to: read `items`, `images`, `icon`, `device`. */
  scene: VideoScene;
  /** Draws text as a billboard sprite. Static: never changes between frames. */
  label(text: string, options?: LabelOptions): THREE.Sprite;
  assets: Assets;
}

export interface MotifDef {
  /** Length of the motif along the camera axis. Used to space scenes in the world. */
  span: number;
  /** How far in front of the motif centre the camera is at the middle of the scene. */
  view: number;
  create(ctx: MotifContext): MotifInstance;
}

type Fadeable = THREE.Mesh | THREE.Line | THREE.LineSegments | THREE.Points | THREE.Sprite;

function isFadeable(item: THREE.Object3D): item is Fadeable {
  return item instanceof THREE.Mesh || item instanceof THREE.Line || item instanceof THREE.Points || item instanceof THREE.Sprite;
}

/** Record each material's authored opacity so a whole group can be faded later. */
export function captureOpacity(group: THREE.Object3D) {
  group.traverse((item) => {
    if (!isFadeable(item)) return;
    const material = item.material as THREE.Material & {opacity: number};
    material.transparent = true;
    material.userData.baseOpacity = material.opacity;
  });
}

export function setGroupOpacity(group: THREE.Object3D, factor: number) {
  group.traverse((item) => {
    if (!isFadeable(item)) return;
    const material = item.material as THREE.Material & {opacity: number};
    material.opacity = (material.userData.baseOpacity ?? 1) * factor;
  });
}

export function edgePlane(width: number, height: number, color: THREE.Color, opacity = 0.72) {
  const group = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(width, height);
  const plane = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({
    color: 0xf9fbff, emissive: color, emissiveIntensity: 0.025, transparent: true, opacity,
    roughness: 0.68, metalness: 0.04, side: THREE.DoubleSide
  }));
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({color, transparent: true, opacity: 0.66}));
  edge.position.z = 0.01;
  group.add(plane, edge);
  return group;
}

export function flatBar(width: number, height: number, color: THREE.ColorRepresentation, opacity: number) {
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({color, transparent: true, opacity}));
}

export function halo(glow: THREE.Texture, color: THREE.Color, opacity: number, scale: number) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: glow, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false}));
  sprite.scale.setScalar(scale);
  return sprite;
}

export function glowTexture() {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "#fff"); g.addColorStop(0.12, "#ffffffc9"); g.addColorStop(0.42, "#ffffff28"); g.addColorStop(1, "#fff0");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export const pick = <T,>(items: T[], index: number) => items[index % items.length];

/** A calm light-surface colour that stays below the bloom threshold, tinted by the brand. */
export function surfaceColor(palette: Palette) {
  return palette.secondary.clone().lerp(palette.ink, 0.42);
}

const css = (color: THREE.ColorRepresentation) => `#${new THREE.Color(color).getHexString()}`;

/** Browser-only text renderer. Tests inject their own stub instead. */
export function createLabelFactory(font: string, palette: Palette) {
  return (text: string, {height = 0.5, color, pill = false}: LabelOptions = {}) => {
    const px = 96, padX = pill ? 44 : 12, padY = pill ? 22 : 8;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const fontSpec = `700 ${px}px "${font}", system-ui, sans-serif`;
    ctx.font = fontSpec;
    const textWidth = Math.ceil(ctx.measureText(text).width);
    canvas.width = textWidth + padX * 2;
    canvas.height = px + padY * 2;
    const draw = canvas.getContext("2d")!;
    if (pill) {
      draw.fillStyle = css(palette.background) + "d9";
      draw.strokeStyle = css(palette.secondary) + "66";
      draw.lineWidth = 4;
      const r = canvas.height / 2;
      draw.beginPath();
      draw.roundRect(3, 3, canvas.width - 6, canvas.height - 6, r);
      draw.fill();
      draw.stroke();
    }
    draw.font = fontSpec;
    draw.textBaseline = "middle";
    draw.fillStyle = css(color ?? palette.text);
    draw.fillText(text, padX, canvas.height / 2 + 4);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: texture, color: 0xb4b4b4, transparent: true, depthWrite: false}));
    sprite.scale.set((canvas.width / canvas.height) * height * (1 + (pill ? 0.4 : 0)), height * (1 + (pill ? 0.4 : 0)), 1);
    return sprite;
  };
}

/** Items for this scene, trimmed to what a motif can show. */
export const itemsOf = (scene: VideoScene, max: number) => (scene.items ?? []).slice(0, max);

/** Shrink a label so it is never wider than `maxWidth`. */
export function fitLabel(sprite: THREE.Sprite, maxWidth: number) {
  if (sprite.scale.x > maxWidth) sprite.scale.multiplyScalar(maxWidth / sprite.scale.x);
  return sprite;
}

/** Scale a label by `k` relative to its authored size. */
export function setLabelScale(sprite: THREE.Sprite, k: number) {
  const base = (sprite.userData.base ??= sprite.scale.clone()) as THREE.Vector3;
  sprite.scale.set(base.x * k, base.y * k, 1);
}

/** Cover-fit a texture into a box of `width` x `height` without stretching. */
/** Pictures are dimmed slightly so bright screenshots stay below the bloom threshold. */
export const IMAGE_TINT = 0x8c8c8c;

export function coverImage(image: LoadedImage, width: number, height: number, opacity = 1) {
  const texture = image.texture.clone();
  texture.needsUpdate = true;
  const boxAspect = width / height;
  if (image.aspect > boxAspect) { texture.repeat.set(boxAspect / image.aspect, 1); texture.offset.set((1 - boxAspect / image.aspect) / 2, 0); }
  else { texture.repeat.set(1, image.aspect / boxAspect); texture.offset.set(0, (1 - image.aspect / boxAspect) / 2); }
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({map: texture, color: IMAGE_TINT, transparent: true, opacity, toneMapped: false}));
}

export function roundedRectShape(width: number, height: number, radius: number) {
  const x = -width / 2, y = -height / 2, r = Math.min(radius, width / 2, height / 2);
  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y); shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r); shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height); shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}
