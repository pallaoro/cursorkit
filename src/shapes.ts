/**
 * The cursor drawings. Units are CSS pixels at size 1, roughly the size an
 * operating system draws its own cursors.
 *
 * A shape is drawn from overlapping pieces (a finger, a palm, a bar) rather
 * than one hand-traced outline: the renderer strokes all of them in the edge
 * colour, then fills all of them on top, so the union gets one clean outline
 * and the seams between pieces vanish. `lines` puts back the seams that should
 * show, such as the gaps between fingers.
 *
 * These are original drawings. Do not paste in paths from macOS or Windows
 * cursors: those are the vendors' artwork.
 */

export type Role = "ink" | "paper";

export interface Shape {
  /** The CSS keyword this cursor stands for, and falls back to. */
  readonly fallback: string;
  /** Bounding box of the pieces: [left, top, right, bottom]. */
  readonly box: readonly [number, number, number, number];
  /** The point that clicks. */
  readonly hotspot: readonly [number, number];
  /** Which colour fills the silhouette; the outline takes the other one. */
  readonly fill: Role;
  /** Keeps its light-theme colours on dark backgrounds, as hands do on every OS. */
  readonly fixed?: boolean;
  /** Filled pieces whose union is the silhouette. No paint attributes. */
  readonly parts: readonly string[];
  /** Edge-coloured strokes drawn over the fill. */
  readonly lines?: readonly string[];
}

const rect = (x: number, y: number, w: number, h: number, r = 0, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}"${r ? ` rx="${r}"` : ""}${extra}/>`;
const line = (x1: number, y1: number, x2: number, y2: number) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;

// A horizontal double arrow centred on the origin; the four resize cursors are
// this one turned.
const DOUBLE_ARROW = [
  rect(-8, -0.75, 16, 1.5),
  `<path d="M-11 0L-7 -4V4Z"/>`,
  `<path d="M11 0L7 4V-4Z"/>`,
];
const turned = (deg: number) => [`<g transform="rotate(${deg})">${DOUBLE_ARROW.join("")}</g>`];
// The arrowhead tips and corners all land within 7.8 of the centre at 45°.
const DIAGONAL_BOX = [-7.8, -7.8, 7.8, 7.8] as const;

export const SHAPES = {
  arrow: {
    fallback: "default",
    box: [0, 0, 12.8, 18.6],
    hotspot: [0, 0],
    fill: "ink",
    parts: [`<path d="M0 0L0 16.2 4.3 12.3 7.1 18.6 9.9 17.4 7.2 11.2 12.8 11.2Z"/>`],
  },
  pointer: {
    fallback: "pointer",
    box: [-0.6, 0, 18.5, 21],
    hotspot: [6.75, 0],
    fill: "paper",
    fixed: true,
    parts: [
      rect(5, 0, 3.5, 13, 1.75),
      rect(8.5, 6, 3.5, 7, 1.75),
      rect(12, 7, 3.5, 6.5, 1.75),
      rect(15.5, 8.5, 3, 5.5, 1.5),
      `<path d="M5 10H18.5V15.5Q18.5 18.5 16.5 19.5V21H7.5V19.5Q5.5 18.5 4.5 16Z"/>`,
      rect(1.45, 9.8, 3.5, 8, 1.75, ` transform="rotate(-40 3.2 13.8)"`),
    ],
    lines: [line(8.5, 8.4, 8.5, 11.8), line(12, 9.4, 12, 11.8), line(15.5, 10.6, 15.5, 12.2)],
  },
  grab: {
    fallback: "grab",
    box: [-0.3, 1.5, 17, 21],
    hotspot: [10.5, 12],
    fill: "paper",
    fixed: true,
    parts: [
      rect(4.5, 3, 3.2, 10, 1.6),
      rect(7.7, 1.5, 3.2, 11, 1.6),
      rect(10.9, 2.5, 3.2, 10, 1.6),
      rect(14.1, 5, 2.9, 8, 1.45),
      `<path d="M4.5 10H17V15Q17 18.5 14.5 20V21H7.5V20Q4.8 18.5 4.2 15.5Z"/>`,
      rect(1.4, 9.75, 3.2, 7.5, 1.6, ` transform="rotate(-35 3 13.5)"`),
    ],
    lines: [line(7.7, 5.2, 7.7, 11), line(10.9, 4.7, 10.9, 11), line(14.1, 7, 14.1, 11)],
  },
  grabbing: {
    fallback: "grabbing",
    box: [1.3, 5, 17, 20],
    hotspot: [10.5, 12],
    fill: "paper",
    fixed: true,
    parts: [
      rect(4.5, 5, 3.2, 6, 1.6),
      rect(7.7, 5, 3.2, 6, 1.6),
      rect(10.9, 5, 3.2, 6, 1.6),
      rect(14.1, 5.5, 2.9, 5.5, 1.45),
      `<path d="M4.5 8H17V14Q17 17.5 14.5 19V20H7.5V19Q4.8 17.5 4.2 14.5Z"/>`,
      rect(1.6, 9.2, 5, 3.4, 1.7, ` transform="rotate(-20 4.1 10.9)"`),
    ],
    lines: [line(7.7, 7.2, 7.7, 9.5), line(10.9, 7.2, 10.9, 9.5), line(14.1, 7.6, 14.1, 9.5)],
  },
  text: {
    fallback: "text",
    box: [1, 0, 7, 17],
    hotspot: [4, 8.5],
    fill: "ink",
    parts: [rect(3.25, 1, 1.5, 15), rect(1, 0, 6, 1.5), rect(1, 15.5, 6, 1.5)],
  },
  crosshair: {
    fallback: "crosshair",
    box: [0, 0, 17, 17],
    hotspot: [8.5, 8.5],
    fill: "ink",
    parts: [rect(0, 7.75, 17, 1.5), rect(7.75, 0, 1.5, 17)],
  },
  "not-allowed": {
    fallback: "not-allowed",
    box: [0.5, 0.5, 15.5, 15.5],
    hotspot: [8, 8],
    fill: "ink",
    parts: [
      `<path fill-rule="evenodd" d="M8 0.5A7.5 7.5 0 1 1 7.99 0.5ZM8 2.5A5.5 5.5 0 1 0 8.01 2.5Z"/>`,
      rect(7, 2, 2, 12, 0, ` transform="rotate(-45 8 8)"`),
    ],
  },
  move: {
    fallback: "move",
    box: [0, 0, 16, 16],
    hotspot: [8, 8],
    fill: "ink",
    parts: [
      rect(7, 3, 2, 10),
      rect(3, 7, 10, 2),
      `<path d="M8 0L11 3.5H5Z"/>`,
      `<path d="M8 16L5 12.5H11Z"/>`,
      `<path d="M0 8L3.5 5V11Z"/>`,
      `<path d="M16 8L12.5 11V5Z"/>`,
    ],
  },
  "ew-resize": {
    fallback: "ew-resize",
    box: [-11, -4, 11, 4],
    hotspot: [0, 0],
    fill: "ink",
    parts: DOUBLE_ARROW,
  },
  "ns-resize": {
    fallback: "ns-resize",
    box: [-4, -11, 4, 11],
    hotspot: [0, 0],
    fill: "ink",
    parts: turned(90),
  },
  "nwse-resize": {
    fallback: "nwse-resize",
    box: DIAGONAL_BOX,
    hotspot: [0, 0],
    fill: "ink",
    parts: turned(45),
  },
  "nesw-resize": {
    fallback: "nesw-resize",
    box: DIAGONAL_BOX,
    hotspot: [0, 0],
    fill: "ink",
    parts: turned(-45),
  },
} as const satisfies Record<string, Shape>;

export type CursorName = keyof typeof SHAPES;
