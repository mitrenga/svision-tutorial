const { WebGL2Platform } = await import('./svision/js/platform/webGL2/webGL2Platform.js?ver='+window.srcVersion);
// begin code

/**
 * A desktop of 640x360 model units — the pixel grid of the HUD, the size
 * Geometry Race will use — sets the ratio (whole from 2x up), and with
 * `fit: 'cover'` the desktop then grows over the whole window, whatever
 * its aspect: no border bands, the model lays the HUD out by the desktop
 * size it gets. The 3D picture is rendered at the device's pixel ratio.
 */
export function appPlatform() {
  return new WebGL2Platform({
    width: 640,
    height: 360,
    defaultColor: false,
    border: {minimal: 0, defaultColor: '#181818'},
    background: '#000000',
    fit: 'cover',
    antialias: true,
    pixelRatio: false
  });
} // appPlatform
