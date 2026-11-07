const { ArcadePlatform } = await import('./svision/js/platform/canvas2D/arcade/arcadePlatform.js?ver='+window.srcVersion);
// begin code

/**
 * A raster arcade monitor in portrait: 224x256 pixels the way Space Invaders
 * and Stinger have it, a black bezel, and a colour overlay of two cellophane
 * strips — a red one near the top, a green one near the bottom — multiplied
 * over the picture. The demo switches the raster to 208x256 (Pleiads) at
 * run time by changing this config and rebuilding its model.
 */
export function appPlatform() {
  return new ArcadePlatform({
    width: 224,
    height: 256,
    bezelColor: '#000000',
    screenColor: '#000000',
    minimalBorder: 0,
    overlay: {
      enabled: true,
      bands: [
        {x: 0, y: 24, width: 224, height: 32, color: '#ff2020'},
        {x: 0, y: 192, width: 224, height: 48, color: '#20ff20'}
      ]
    }
  });
} // appPlatform
