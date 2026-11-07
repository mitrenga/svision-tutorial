# vgademo

Minimal demo of the VGA platform of the **svision** library — the common
ground for the remakes of DOS games (Prince of Persia, Gobliiins 1–3). It is
not a game and has no original to measure against; it is a sandbox where the
VGA layer can be seen and heard.

What it shows:

1. **Booting from MS-DOS** (`DOSBootModel`) — POST, memory count, `Starting
   MS-DOS...`, the prompt, a typed command, the switch to mode 13h. Skipped
   with Escape, Enter, Space or a tap.
2. **A 320x200 test picture in 256 colours** (`DemoModel`) — all 256 registers
   of the BIOS default palette, a circle to check the 4:3 aspect (round on the
   display, an egg without the 1.2 pixel aspect), a hue bar, a grey ramp and
   the scaling figures.
3. **The palette** — `F` fades the picture to black and back (6-bit steps),
   `R` cycles the hue ring (palette animation of registers 32–55).
4. **Digitised sound** — `S` plays an 11 025 Hz sample through
   `AudioSampleHandler`, `D` a second one, `N` an 8-bit "recording" (noise
   with an envelope, stored as unsigned bytes the way DOS games did).
5. `B` boots again.

## Running

Like every svision project: the directory is served by PHP (`index.php` →
`app/svision/php/main.php`), `config/config.php` has `$devMode = true`, so the
sources in `app/` are loaded directly. No bundle (`svtool build`) is needed.

```
php -S localhost:8080        # in the vgademo root
```

## Checking without a browser

```
node ../svision/tools/checkvga.mjs
```

runs the DOM-free part of the platform (palette, video memory, text memory,
PCM) and drives the boot model against a stand-in application; it reports
the number of checks and differences.

## What is where

| file | what it does |
|---|---|
| `app/appPlatform.js` | `new VGAPlatform({width: 320, height: 200, pixelAspect: 1.2})` |
| `app/mainApp.js` | fonts, audio manager, `setModel('BootModel' | 'DemoModel')` |
| `app/demoModel.js` | the test picture, keys, palette fade and cycling |
| `app/audioManager.js` | one bus `sounds` through `AudioSampleHandler`, samples synthesised in code |
| `app/main.js` | identical in every project (R-002) — do not edit locally |

The design of the whole VGA layer is in `../DESIGN-vga.md`, the decision in
`../DECISIONS.md` (R-029).
