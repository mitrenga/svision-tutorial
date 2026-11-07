const { AdaptivePlatform } = await import('./svision/js/platform/canvas2D/adaptive/adaptivePlatform.js?ver='+window.srcVersion);
// begin code

/**
 * An adaptive canvas 2D desktop with a target of 512 logical pixels — the
 * platform of genesis and endlessuniverse.
 *
 * 512 is a target for the width, not a promise about either dimension: the
 * layout picks a whole number ratio so the logical width comes out near it,
 * and the height follows from the same ratio. The real desktop is whatever
 * `desktopEntity` says after a resize, which is the whole point of the demo.
 * The demo changes the target at run time (keys - and +).
 */
export function appPlatform() {
  return new AdaptivePlatform(512, '#10181f');
} // appPlatform
