import {describe, expect, it} from "vitest";
import {ICONS, ICON_NAMES} from "../src/icons";
import {parsePathData, shapesFromPath} from "../src/svgPath";

describe("svg path parser", () => {
  it("handles absolute, relative, and shorthand commands", () => {
    const [square] = parsePathData("M0 0H10v10h-10Z");
    expect(square).toEqual([[0, 0], [10, 0], [10, 10], [0, 10]]);
    const [curve] = parsePathData("M0 0C0 5 5 10 10 10S20 5 20 0Z", 4);
    expect(curve.at(-1)).toEqual([20, 0]);
  });

  it("treats a subpath inside another as a hole", () => {
    const shapes = shapesFromPath("M2 2H22V22H2ZM8 8V16H16V8Z");
    expect(shapes).toHaveLength(1);
    expect(shapes[0].holes).toHaveLength(1);
  });

  it("rejects malformed data", () => {
    expect(() => parsePathData("10 10 L 5")).toThrow();
  });
});

describe.each(ICON_NAMES)("icon %s", (name) => {
  it("parses to non-degenerate shapes within the 24 box", () => {
    const shapes = shapesFromPath(ICONS[name], 24);
    expect(shapes.length).toBeGreaterThan(0);
    for (const shape of shapes) for (const p of shape.getPoints()) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(12.5);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(12.5);
      expect(Number.isFinite(p.x + p.y)).toBe(true);
    }
  });
});
