const { VGAPlatform } = await import('./svision/js/platform/canvas2D/vga/vgaPlatform.js?ver='+window.srcVersion);
// begin code

/**
 * A PC with a VGA card on a 4:3 monitor: 320x200 pixels shown 1.2 times
 * taller than wide, black border that never changes colour.
 */
export function appPlatform() {
  return new VGAPlatform({
    width: 320,
    height: 200,
    pixelAspect: 1.2,
    minimalBorder: 0
  });
} // appPlatform
