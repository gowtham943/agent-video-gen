import * as THREE from "three";

type Pt = [number, number];

const TOKEN = /([MmLlHhVvCcSsQqTtZz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;
const ARITY: Record<string, number> = {m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, z: 0};

/** Parse SVG path data (M L H V C S Q T Z, absolute or relative) into closed polylines. Pure and deterministic. */
export function parsePathData(d: string, curveSteps = 14): Pt[][] {
  const tokens: (string | number)[] = [];
  for (const match of d.matchAll(TOKEN)) tokens.push(match[1] ?? Number(match[2]));

  const subpaths: Pt[][] = [];
  let current: Pt[] = [];
  let x = 0, y = 0, startX = 0, startY = 0;
  let lastCubic: Pt | null = null, lastQuad: Pt | null = null;
  let command = "";
  let i = 0;

  const push = (px: number, py: number) => { current.push([px, py]); x = px; y = py; };
  const finish = () => { if (current.length > 2) subpaths.push(current); current = []; };
  const num = () => {
    const value = tokens[i++];
    if (typeof value !== "number") throw new Error(`Bad SVG path near "${String(value)}"`);
    return value;
  };

  while (i < tokens.length) {
    if (typeof tokens[i] === "string") command = tokens[i++] as string;
    else if (!command || command.toLowerCase() === "z") throw new Error("Bad SVG path: number without a command");
    const lower = command.toLowerCase();
    const rel = command === lower;
    const args = Array.from({length: ARITY[lower]}, num);
    const ox = rel ? x : 0, oy = rel ? y : 0;
    let nextCubic: Pt | null = null, nextQuad: Pt | null = null;

    if (lower === "m") {
      finish();
      push(args[0] + ox, args[1] + oy);
      startX = x; startY = y;
      command = rel ? "l" : "L";
    } else if (lower === "l") push(args[0] + ox, args[1] + oy);
    else if (lower === "h") push(args[0] + ox, y);
    else if (lower === "v") push(x, args[0] + oy);
    else if (lower === "c" || lower === "s") {
      const [x0, y0] = [x, y];
      const c1: Pt = lower === "s" ? (lastCubic ? [2 * x - lastCubic[0], 2 * y - lastCubic[1]] : [x, y]) : [args[0] + ox, args[1] + oy];
      const k = lower === "s" ? 0 : 2;
      const c2: Pt = [args[k] + ox, args[k + 1] + oy];
      const end: Pt = [args[k + 2] + ox, args[k + 3] + oy];
      for (let s = 1; s <= curveSteps; s++) {
        const t = s / curveSteps, u = 1 - t;
        push(u ** 3 * x0 + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * end[0],
             u ** 3 * y0 + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * end[1]);
      }
      nextCubic = c2;
    } else if (lower === "q" || lower === "t") {
      const [x0, y0] = [x, y];
      const c: Pt = lower === "t" ? (lastQuad ? [2 * x - lastQuad[0], 2 * y - lastQuad[1]] : [x, y]) : [args[0] + ox, args[1] + oy];
      const k = lower === "t" ? 0 : 2;
      const end: Pt = [args[k] + ox, args[k + 1] + oy];
      for (let s = 1; s <= curveSteps; s++) {
        const t = s / curveSteps, u = 1 - t;
        push(u * u * x0 + 2 * u * t * c[0] + t * t * end[0], u * u * y0 + 2 * u * t * c[1] + t * t * end[1]);
      }
      nextQuad = c;
    } else if (lower === "z") {
      finish();
      x = startX; y = startY;
    }
    lastCubic = nextCubic;
    lastQuad = nextQuad;
  }
  finish();
  return subpaths;
}

function inside(point: Pt, polygon: Pt[]) {
  let hit = false;
  for (let a = 0, b = polygon.length - 1; a < polygon.length; b = a++) {
    const [ax, ay] = polygon[a], [bx, by] = polygon[b];
    if ((ay > point[1]) !== (by > point[1]) && point[0] < ((bx - ax) * (point[1] - ay)) / (by - ay) + ax) hit = !hit;
  }
  return hit;
}

/**
 * Convert path data in a 24x24 box into centred, y-up shapes scaled so the box spans `size` world units.
 * A subpath whose centroid lies inside an earlier one becomes a hole in it.
 */
export function shapesFromPath(d: string, size = 6): THREE.Shape[] {
  const k = size / 24;
  const polys = parsePathData(d).map((poly) => poly.map(([px, py]): Pt => [(px - 12) * k, (12 - py) * k]));
  const outers: {poly: Pt[]; holes: Pt[][]}[] = [];
  for (const poly of polys) {
    const centroid: Pt = [poly.reduce((s, p) => s + p[0], 0) / poly.length, poly.reduce((s, p) => s + p[1], 0) / poly.length];
    const host = outers.find((outer) => inside(centroid, outer.poly));
    if (host) host.holes.push(poly); else outers.push({poly, holes: []});
  }
  return outers.map(({poly, holes}) => {
    const shape = new THREE.Shape(poly.map(([px, py]) => new THREE.Vector2(px, py)));
    shape.holes = holes.map((hole) => new THREE.Path(hole.map(([px, py]) => new THREE.Vector2(px, py))));
    return shape;
  });
}
