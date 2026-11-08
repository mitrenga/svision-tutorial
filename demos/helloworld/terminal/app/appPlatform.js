const { TerminalPlatform } = await import('./svision/js/platform/canvas2D/terminal/terminalPlatform.js?ver='+window.srcVersion);
const { IE15Terminal } = await import('./ie15Terminal.js?ver='+window.srcVersion);
// begin code

/**
 * The terminal of Tetris 1984 on the terminal platform of svision (R-061):
 * the Soviet 15IE-00-013, 80x24 and a status line in 10x11 cells, 7x8 glyphs
 * from its own character ROM, green on black, a dot twice as tall as wide.
 * The platform knows no terminal in particular; everything about this one is
 * in ie15Terminal.js (and ie15Chargen.js), the same files as in `tetris`. The
 * font is built here because the platform sizes the desktop by its cell.
 */
export function appPlatform() {
  return new TerminalPlatform(IE15Terminal.platformConfig(IE15Terminal.font(null)));
} // appPlatform
