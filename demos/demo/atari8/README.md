# atari8demo

Minimal demo of the Atari 8-bit platform of the **svision** library — the
common ground for games of the Atari 8-bit family (400/800/XL/XE; the
reference machine is a PAL 800XL).
It is not a game and has no original to measure against; it is a sandbox
where the Atari layer can be seen.

What it shows:

1. **Power-on** (`Atari8BootModel`) — the black border, the blue Graphics 0
   screen, `READY` from Atari BASIC, the inverse cursor, `RUN "D:DEMO"` typed
   at it. Skipped with Escape, Enter, Space or a tap.
2. **One display list that fills the window exactly** (`DemoModel`) — three
   blank-8 lines, as every Atari list begins, and then the 192 scan lines
   the desktop shows (`height: 192, firstLine: 24`, the picture Graphics 0
   draws as well). Nothing is left over at either end, so what surrounds the
   picture is the border and nothing else, and the boot screen and the demo
   are the same size. Nine blocks in five ANTIC modes: the title in mode 7
   (20 double-width characters, a colour each), headings in mode 2, the
   palette in mode D, the character set in mode 2, coloured text in mode 6,
   the tile field in mode 4, the keys and the registers in mode 2. The last
   row shows the list's lines against the window's (`216/192`), so the crop
   is visible.
3. **Display list interrupts** — the palette is 16 hues down the screen and
   four luminances across, one interrupt per hue, because a scan line has
   only four playfield colours: that is why a game on this machine needs
   DLIs at all. Two more interrupts switch CHBASE between the ROM's set and
   the game's inside one frame.
4. **The colour registers** — `B` steps the hue of COLBK (the background and,
   with it, the border), `0`-`3` the hue of COLPF0-3. COLPF2 is both a tile
   colour and the text background, COLPF1 only lends its luminance to the
   text: that is the machine. The palette keeps its own colours, because the
   interrupts set them every frame.
5. **The character set** — the ATASCII graphics (the 32 codes below space),
   the lowercase, the inverse video, and the game's own set at $7000 whose
   96 ROM glyphs are followed by four 2x2-character tiles — a frame, a
   disc, a star and a stipple — the way a game keeps its graphics in the
   set. `C` points ANTIC at the ROM set instead; the tiles turn into
   letters, as they did.
6. **Players and missiles** — player 0 walks the tile field with its shape
   copied through the PM memory each step, player 1 is a bar beside it,
   players 2 and 3 float over the palette (a player is drawn over every
   ANTIC mode alike) and the four missiles are a fifth player in COLPF3;
   `X` cycles player 0's width, `M` switches the missiles off and on, `P`
   the fifth player (PRIOR bit 4).
7. `R` switches the machine off and on again.

No sound: POKEY is a later step.

## Running

Like every svision project: the directory is served by PHP (`index.php` →
`app/svision/php/main.php`), `config/config.php` has `$devMode = true`, so the
sources in `app/` are loaded directly. No bundle (`svtool build`) is needed.

```
php -S localhost:8080        # in the atari8demo root
```

## Checking without a browser

```
node ../svision/tools/checkatari8.mjs
```

runs the DOM-free part of the platform (colours, the alphabets, the OS
character set, the display list, ANTIC and GTIA over the memory) and drives
the boot model against a stand-in application; it reports the number of
checks and differences.

## What is where

| file | what it does |
|---|---|
| `app/appPlatform.js` | `new Atari8Platform({width: 320, height: 192, firstLine: 24, pixelAspect: 1, minimalBorder: 8})` |
| `app/mainApp.js` | the OS character set as `fonts.atari8Fonts8x8`, `setModel('BootModel' | 'DemoModel')` |
| `app/demoModel.js` | the display list of nine blocks, the interrupts, the character set with the tiles, the registers on the keys, the players |
| `app/main.js` | identical in every project (R-002) — do not edit locally |

The design of the whole Atari layer is in `../DESIGN-atari8.md`, the
decision in `../DECISIONS.md` (R-039).
