const { VGAPlatform } = await import('./svision/js/platform/canvas2D/vga/vgaPlatform.js?ver='+window.srcVersion);
// begin code

export function appPlatform() {
  return new VGAPlatform({width: 320, height: 200, pixelAspect: 1.2, minimalBorder: 0});
} // appPlatform
