const { ArcadePlatform } = await import('./svision/js/platform/canvas2D/arcade/arcadePlatform.js?ver='+window.srcVersion);
// begin code

export function appPlatform() {
  // a portrait raster cabinet (224 x 256, as Space Invaders), black bezel, no overlay
  return new ArcadePlatform({width: 224, height: 256, bezelColor: '#000000', screenColor: '#000000', minimalBorder: 0});
} // appPlatform
