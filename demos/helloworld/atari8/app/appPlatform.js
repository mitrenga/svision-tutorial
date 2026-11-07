const { Atari8Platform } = await import('./svision/js/platform/canvas2D/atari8/atari8Platform.js?ver='+window.srcVersion);
// begin code

export function appPlatform() {
  return new Atari8Platform({width: 320, height: 192, firstLine: 24, pixelAspect: 1, minimalBorder: 8});
} // appPlatform
