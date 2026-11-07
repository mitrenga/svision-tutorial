const { SNESPlatform } = await import('./svision/js/platform/canvas2D/snes/snesPlatform.js?ver='+window.srcVersion);
// begin code

/**
 * A Super Nintendo on an NTSC television: the 256×224 picture with pixels
 * about 8:7 taller than wide (R-050, an open point the operator settles by
 * eye — set `pixelAspect: 1` for square pixels) with no surround required:
 * the console showed nothing around the picture, so it may touch the edge
 * of the element (what is left over by the aspect fit stays black). The console has no border colour, so the surround is
 * never anything but black.
 */
export function appPlatform() {
  return new SNESPlatform({
    width: 256,
    height: 224,
    pixelAspect: 8/7,
    minimalBorder: 0
  });
} // appPlatform
