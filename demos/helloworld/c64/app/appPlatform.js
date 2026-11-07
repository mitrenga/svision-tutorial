const { C64Platform } = await import('./svision/js/platform/canvas2D/c64/c64Platform.js?ver='+window.srcVersion);
// begin code

export function appPlatform() {
  return new C64Platform({width: 320, height: 200, pixelAspect: 1, minimalBorder: 16});
} // appPlatform
