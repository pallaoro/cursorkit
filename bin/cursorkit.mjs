#!/usr/bin/env node
/**
 * cursorkit CLI: print a cursor as SVG, as a CSS value, or as JSON.
 *
 * Exists so an agent (or a shell) can drop a correct cursor into a project
 * without drawing one:
 *
 *   npx @pallaoro/cursorkit pointer > public/cursors/pointer.svg
 *   npx @pallaoro/cursorkit arrow --css --theme dark
 *   npx @pallaoro/cursorkit list
 */

import { cursor, fallbackOf, names } from "../dist/index.js";

const argv = process.argv.slice(2);

if (!argv.length || argv.includes("-h") || argv.includes("--help")) {
  console.log(`cursorkit: mouse cursors as SVG, with the click point as data

Usage
  cursorkit <name> [options]     print the SVG; hotspot and size go to stderr
  cursorkit list                 every name, with the CSS keyword it stands for

Options
  --css              print a value for the CSS cursor property instead
  --json             print { name, svg, width, height, hotspot, css } instead
  --theme <t>        light (default) | dark
  --size <n>         scale, 1 = OS size (default 1)
  --no-shadow        no drop shadow
  -h, --help         this message

Names
  ${names.join(", ")}

Examples
  cursorkit pointer > public/cursors/pointer.svg
  cursorkit arrow --css --theme dark
  cursorkit grab --size 2 --json`);
  process.exit(argv.length ? 0 : 1);
}

/** Single left-to-right pass: value flags consume the next token, the rest are boolean. */
const VALUE_FLAGS = new Set(["theme", "size"]);
const opts = {};
const positional = [];

for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (!arg.startsWith("--")) {
    positional.push(arg);
    continue;
  }
  const name = arg.slice(2);
  if (VALUE_FLAGS.has(name)) {
    const value = argv[++i];
    if (value === undefined) {
      console.error(`--${name} needs a value`);
      process.exit(2);
    }
    opts[name] = value;
  } else {
    opts[name] = true;
  }
}

const [name] = positional;

if (name === "list") {
  for (const n of names) console.log(`${n.padEnd(12)} ${fallbackOf(n)}`);
  process.exit(0);
}

if (!names.includes(name)) {
  console.error(`Unknown cursor "${name}". Known: ${names.join(", ")}`);
  process.exit(1);
}
if (opts.theme !== undefined && opts.theme !== "light" && opts.theme !== "dark") {
  console.error(`--theme must be light or dark`);
  process.exit(2);
}

let c;
try {
  c = cursor(name, {
    theme: opts.theme,
    size: opts.size === undefined ? undefined : Number(opts.size),
    shadow: !opts["no-shadow"],
  });
} catch (err) {
  console.error(err.message);
  process.exit(2);
}

if (opts.json) {
  const { dataUri, ...rest } = c;
  console.log(JSON.stringify(rest, null, 2));
} else if (opts.css) {
  console.log(c.css);
} else {
  console.log(c.svg);
  console.error(`hotspot ${c.hotspot.x} ${c.hotspot.y} · ${c.width}×${c.height} · falls back to ${fallbackOf(name)}`);
}
