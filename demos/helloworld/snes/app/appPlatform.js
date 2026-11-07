const { SNESPlatform } = await import('./svision/js/platform/canvas2D/snes/snesPlatform.js?ver='+window.srcVersion);
// begin code

export function appPlatform() {
  return new SNESPlatform({width: 256, height: 224, pixelAspect: 8/7, minimalBorder: 0});
} // appPlatform
