const { VectorPlatform } = await import('./svision/js/platform/vector/vectorPlatform.js?ver='+window.srcVersion);
// begin code

export function appPlatform() {
  // an XY monitor: 1024 x 768, black, no border
  return new VectorPlatform({width: 1024, height: 768, defaultColor: false, border: {minimal: 0, defaultColor: '#000000'}, background: '#000000'});
} // appPlatform
