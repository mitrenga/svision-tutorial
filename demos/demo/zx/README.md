# zxdemo

Minimal demo of the ZX Spectrum platform of the **svision** library — the
common ground of the eight Spectrum remakes. It is not a game and has no
original to measure against; it is a sandbox where the whole ZX layer can be
seen and heard on one screen.

What it shows:

1. **The reset** (`ZXResetModel`) — the red lines of the power-on, then the
   `© 1982 Sinclair Research Ltd` line, then the hand-over to the picture.
2. **The video memory** (`ZXVideoRAM`, `ZXVideoRAMEntity`) — all 6912 bytes as
   one entity: 64 ink × paper cells, the same 64 with BRIGHT, the character set
   of the ROM written with `pokeCell()`, a FLASH line, and a ring **XORed over
   scenery** with `blitShifted()` a pixel a frame — what a Spectrum sprite does
   to the background and how it is rubbed out again.
3. **A tape block** — `T` plays the pilot tone and then 576 bytes in the pulse
   format of the tape (`ZXMachineSounds.tapeData`); every byte is poked at its
   interleaved address the moment its sound has passed, so the picture appears
   at the speed of the sound, bitmap first, colour last.
4. **The machine's sounds** — `P` pilot tone, `K` the ROM's key click, `B` the
   rising scale of a header being accepted.
5. **The attribute mask** — `M` masks BRIGHT and FLASH off, the way a game masks
   a spare attribute bit it keeps something of its own in.
6. **The dialogs** — `S` settings (keyboard, mouse, gamepad, touch screen,
   display style), `V` volume, `N` player name, `E` the error panel. All of them
   in `ZXDialogEntity` windows with the default look (`ZXDialogProperties`).
7. `C` cycles the border colour, `F` stops and starts the FLASH phase, `X` the
   sprite, `R` resets the machine.

## Running

Like every svision project: the directory is served by PHP (`index.php` →
`app/svision/php/main.php`), `config/config.php` has `$devMode = true`, so the
sources in `app/` are loaded directly. No bundle (`svtool build`) is needed.

```
php -S localhost:8080        # in the zxdemo root
```

## Checking without a browser

```
node ../svision/tools/checkzx.mjs
```

runs the DOM-free part of the platform: the addressing of the video memory
(the ULA's interleave, `INC L` wrapping), `peek`/`poke` with the write
operations, the shifted XOR blit, linear ↔ interleaved conversion, painting
to RGBA including BRIGHT, FLASH and the attribute mask, the glyph bytes of the
ROM font and the pulse data of the tape format. It reports the number of
checks and differences; the exit code is the number of differences.

## What is where

| file | what it does |
|---|---|
| `app/appPlatform.js` | `new ZXPlatform()` |
| `app/mainApp.js` | fonts, audio manager, controls and their options, `setModel('ResetModel' | 'MenuModel')`, the error panel |
| `app/demoModel.js` | the test picture, keys, tape block, XOR sprite, dialogs |
| `app/audioManager.js` | one bus `sounds` of beeper pulses, all of them from `ZXMachineSounds` |
| `app/main.js` | identical in every project (R-002) — do not edit locally |
