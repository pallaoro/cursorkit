/**
 * Writes the static files: svg/<theme>/<name>.svg at size 1 with the shadow,
 * and cursors.json, which holds each file's hotspot. They are what the CDN
 * serves, so a page or an agent can use a cursor without installing anything.
 *
 * Run after tsc (npm run build). The test suite fails if these drift from
 * what the code draws.
 */

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cursor, fallbackOf, names } from "../dist/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const THEMES = ["light", "dark"];

rmSync(join(root, "svg"), { recursive: true, force: true });
const manifest = {};
for (const theme of THEMES) mkdirSync(join(root, "svg", theme), { recursive: true });

for (const name of names) {
  const entry = { fallback: fallbackOf(name) };
  for (const theme of THEMES) {
    const c = cursor(name, { theme });
    const file = `svg/${theme}/${name}.svg`;
    writeFileSync(join(root, file), c.svg + "\n");
    entry[theme] = { file, width: c.width, height: c.height, hotspot: c.hotspot };
  }
  manifest[name] = entry;
}

writeFileSync(join(root, "cursors.json"), JSON.stringify(manifest, null, 2) + "\n");

// The README picture: every cursor at size 2 on a light row and a dark row.
// Each nested SVG gets its own filter id, since they share one document.
const CELL = 64;
let sheet = "";
THEMES.forEach((theme, row) => {
  sheet += `<rect y="${row * CELL}" width="${names.length * CELL}" height="${CELL}" fill="${theme === "light" ? "#ececf0" : "#202026"}"/>`;
  names.forEach((name, i) => {
    const c = cursor(name, { theme, size: 2 });
    const x = i * CELL + Math.round((CELL - c.width) / 2);
    const y = row * CELL + Math.round((CELL - c.height) / 2);
    sheet += c.svg.replace("<svg ", `<svg x="${x}" y="${y}" `).replaceAll("cursorkit-shadow", `shadow-${theme}-${name}`);
  });
});
mkdirSync(join(root, "assets"), { recursive: true });
writeFileSync(
  join(root, "assets/preview.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" width="${names.length * CELL}" height="${THEMES.length * CELL}">${sheet}</svg>\n`,
);
console.log(`wrote ${names.length * THEMES.length} SVGs, cursors.json and assets/preview.svg`);
