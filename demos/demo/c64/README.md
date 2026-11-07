# c64demo

Minimal demo of the Commodore 64 platform of the **svision** library — the
common ground for future remakes of C64 games. It is not a game and has no
original to measure against; it is a sandbox where the C64 layer can be seen.

What it shows:

1. **Power-on** (`C64BootModel`) — the light blue border, the blue screen,
   `**** COMMODORE 64 BASIC V2 ****`, `READY.`, the blinking cursor,
   `LOAD"C64DEMO",8,1`, `SEARCHING FOR`, `LOADING`, `RUN`. Skipped with
   Escape, Enter, Space or a tap.
2. **The 40x25 text screen** (`DemoModel`) — the 16 colours as coloured
   text and reverse blocks, a frame of PETSCII box pieces, the graphics
   characters, both character sets of the ROM (`C` switches).
3. **The registers** — `B` steps the border colour ($D020), `G` the
   background ($D021), `F` flashes the border the way a loader did.
4. **Hardware sprites** — four `C64SpriteEntity` bouncing over the text:
   two hires (one animated), two multicolour; `X` doubles them in both
   directions ($D017/$D01D), `M` switches the multicolour pair to hires.
5. `R` switches the machine off and on again.

No sound: the SID is a later step.

## Running

Like every svision project: the directory is served by PHP (`index.php` →
`app/svision/php/main.php`), `config/config.php` has `$devMode = true`, so the
sources in `app/` are loaded directly. No bundle (`svtool build`) is needed.

```
php -S localhost:8080        # in the c64demo root
```

## Checking without a browser

```
node ../svision/tools/checkc64.mjs
```

runs the DOM-free part of the platform (colours, screen codes, the character
ROM, the text screen, sprite data) and drives the boot model against a
stand-in application; it reports the number of checks and differences.

## What is where

| file | what it does |
|---|---|
| `app/appPlatform.js` | `new C64Platform({width: 320, height: 200, minimalBorder: 24})` |
| `app/mainApp.js` | the character ROM as `fonts.c64Fonts8x8`, `setModel('BootModel' | 'DemoModel')` |
| `app/demoModel.js` | the test screen, keys, registers, the four sprites and their shapes |
| `app/main.js` | identical in every project (R-002) — do not edit locally |

The design of the whole C64 layer is in `../DESIGN-c64.md`, the decision in
`../DECISIONS.md` (R-038).
