export type MotifName =
  | "document" | "scan" | "lattice" | "constellation" | "panels"
  | "portals" | "skyline" | "orbit" | "stream" | "screen"
  | "icon" | "device" | "media";

export type IconName =
  | "shield" | "bolt" | "heart" | "cloud" | "pin" | "star" | "leaf" | "drop" | "flame"
  | "chat" | "lock" | "home" | "user" | "cart" | "doc" | "bars" | "gear" | "sun" | "rocket" | "check";

export type DeviceName = "phone" | "laptop" | "monitor";

export type AccentName = "primary" | "secondary" | "highlight";
export type Align = "left" | "right" | "center";

export interface Theme {
  background: string;
  primary: string;
  secondary: string;
  highlight: string;
  ink: string;
  text: string;
  font: string;
}

export interface Brand {
  name: string;
  /** Relative URL such as "./assets/logo.png". Omit to render a text wordmark. */
  logo?: string | null;
  hudLabel?: string;
}

export interface SourcedClaim {
  text: string;
  source: string;
}

export interface ClaimsPolicy {
  /** Phrases that must never appear in on-screen copy. */
  forbidden?: string[];
  /** Phrases that must appear. `scope: "last"` limits the check to the final scene. */
  required?: {phrase: string; scope?: "any" | "last"}[];
  /** Numeric or superlative statements the user has approved, each with a source. */
  sourced?: SourcedClaim[];
}

export interface VideoScene {
  motif: MotifName;
  duration: number;
  chapter: string;
  eyebrow: string;
  heading: string;
  body?: string;
  /** Pill-shaped call to action. Rendered large; best on the closing scene. */
  action?: string;
  /** Small mono line under the action, for availability or legal notes. */
  footnote?: string;
  accent?: AccentName;
  align?: Align;
  /** Index into `pillars` to highlight while this scene is active. */
  pillar?: number;
  /** Product-specific words drawn inside the 3D visual (feature, integration, or concept names). */
  items?: string[];
  /** Relative image URLs (`./assets/...`) shown by `media`, `device`, and `screen` motifs. */
  images?: string[];
  /** Built-in icon for the `icon` motif. */
  icon?: IconName;
  /** Custom icon as SVG path data in a 24x24 box (M L H V C S Q T Z, absolute or relative). Overrides `icon`. */
  iconPath?: string;
  /** Frame for the `device` motif. Defaults to `laptop`. */
  device?: DeviceName;
}

export interface Look {
  /** Bloom strength, 0 to 1.5. Default 0.58. */
  bloom?: number;
  /** Fog density, 0.004 to 0.03. Default 0.0145. */
  fog?: number;
  /** Background particle field. Default "particles". */
  dust?: "particles" | "none";
  /** Tone-mapping exposure, 0.7 to 1.4. Default 1.02. */
  exposure?: number;
}

export interface VideoConfig {
  schema: 2;
  slug: string;
  title: string;
  brand: Brand;
  theme: Theme;
  fps: number;
  width: number;
  height: number;
  seed: number;
  pillars?: string[];
  look?: Look;
  claims?: ClaimsPolicy;
  scenes: VideoScene[];
}

export interface TimedScene extends VideoScene {
  start: number;
  end: number;
  index: number;
}
