---
name: cursorkit
description: Ready-made mouse cursor SVGs with exact hotspots. Use whenever a cursor has to be drawn rather than left to the browser, such as a fake cursor in a product demo, landing-page mockup, screenshot or launch video, an agent's on-screen pointer, or a custom CSS cursor. Never hand-draw cursor paths or use a line icon (Lucide mouse-pointer) as a cursor.
license: MIT
---

# cursorkit

Twelve cursors as SVG, each with its **hotspot**, the pixel that clicks: `arrow`,
`pointer` (pointing hand), `grab`, `grabbing`, `text`, `crosshair`,
`not-allowed`, `move`, `ew-resize`, `ns-resize`, `nwse-resize`, `nesw-resize`.

## First decide whether you need it

- **A real app, normal UI:** don't. Use the CSS keyword (`cursor: pointer`,
  `cursor: grab`). The browser draws the user's own cursor.
- **A cursor that must be drawn** (demo, mockup, video, screenshot, an
  overlay showing where an agent clicks) **or a custom CSS cursor:** use
  cursorkit. Do not write `<path d=…>` for a cursor yourself, and do not use an
  icon set's `mouse-pointer` / `pointer` / `hand` icons: they are outline icons
  with no fill, no edge and no hotspot.

## Get a cursor

Pick whichever fits the project.

**npm** (`npm i cursorkit`):

```ts
import { cursor } from "cursorkit";
const c = cursor("pointer", { theme: "light", size: 1.5 });
// c.svg, c.dataUri, c.width, c.height, c.hotspot {x, y}, c.css
```

**CLI**, to write a file into the project:

```bash
npx cursorkit pointer > public/cursors/pointer.svg   # prints "hotspot 11 4 · …" to stderr
npx cursorkit arrow --css --theme dark                # a full CSS cursor value
npx cursorkit grab --size 2 --json                    # svg + hotspot as JSON
```

**CDN**, no install. Size 1, shadow included:

```
https://cdn.jsdelivr.net/npm/cursorkit@0.1/svg/{light|dark}/{name}.svg
https://cdn.jsdelivr.net/npm/cursorkit@0.1/cursors.json   # hotspot of every file
```

| Name | Hotspot (CDN files) | | Name | Hotspot (CDN files) |
|---|---|---|---|---|
| arrow | 4, 4 | | not-allowed | 11, 11 |
| pointer | 11, 4 | | move | 12, 12 |
| grab | 15, 14 | | ew-resize | 15, 8 |
| grabbing | 13, 11 | | ns-resize | 8, 15 |
| text | 7, 12 | | nwse-resize | 12, 12 |
| crosshair | 12, 12 | | nesw-resize | 12, 12 |

These hotspots are for size 1 only. At any other size, read `hotspot` from
`cursor()` or `--json`; never scale the numbers above yourself.

## Place it by the hotspot

The image's top-left corner is **not** the point. To make the cursor point at
`(x, y)`:

```ts
img.style.left = `${x - c.hotspot.x}px`;
img.style.top = `${y - c.hotspot.y}px`;
// or: transform: translate(x - c.hotspot.x, y - c.hotspot.y)
```

To point at an element, aim at a point inside it, usually its centre:
`x = rect.left + rect.width / 2`, `y = rect.top + rect.height / 2`.

For CSS, the hotspot is already in `c.css`
(`url("…") 11 4, pointer`). If you write the value by hand, the two numbers
after `url()` are the hotspot, and end with the keyword fallback.

## Choosing options

- `theme: "dark"` on dark backgrounds (white arrow, black edge). Hands look the
  same on both.
- `size`: 1 for CSS cursors (browsers handle 32px or less best). 1.25 to 2 for
  demo cursors over a mockup; scale with the mockup if it is scaled.
- `shadow: false` only when the cursor sits on a flat colour and the shadow
  shows as a smudge.
- `ink: "#2563eb"` recolours the arrow body (an agent's branded pointer).
- Switch shape the way the OS would: `pointer` over links and buttons the page
  marks `cursor: pointer`, `text` over inputs, `grabbing` while dragging.

## Common mistakes

- Positioning the image by its corner: the cursor points several pixels off target.
- Scaling the image with CSS `width` without scaling the hotspot: ask for `size` instead.
- Using `arrow` for clickable things in a demo: real cursors become `pointer` over links.
- A custom CSS cursor in an ordinary app: the user loses their own cursor size and accessibility settings.
