const { WebGL2Platform } = await import('./svision/js/platform/webGL2/webGL2Platform.js?ver='+window.srcVersion);
// begin code

export function appPlatform() {
  // a 16:9 picture rendered by WebGL2, with a 2D overlay for text
  return new WebGL2Platform({width: 640, height: 360, defaultColor: false, border: {minimal: 0, defaultColor: '#181818'}, background: '#000000', fit: 'cover', antialias: true, pixelRatio: false});
} // appPlatform
