const { C64Platform } = await import('./svision/js/platform/canvas2D/c64/c64Platform.js?ver='+window.srcVersion);
// begin code

/**
 * A Commodore 64 on a PAL television: the 320x200 picture with square pixels
 * and a border of at least 24 pixels the models recolour.
 */
export function appPlatform() {
  return new C64Platform({
    width: 320,
    height: 200,
    pixelAspect: 1,
    minimalBorder: 16
  });
} // appPlatform
