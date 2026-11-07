const { VectorPlatform } = await import('./svision/js/platform/vector/vectorPlatform.js?ver='+window.srcVersion);
// begin code

/**
 * An XY monitor in landscape, 4:3 like the Atari vector cabinets: the desktop
 * is 1024x768 model units (the AVG of Battlezone addresses a 1024-wide
 * space), the border around it stays black.
 */
export function appPlatform() {
  return new VectorPlatform({
    width: 1024,
    height: 768,
    defaultColor: false,
    border: {minimal: 0, defaultColor: '#000000'},
    background: '#000000'
  });
} // appPlatform
