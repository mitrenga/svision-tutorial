# terminaldemo

Minimal demo of the terminal platform of the **svision** library (R-061) — a
text terminal on a serial line, the way a minicomputer of the 1970s and 80s
showed anything: the host sends bytes, the terminal's firmware draws them.
The terminal is the one of `tetris`: the Soviet 15IE-00-013 of 1984, a VT52
look-alike — its character ROM (7x8 glyphs in 10x11 cells), KOI-7 charset with
SO/SI, profile, 9600 baud and status line all come from `app/ie15Terminal.js`
and `app/ie15Chargen.js`, the same files as in `tetris/app/`. It is not a game
and has no original to measure against.

What it shows:

1. **The line** (`TerminalLine`, 9600 baud) — the screen fills at 960
   characters a second, row after row, the way it came down the wire.
2. **The firmware** (`TerminalVT52` with the 15IE profile) over the **screen**
   (`TerminalScreen`, 80x24 and the status line) with the KOI-7 **charset**
   (`TerminalCharset`, Latin after SI, Cyrillic after SO): both sets, tab
   stops, ESC H / J / K, the cursor sequences, a box drawn by `ESC Y` cursor
   addressing, BEL as an event — the platform has no sound and the demo plays
   none, the count of bells is written on the screen.
3. **The status line** — the terminal's own firmware's: the speed of the line,
   the setup bits and a clock from power-on.
4. **The keyboard** (`TerminalKeyboard`) — keys become the bytes a terminal
   sends, the host echoes them: type, Enter for a new line and prompt,
   Backspace rubs out (the bell at an empty prompt), Tab, arrows move the
   cursor, Escape replays the screen.

## Running

Like every svision project: the directory is served by PHP (`index.php` →
`app/svision/php/main.php`), `config/config.php` has `$devMode = true`, so the
sources in `app/` are loaded directly. No bundle (`svtool build`) is needed.

```
php -S localhost:8080        # in the terminaldemo root
```

## Checking without a browser

```
node ../../../../svision/tools/checkterminal.mjs
```

runs the DOM-free half of the platform (font, charset, screen and its painting,
firmware, line, keyboard, the platform's desktop) and reports the number of
checks and differences.

## What is where

| file | what it does |
|---|---|
| `app/appPlatform.js` | `new TerminalPlatform(IE15Terminal.platformConfig(IE15Terminal.font(null)))` |
| `app/ie15Terminal.js`, `app/ie15Chargen.js` | the 15IE-00-013: ROM font, charset, profile, keyboard, status line, platform config — copies of `tetris/app/`, not edited here |
| `app/mainApp.js` | `fonts.terminal` from the platform config, one model |
| `app/demoModel.js` | the terminal (firmware, screen, line, keyboard, entity) and the host (the script and the echo) |
| `app/main.js` | identical in every project (R-002) — do not edit locally |

The design of the platform is in `../DESIGN-terminal.md`, the decision in
`../DECISIONS.md` (R-061).
