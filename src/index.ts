import { SHAPES, type CursorName, type Shape } from "./shapes.js";

export type { CursorName } from "./shapes.js";

export interface CursorOptions {
  /** `dark` draws for dark backgrounds: white arrow, black edge. Hands keep their colours. Default `light`. */
  theme?: "light" | "dark";
  /** Scale. 1 is about the size an OS draws its cursor. Default 1. */
  size?: number;
  /** Soft drop shadow under the cursor. Default true. */
  shadow?: boolean;
  /** Override the dark colour (the arrow's body, the hand's outline). */
  ink?: string;
  /** Override the light colour (the arrow's edge, the hand's body). */
  paper?: string;
}

export interface Cursor {
  name: CursorName;
  /** Standalone SVG document, `width` × `height` pixels. */
  svg: string;
  width: number;
  height: number;
  /**
   * The click point, in whole pixels from the SVG's top-left corner. Put this
   * point, not the corner, on the spot being clicked:
   * `left: x - hotspot.x; top: y - hotspot.y`.
   */
  hotspot: { x: number; y: number };
  /** `data:image/svg+xml,…` */
  dataUri: string;
  /** A complete value for the CSS `cursor` property, hotspot and fallback included. */
  css: string;
}

/** Every cursor, in a stable order. */
export const names = Object.keys(SHAPES) as CursorName[];

/** The CSS keyword each cursor stands for. */
export function fallbackOf(name: CursorName): string {
  return shapeOf(name).fallback;
}

// Outline width, and the room the shadow needs before (left, top) and after
// (right, bottom) the shape, all in pixels at size 1.
const OUTLINE = 1;
const SHADOW_BEFORE = 1.5;
const SHADOW_AFTER = 3.5;

export function cursor(name: CursorName, options: CursorOptions = {}): Cursor {
  const shape = shapeOf(name);
  const size = options.size ?? 1;
  if (!(Number.isFinite(size) && size > 0)) throw new RangeError(`size must be a positive number, got ${options.size}`);
  const shadow = options.shadow ?? true;

  const dark = options.theme === "dark" && !shape.fixed;
  const ink = options.ink ?? (dark ? "#fff" : "#000");
  const paper = options.paper ?? (dark ? "#000" : "#fff");
  const body = shape.fill === "ink" ? ink : paper;
  const edge = shape.fill === "ink" ? paper : ink;

  const [left, top, right, bottom] = shape.box;
  const [hx, hy] = shape.hotspot;
  // Plus one pixel at any size, so antialiasing never meets the image edge.
  const before = (OUTLINE + (shadow ? SHADOW_BEFORE : 0)) * size + 1;
  const after = (OUTLINE + (shadow ? SHADOW_AFTER : 0)) * size + 1;
  // The hotspot lands on a whole pixel, so the integer CSS hotspot is exact.
  const x = Math.ceil((hx - left) * size + before);
  const y = Math.ceil((hy - top) * size + before);
  const width = Math.ceil(x + (right - hx) * size + after);
  const height = Math.ceil(y + (bottom - hy) * size + after);

  const parts = shape.parts.join("");
  const filter = shadow ? ` filter="url(#cursorkit-shadow)"` : "";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    (shadow
      ? `<defs><filter id="cursorkit-shadow" x="-50%" y="-50%" width="200%" height="200%">` +
        `<feDropShadow dx="0" dy="1" stdDeviation="0.9" flood-color="#000" flood-opacity="0.35"/></filter></defs>`
      : "") +
    `<g transform="translate(${num(x - hx * size)} ${num(y - hy * size)}) scale(${num(size)})"${filter}>` +
    `<g fill="${edge}" stroke="${edge}" stroke-width="${2 * OUTLINE}" stroke-linejoin="round">${parts}</g>` +
    `<g fill="${body}">${parts}</g>` +
    (shape.lines
      ? `<g fill="none" stroke="${edge}" stroke-width="0.8" stroke-linecap="round">${shape.lines.join("")}</g>`
      : "") +
    `</g></svg>`;

  const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  return {
    name,
    svg,
    width,
    height,
    hotspot: { x, y },
    dataUri,
    css: `url("${dataUri}") ${x} ${y}, ${shape.fallback}`,
  };
}

/** Shorthand for `cursor(name, options).css`. */
export function cursorCss(name: CursorName, options?: CursorOptions): string {
  return cursor(name, options).css;
}

function shapeOf(name: CursorName): Shape {
  const shape: Shape | undefined = (SHAPES as Record<string, Shape>)[name];
  if (!shape) throw new RangeError(`Unknown cursor "${name}". Known: ${names.join(", ")}`);
  return shape;
}

function num(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}
