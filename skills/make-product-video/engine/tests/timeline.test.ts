import {describe, expect, it} from "vitest";
import {buildTimeline, formatTimecode, hashString, monotoneCubic, motifEnergy, motifExit, sceneVisibility, seededRandom, totalDuration} from "../src/timeline";
import type {VideoScene} from "../src/types";

const scene = (duration: number): VideoScene => ({motif: "document", duration, chapter: "A", eyebrow: "A", heading: "One"});
const scenes = [scene(4), scene(6)];

describe("timeline", () => {
  it("builds contiguous scene ranges", () => {
    const timeline = buildTimeline(scenes);
    expect(timeline[0]).toMatchObject({start: 0, end: 4, index: 0});
    expect(timeline[1]).toMatchObject({start: 4, end: 10, index: 1});
    expect(totalDuration(scenes)).toBe(10);
  });

  it("is deterministic and fully visible away from a cut", () => {
    const first = buildTimeline(scenes)[0];
    expect(sceneVisibility(2, first).opacity).toBe(1);
    expect(sceneVisibility(2, first)).toEqual(sceneVisibility(2, first));
  });

  it("fades cleanly at boundaries", () => {
    const first = buildTimeline(scenes)[0];
    expect(sceneVisibility(0, first).opacity).toBe(0);
    expect(sceneVisibility(4, first).opacity).toBe(0);
    expect(sceneVisibility(0.72, first).opacity).toBeCloseTo(1, 4);
  });

  it("forms a motif before its scene and departs near the end", () => {
    const second = buildTimeline(scenes)[1];
    expect(motifEnergy(second.start - 1.5, second)).toBe(0);
    expect(motifEnergy(second.start + 2, second)).toBeGreaterThan(0.99);
    expect(motifExit(second.start + 1, second)).toBe(0);
    expect(motifExit(second.end + 2, second)).toBe(1);
  });

  it("formats timecode as HH:MM:SS:FF", () => {
    expect(formatTimecode(0, 30)).toBe("00:00:00:00");
    expect(formatTimecode(30 * 65 + 7, 30)).toBe("00:01:05:07");
  });
});

describe("monotoneCubic", () => {
  const xs = [0, 4, 9, 14, 20];
  const ys = [0, 0.25, 0.5, 0.75, 1];
  const f = monotoneCubic(xs, ys);

  it("passes through every knot with zero-velocity ends", () => {
    xs.forEach((x, i) => expect(f(x)).toBeCloseTo(ys[i], 10));
    expect(f(0.01)).toBeLessThan(0.001);
    expect(f(19.99)).toBeGreaterThan(0.999);
  });

  it("never decreases and never overshoots", () => {
    let last = -1;
    for (let t = 0; t <= 20; t += 0.05) {
      const value = f(t);
      expect(value).toBeGreaterThanOrEqual(last - 1e-12);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
      last = value;
    }
  });

  it("clamps outside the range", () => {
    expect(f(-5)).toBe(0);
    expect(f(99)).toBe(1);
  });
});

describe("seededRandom", () => {
  it("repeats for the same seed and differs across seeds", () => {
    const a = seededRandom(7), b = seededRandom(7), c = seededRandom(8);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(seededRandom(7)()).not.toBe(c());
  });
});

describe("hashString", () => {
  it("is stable and differs across product names", () => {
    expect(hashString("acme")).toBe(hashString("acme"));
    expect(hashString("acme")).not.toBe(hashString("other"));
  });
});
