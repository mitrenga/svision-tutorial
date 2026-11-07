const { ZXPlatform } = await import('./svision/js/platform/canvas2D/zx/zxPlatform.js?ver='+window.srcVersion);
// begin code

/**
 * A ZX Spectrum on a TV: 256x192 pixels, a border of at least 8 pixels in the
 * paper colour, integer scaling from 2x up — nothing to configure, which is
 * the point of the platform.
 */
export function appPlatform() {
  return new ZXPlatform();
} // appPlatform
