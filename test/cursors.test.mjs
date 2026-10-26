import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";

import { cursor, cursorCss, fallbackOf, names } from "../dist/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("every cursor renders, with a whole-pixel hotspot inside the image", () => {
  for (const name of names) {
    for (const size of [0.5, 1, 1.25, 2, 3.3]) {
      const c = cursor(name, { size });
      assert.ok(Number.isInteger(c.hotspot.x) && Number.isInteger(c.hotspot.y), `${name}@${size}`);
      assert.ok(c.hotspot.x >= 0 && c.hotspot.x < c.width, `${name}@${size} x`);
      assert.ok(c.hotspot.y >= 0 && c.hotspot.y < c.height, `${name}@${size} y`);
      assert.match(c.svg, new RegExp(`^<svg [^>]*width="${c.width}" height="${c.height}"`));
    }
  }
});

test("css is a complete cursor value: image, hotspot, keyword fallback", () => {
  const c = cursor("pointer");
  assert.equal(c.css, `url("${c.dataUri}") ${c.hotspot.x} ${c.hotspot.y}, pointer`);
  assert.equal(decodeURIComponent(c.dataUri.slice("data:image/svg+xml,".length)), c.svg);
  assert.equal(cursorCss("text", { theme: "dark" }), cursor("text", { theme: "dark" }).css);
  assert.equal(fallbackOf("arrow"), "default");
});

test("dark swaps the arrow's colours; hands keep theirs", () => {
  assert.match(cursor("arrow").svg, /<g fill="#000">/);
  assert.match(cursor("arrow", { theme: "dark" }).svg, /<g fill="#fff">/);
  assert.equal(cursor("pointer", { theme: "dark" }).svg, cursor("pointer").svg);
  assert.match(cursor("arrow", { ink: "#2563eb" }).svg, /<g fill="#2563eb">/);
});

test("bad input fails loudly", () => {
  assert.throws(() => cursor("hand"), /Unknown cursor "hand"/);
  assert.throws(() => cursor("arrow", { size: 0 }), RangeError);
  assert.throws(() => cursor("arrow", { size: NaN }), RangeError);
});

test("svg/ and cursors.json match what the code draws", () => {
  const manifest = JSON.parse(readFileSync(join(root, "cursors.json"), "utf8"));
  assert.deepEqual(Object.keys(manifest), names);
  for (const name of names) {
    for (const theme of ["light", "dark"]) {
      const c = cursor(name, { theme });
      const entry = manifest[name][theme];
      assert.equal(readFileSync(join(root, entry.file), "utf8"), c.svg + "\n", `${entry.file} is stale: npm run build`);
      assert.deepEqual(entry.hotspot, c.hotspot);
    }
  }
});

test("cli prints svg, css and json", () => {
  const bin = join(root, "bin/cursorkit.mjs");
  const svg = spawnSync(process.execPath, [bin, "grab"], { encoding: "utf8" });
  assert.equal(svg.stdout.trim(), cursor("grab").svg);
  assert.match(svg.stderr, /^hotspot \d+ \d+/);
  const css = execFileSync(process.execPath, [bin, "arrow", "--css", "--theme", "dark"], { encoding: "utf8" });
  assert.equal(css.trim(), cursor("arrow", { theme: "dark" }).css);
  const json = JSON.parse(execFileSync(process.execPath, [bin, "move", "--json", "--size", "2"], { encoding: "utf8" }));
  assert.deepEqual(json.hotspot, cursor("move", { size: 2 }).hotspot);
  assert.equal(spawnSync(process.execPath, [bin, "nope"]).status, 1);
});

// --- Pixels. The hotspot claims are checked against a real rasteriser. -----

const hasRsvg = spawnSync("rsvg-convert", ["--version"]).status === 0;

// What the hotspot means for each shape.
const TIP = new Set(["arrow", "pointer"]); // nothing above (or left of) the tip but the outline
const PALM = new Set(["grab", "grabbing"]); // inside the hand's body
// everything else: the centre of what is drawn

test("the hotspot is where the drawing says it is", { skip: !hasRsvg && "rsvg-convert not installed" }, () => {
  const size = 4;
  const edge = 1 * size + 1; // outline width plus antialiasing
  for (const name of names) {
    const c = cursor(name, { size, shadow: false });
    const img = raster(c.svg);
    const { x, y } = c.hotspot;
    const at = (px, py) => img.data.subarray((py * img.width + px) * 4, (py * img.width + px) * 4 + 4);

    assert.ok(at(x, y)[3] > 200, `${name}: hotspot pixel is not on the cursor`);

    let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
    for (let py = 0; py < img.height; py++) {
      for (let px = 0; px < img.width; px++) {
        // A curve that ends exactly on a pixel boundary leaks alpha 1 or 2 into
        // the next pixel; a shape that is really cut off leaves it near opaque.
        if (at(px, py)[3] <= 8) continue;
        assert.ok(px > 0 && py > 0 && px < img.width - 1 && py < img.height - 1, `${name}: clipped at ${px},${py}`);
        minX = Math.min(minX, px); maxX = Math.max(maxX, px);
        minY = Math.min(minY, py); maxY = Math.max(maxY, py);
      }
    }

    if (TIP.has(name)) {
      assert.ok(y - minY <= edge, `${name}: drawn ${y - minY}px above the tip`);
      if (name === "arrow") assert.ok(x - minX <= edge, `arrow: drawn ${x - minX}px left of the tip`);
    } else if (PALM.has(name)) {
      const [r, g, b] = at(x, y);
      assert.ok(r > 200 && g > 200 && b > 200, `${name}: hotspot is not on the palm`);
    } else {
      const cx = (minX + maxX + 1) / 2, cy = (minY + maxY + 1) / 2;
      assert.ok(Math.abs(cx - x) <= 1 && Math.abs(cy - y) <= 1, `${name}: hotspot ${x},${y} vs centre ${cx},${cy}`);
    }
  }
});

test("the shadow fits inside the image", { skip: !hasRsvg && "rsvg-convert not installed" }, () => {
  for (const name of names) {
    for (const size of [1, 2]) {
      const img = raster(cursor(name, { size }).svg);
      for (let px = 0; px < img.width; px++) {
        for (const py of [0, img.height - 1]) assert.ok(img.data[(py * img.width + px) * 4 + 3] < 40, `${name}@${size}`);
      }
      for (let py = 0; py < img.height; py++) {
        for (const px of [0, img.width - 1]) assert.ok(img.data[(py * img.width + px) * 4 + 3] < 40, `${name}@${size}`);
      }
    }
  }
});

/** SVG → { width, height, data: RGBA bytes } via rsvg-convert and a minimal PNG decoder. */
function raster(svg) {
  const png = execFileSync("rsvg-convert", ["--format", "png"], { input: svg });
  let width = 0, height = 0, idat = [];
  for (let off = 8; off < png.length; ) {
    const len = png.readUInt32BE(off);
    const type = png.toString("ascii", off + 4, off + 8);
    const body = png.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      assert.equal(body[8], 8, "8-bit");
      assert.equal(body[9], 6, "RGBA");
    } else if (type === "IDAT") idat.push(body);
    off += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const data = Buffer.alloc(stride * height);
  for (let row = 0; row < height; row++) {
    const filter = raw[row * (stride + 1)];
    for (let i = 0; i < stride; i++) {
      const v = raw[row * (stride + 1) + 1 + i];
      const a = i >= 4 ? data[row * stride + i - 4] : 0;
      const b = row ? data[(row - 1) * stride + i] : 0;
      const c = row && i >= 4 ? data[(row - 1) * stride + i - 4] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pred = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][filter];
      data[row * stride + i] = (v + pred) & 0xff;
    }
  }
  return { width, height, data };
}
