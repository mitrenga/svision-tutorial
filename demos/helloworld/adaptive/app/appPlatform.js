const { AdaptivePlatform } = await import('./svision/js/platform/canvas2D/adaptive/adaptivePlatform.js?ver='+window.srcVersion);
// begin code

export function appPlatform() {
  // the logical desktop follows the window: 512 units across, light blue
  return new AdaptivePlatform(512, '#4f8fd6');
} // appPlatform
