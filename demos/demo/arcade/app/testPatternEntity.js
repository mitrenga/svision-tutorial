const { RasterEntity } = await import('./svision/js/platform/canvas2D/rasterEntity.js?ver='+window.srcVersion);
// begin code

/**
 * The static test pattern of a raster monitor, painted once into the frame of
 * a RasterEntity and blitted at the layout's ratio on every display frame:
 *
 * - a one pixel frame and a one pixel checkerboard along the top edge — any
 *   blur or unevenness in it means the scaling is not pixel-perfect
 * - a grid of single pixels every 16 pixels, for the same reason
 * - a white circle, to see that the pixels are square
 * - eight bars of white and greys, and a row of the primary colours: the
 *   overlay bands multiply over them, so a white bar under the red band turns
 *   red and a black one stays black, exactly what the cellophane did
 * - vertical lines 1, 2 and 3 pixels wide
 *
 * Everything is in logical pixels of the raster; the entity is as big as the
 * desktop and repaints itself when the desktop changes size.
 */
export class TestPatternEntity extends RasterEntity {

  constructor(parentEntity, x, y, width, height) {
    super(parentEntity, x, y, width, height, false, false);
    this.id = 'TestPatternEntity';
  } // constructor

  /**
   * Paints the pattern for the current size.
   * @param {Uint8ClampedArray} data - The RGBA bytes of the frame.
   */
  paintRaster(data) {
    var w = this.width, h = this.height;
    this.paintRect(0, 0, w, h, '#000000');

    // the frame and the checkerboard
    this.paintRect(0, 0, w, 1, '#ffffff');
    this.paintRect(0, h-1, w, 1, '#ffffff');
    this.paintRect(0, 0, 1, h, '#ffffff');
    this.paintRect(w-1, 0, 1, h, '#ffffff');
    for (var x = 2; x < w-2; x += 2) {
      this.paintRect(x, 2, 1, 1, '#ffffff');
      this.paintRect(x+1, 3, 1, 1, '#ffffff');
    }

    // the grid of single pixels
    for (var gy = 16; gy < h; gy += 16) {
      for (var gx = 16; gx < w; gx += 16) {
        this.paintRect(gx, gy, 1, 1, '#606060');
      }
    }

    // the bars: white and seven greys, then the primaries and their mixes
    var greys = ['#ffffff', '#e0e0e0', '#c0c0c0', '#a0a0a0', '#808080', '#606060', '#404040', '#202020'];
    var barWidth = Math.floor((w-16)/8);
    for (var g = 0; g < 8; g++) {
      this.paintRect(8+g*barWidth, 24, barWidth, 32, greys[g]);
    }
    var colours = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffffff', '#808080'];
    for (var c = 0; c < 8; c++) {
      this.paintRect(8+c*barWidth, 192, barWidth, 48, colours[c]);
    }

    // the circle: round only when the pixels are square
    var cx = Math.floor(w/2), cy = 124, r = 40;
    for (var a = 0; a < 360; a += 0.25) {
      var rad = a*Math.PI/180;
      this.paintRect(Math.round(cx+Math.cos(rad)*r), Math.round(cy+Math.sin(rad)*r), 1, 1, '#ffffff');
    }
    this.paintRect(cx-r, cy, 2*r+1, 1, '#808080');
    this.paintRect(cx, cy-r, 1, 2*r+1, '#808080');

    // lines 1, 2 and 3 pixels wide, left and right of the circle
    for (var i = 0; i < 3; i++) {
      this.paintRect(12+i*8, 96, i+1, 56, '#ffffff');
      this.paintRect(w-16-i*8, 96, i+1, 56, '#ffffff');
    }
  } // paintRaster

} // TestPatternEntity
