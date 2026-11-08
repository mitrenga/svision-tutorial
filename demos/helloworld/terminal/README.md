# helloworld/terminal

The smallest possible svision application on the terminal platform (`TerminalPlatform`, R-061):
the terminal of Tetris 1984, the Soviet 15IE-00-013 — 80x24 and a status line in 10x11 cells,
7x8 glyphs from its own character ROM, KOI-7 with SO/SI, green on black. Everything about the
terminal is in `app/ie15Terminal.js` and `app/ie15Chargen.js`, the same files as in `tetris`;
the platform itself knows no terminal in particular. Nothing draws text here — the host sends
`HELLO WORLD!` CR LF down the line and the firmware (`TerminalVT52` over
a `TerminalScreen`) puts it on the screen; the cursor blinks on the next line and the status line
runs the terminal's clock.
No build: `config/config.php` has `$devMode = true`. One of the Hello worlds of the
`svision-tutorial` project, one per platform.
