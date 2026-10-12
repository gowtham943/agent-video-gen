import type {TimedScene, VideoScene} from "./types";

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const easeOutExpo = (value: number) => value >= 1 ? 1 : 1 - 2 ** (-10 * clamp(value));
export const easeInOutCubic = (value: number) => {
  const t = clamp(value);
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
};

export function buildTimeline(scenes: VideoScene[]): TimedScene[] {
  let cursor = 0;
  return scenes.map((scene, index) => {
    const timed = {...scene, start: cursor, end: cursor + scene.duration, index};
    cursor = timed.end;
    return timed;
  });
}

export function totalDuration(scenes: VideoScene[]): number {
  return scenes.reduce((sum, scene) => sum + scene.duration, 0);
}

export function sceneVisibility(time: number, scene: TimedScene, transition = 0.72) {
  const local = time - scene.start;
  const enter = easeOutExpo(clamp(local / transition));
  const exit = easeInOutCubic(clamp((scene.end - time) / transition));
  return {local, enter, exit, opacity: Math.min(enter, exit)};
}

/** How far a motif has arrived (0 to 1). Starts slightly before its scene so it is formed on camera. */
export function motifEnergy(time: number, scene: TimedScene, lead = 0.9, rise = 1.7) {
  return easeOutExpo(clamp((time - (scene.start - lead)) / rise));
}

/** How far a motif has departed (0 to 1) as the next scene approaches. */
export function motifExit(time: number, scene: TimedScene, lead = 1.1, span = 2.2) {
  return easeInOutCubic(clamp((time - (scene.end - lead)) / span));
}

/**
 * Monotone cubic interpolation (Fritsch-Carlson) through (xs[k], ys[k]).
 * Zero velocity at both ends, never overshoots, and keeps speed continuous at knots,
 * which is what makes the camera feel like one journey instead of stop-and-go cuts.
 */
export function monotoneCubic(xs: number[], ys: number[]): (x: number) => number {
  const n = xs.length;
  if (n < 2) throw new Error("monotoneCubic needs at least two knots");
  const h = xs.slice(1).map((x, i) => x - xs[i]);
  const d = h.map((hk, i) => (ys[i + 1] - ys[i]) / hk);
  const m = new Array<number>(n).fill(0);
  for (let k = 1; k < n - 1; k++) m[k] = d[k - 1] * d[k] <= 0 ? 0 : (d[k - 1] + d[k]) / 2;
  for (let k = 0; k < n - 1; k++) {
    if (d[k] === 0) { m[k] = 0; m[k + 1] = 0; continue; }
    const a = m[k] / d[k], b = m[k + 1] / d[k], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[k] = t * a * d[k]; m[k + 1] = t * b * d[k]; }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let k = 0;
    while (x > xs[k + 1]) k++;
    const t = (x - xs[k]) / h[k], t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[k] + (t3 - 2 * t2 + t) * h[k] * m[k]
      + (-2 * t3 + 3 * t2) * ys[k + 1] + (t3 - t2) * h[k] * m[k + 1];
  };
}

export function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** FNV-1a. Mix a product slug into the world seed so two films never share procedural geometry. */
export function hashString(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return hash | 0;
}

export function formatTimecode(frame: number, fps: number) {
  const total = Math.floor(frame / fps), ff = Math.floor(frame % fps);
  const mm = Math.floor(total / 60), ss = total % 60;
  return `00:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}:${String(ff).padStart(2, "0")}`;
}
