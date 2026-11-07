# arcadedemo

Minimal demo of the arcade platform of the **svision** library — the common
ground of the raster arcade remakes (Space Invaders, Stinger, Pleiads). It is
not a game and has no original to measure against; it is a sandbox where the
platform's scaling, bezel, colour overlay and display styles can be seen.

What it shows:

1. **The raster** — 224×256 in portrait (`ArcadePlatform`), scaled by a whole
   number from 2× up and centred in a black bezel; on a phone in portrait the
   ratio stays fractional so the raster fills the display.
2. **A test pattern** (`TestPatternEntity`, a `RasterEntity`) — a one pixel
   frame and checkerboard, a grid of single pixels, lines 1–3 pixels wide, a
   circle for square pixels, bars of greys and primaries.
3. **The overlay** — two cellophane bands, red and green, multiplied over the
   picture (`ArcadeLayout.paintOverlay`): white under a band takes its colour,
   black stays black. `O` switches it, the choice is kept in a cookie.
4. **Motion** — two discs (`BallEntity`) moving a pixel a frame at 60 Hz, to see
   that integer scaling does not stutter and how a moving object changes colour
   under the bands.
5. **Display styles** — `C` cycles sharp → crt → grid → retro
   (`Canvas2DLayout.displayStyle`).
6. **Another raster** — `R` switches to 208×256 (Pleiads) and back; the
   platform's config changes and the model is rebuilt.

The bottom lines show the ratio, the element size, the overlay switch and the
style.

## Running

```
php -S localhost:8080        # in the arcadedemo root
```

`config/config.php` has `$devMode = true`, so the sources in `app/` are loaded
directly; no bundle is needed.

## What is where

| file | what it does |
|---|---|
| `app/appPlatform.js` | `new ArcadePlatform({width: 224, height: 256, overlay: {...}})` |
| `app/mainApp.js` | the two small fonts, `setModel('DemoModel')` |
| `app/demoModel.js` | the pattern, the discs, the keys, `drawModel()` with the overlay |
| `app/testPatternEntity.js` | the static pattern, painted once |
| `app/ballEntity.js` | a bouncing disc |
| `app/main.js` | identical in every project (R-002) — do not edit locally |
