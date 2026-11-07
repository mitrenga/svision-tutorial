# snesdemo

Minimal demo of the Super Nintendo platform of the **svision** library
(R-050) — the common ground for games of the SNES / Super Famicom. It is
not a game and has no original to measure against; it is a sandbox where
the SNES layer can be seen. The first game on the platform, `super-r-type`,
is measured against the emulator pixel by pixel; this demo shows the same
classes doing the same things by hand.

What it shows, on one screen laid out like *Super R-Type*:

1. **The PPU over its own memory** (`SNESPPU`, `SNESPPUEntity`): tiles,
   maps, colours and sprites written into VRAM, CGRAM and OAM, the
   registers set, the chip left to make the 256×224 picture line by line.
2. **Mode 1** — BG1 (the ground, 4 bpp, a 64×64 map) scrolling a pixel a
   frame, BG2 (stars, 4 bpp) scrolling half as fast, BG3 (the text, 2 bpp)
   still; the status lines at the bottom sit **in front of everything**
   through the BG3 priority bit, the way the game's panel sits over the
   terrain (`P` switches it off and they drop behind the ground).
3. **Sprites with the limits of the chip** — a 16×16 ship on a figure of
   eight and a row of drones on one line. `↑`/`↓` (or a tap) change their
   number: past 17 drones the line wants more than 34 tiles and the chip
   drops sprites — the **first** ones, as the hardware does — and STAT77
   says `TIME OVER`; past 32 it says `RANGE OVER`.
4. **The master brightness inside the frame** — `B` steps INIDISP down and
   round, `F` dims rows 96-127 to half: a register write in the middle of
   the picture, kept as data (`setLineWrites`), the way the game fades.
5. **The layers** — `1`, `2`, `3`, `O` switch BG1, BG2, BG3 and the sprites
   on the main screen (TM); `SPACE` stops the scroll, `R` powers on again.

Nothing is random: the stars come from a seeded generator and the ship
moves as a function of the frame counter.

## Running it

`config/config.php` out of `config/config.php.sample` (`$devMode = true`),
serve the directory with nginx + PHP; the browser loads `app/` directly,
nothing is built. The classes are checked without a browser by
`node ../svision/tools/checksnes.mjs`.

## Where things are

| | |
|---|---|
| `app/demoModel.js` | the screen: palette, tiles, the font cut from svision's 5x5 glyphs, maps, sprites, keys |
| `app/mainApp.js`, `app/appPlatform.js` | the application and the platform config (`pixelAspect` 8/7) |
| `app/svision/js/platform/canvas2D/snes/` | the platform itself — everything the demo drives |
| `../DESIGN-snes.md`, `../DECISIONS.md` R-050 | the design and the decision |
