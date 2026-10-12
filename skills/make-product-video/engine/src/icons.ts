import type {IconName} from "./types";

const polygon = (points: [number, number][]) => `M${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join("L")}Z`;

function star(points = 5, outer = 10.5, inner = 4.4) {
  const out: [number, number][] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer, a = (Math.PI * i) / points - Math.PI / 2;
    out.push([12 + Math.cos(a) * r, 12.8 + Math.sin(a) * r]);
  }
  return polygon(out);
}

function gear(teeth = 8, outer = 10.5, inner = 8, hole = 3.6) {
  const out: [number, number][] = [];
  for (let i = 0; i < teeth; i++) {
    const a = (Math.PI * 2 * i) / teeth, w = (Math.PI * 2) / teeth;
    for (const [da, r] of [[-0.3, inner], [-0.17, outer], [0.17, outer], [0.3, inner]] as [number, number][]) {
      out.push([12 + Math.cos(a + da * w * 2) * r, 12 + Math.sin(a + da * w * 2) * r]);
    }
  }
  const ring: [number, number][] = Array.from({length: 20}, (_, i) => [12 + Math.cos((Math.PI * 2 * i) / 20) * hole, 12 + Math.sin((Math.PI * 2 * i) / 20) * hole]);
  return `${polygon(out)}${polygon(ring)}`;
}

function sun() {
  const core: [number, number][] = Array.from({length: 24}, (_, i) => [12 + Math.cos((Math.PI * 2 * i) / 24) * 5, 12 + Math.sin((Math.PI * 2 * i) / 24) * 5]);
  const rays = Array.from({length: 8}, (_, i) => {
    const a = (Math.PI * 2 * i) / 8, c = Math.cos(a), s = Math.sin(a);
    const at = (r: number, side: number): [number, number] => [12 + c * r - s * side, 12 + s * r + c * side];
    return polygon([at(7.4, -0.9), at(10.8, -0.9), at(10.8, 0.9), at(7.4, 0.9)]);
  });
  return `${polygon(core)}${rays.join("")}`;
}

/** Simple filled glyphs in a 24x24 box (y down). Holes are separate subpaths inside the outline. */
export const ICONS: Record<IconName, string> = {
  shield: "M12 2L20.5 5.2V11.4C20.5 16.4 17 20.4 12 22C7 20.4 3.5 16.4 3.5 11.4V5.2Z",
  bolt: "M13.5 2L4.5 13.5H11L9.8 22L19.5 10H13Z",
  heart: "M12 21C6 16.2 2.5 12.8 2.5 8.6C2.5 5.6 4.7 3.5 7.4 3.5C9.4 3.5 11.1 4.6 12 6.2C12.9 4.6 14.6 3.5 16.6 3.5C19.3 3.5 21.5 5.6 21.5 8.6C21.5 12.8 18 16.2 12 21Z",
  cloud: "M7 19C4.2 19 2 16.8 2 14.1C2 11.6 3.9 9.6 6.3 9.3C7.1 6.3 9.7 4 13 4C16.4 4 19.1 6.5 19.5 9.7C21.4 10.2 22.8 11.9 22.8 14C22.8 16.7 20.7 19 18 19Z",
  pin: "M12 2C8.1 2 5 5.1 5 9C5 14.2 12 22 12 22C12 22 19 14.2 19 9C19 5.1 15.9 2 12 2ZM12 6.2C13.8 6.2 15.2 7.6 15.2 9.4C15.2 11.2 13.8 12.6 12 12.6C10.2 12.6 8.8 11.2 8.8 9.4C8.8 7.6 10.2 6.2 12 6.2Z",
  star: star(),
  leaf: "M4 20C4 11 10 4 20 4C20 14 14 20 4 20ZM6.5 17.5L15 9L16 10L7.5 18.5Z",
  drop: "M12 2C12 2 5 10 5 15C5 18.9 8.1 22 12 22C15.9 22 19 18.9 19 15C19 10 12 2 12 2Z",
  flame: "M12 2C13.2 6.2 17.5 8.4 17.5 13.4C17.5 16.8 15.1 19.5 12 19.5C8.9 19.5 6.5 17.2 6.5 14C6.5 11.9 7.6 10.2 8.8 9C9 10.6 9.8 11.6 10.9 11.8C10.4 8.6 10.5 5 12 2ZM12 21.5C10 21.5 8.5 20.8 7.4 19.6H16.6C15.5 20.8 14 21.5 12 21.5Z",
  chat: "M4 4H20C21.1 4 22 4.9 22 6V16C22 17.1 21.1 18 20 18H10L5 22V18H4C2.9 18 2 17.1 2 16V6C2 4.9 2.9 4 4 4Z",
  lock: "M5 10H19V21H5ZM8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10H14V7C14 5.9 13.1 5 12 5C10.9 5 10 5.9 10 7V10Z",
  home: "M12 3L2 12H5V21H10V15H14V21H19V12H22Z",
  user: "M12 3C9.8 3 8 4.8 8 7C8 9.2 9.8 11 12 11C14.2 11 16 9.2 16 7C16 4.8 14.2 3 12 3ZM20 21C20 16.6 16.4 13 12 13C7.6 13 4 16.6 4 21Z",
  cart: "M5 8H19L20 21H4ZM8 8V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V8H14V7C14 5.9 13.1 5 12 5C10.9 5 10 5.9 10 7V8Z",
  doc: "M5 2H15L20 7V22H5ZM14 3.5V8H18.5ZM8 12V13.6H17V12ZM8 15.5V17.1H17V15.5Z",
  bars: "M3 13H8V21H3ZM9.5 3H14.5V21H9.5ZM16 8H21V21H16Z",
  gear: gear(),
  sun: sun(),
  rocket: "M12 2C15.5 4.5 17 8.5 17 12.5V16H7V12.5C7 8.5 8.5 4.5 12 2ZM12 7C10.9 7 10 7.9 10 9C10 10.1 10.9 11 12 11C13.1 11 14 10.1 14 9C14 7.9 13.1 7 12 7ZM7 14L3.5 18V20.5L7 19ZM17 14L20.5 18V20.5L17 19ZM10 17H14L12 22Z",
  check: "M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM6.8 12.4L8.2 11L10.8 13.6L16.2 8.2L17.6 9.6L10.8 16.4Z"
};

export const ICON_NAMES = Object.keys(ICONS) as IconName[];
