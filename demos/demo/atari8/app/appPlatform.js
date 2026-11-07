const { Atari8Platform } = await import('./svision/js/platform/canvas2D/atari8/atari8Platform.js?ver='+window.srcVersion);
// begin code

/**
 * An Atari 8-bit computer (an 800XL) on a PAL television: square pixels and
 * a border of at least 8 pixels in the colour of COLBK — the register that
 * colours the background inside the frame too.
 *
 * The desktop is **192 of the frame's 240 scan lines, from line 24** — the
 * picture the OS's Graphics 0 draws, once its three blank-8 lines at the top
 * are left out. Both screens of this project are built that way: the boot
 * model's BASIC covers lines 24-215 and the demo's own display list starts
 * with the same three blank lines and draws 192 after them. Neither leaves
 * a band of background inside the picture — what surrounds it is the border,
 * which is COLBK, exactly as a television showed it.
 */
export function appPlatform() {
  return new Atari8Platform({
    width: 320,
    height: 192,
    firstLine: 24,
    pixelAspect: 1,
    minimalBorder: 8
  });
} // appPlatform
