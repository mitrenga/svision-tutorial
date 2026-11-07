const { RasterEntity } = await import('./svision/js/platform/canvas2D/rasterEntity.js?ver='+window.srcVersion);
// begin code

/**
 * A 7x7 disc that bounces about the raster a pixel a frame — motion at an
 * integer ratio shows whether the scaling stutters, and under the overlay
 * bands the disc changes colour as it passes, the way a Space Invaders shot
 * did. Painted once; only its position moves.
 */
export class BallEntity extends RasterEntity {

  constructor(parentEntity, x, y, color) {
    super(parentEntity, x, y, 7, 7, false, false);
    this.id = 'BallEntity';
    this.color = color;
    this.dx = 1;
    this.dy = 1;
  } // constructor

  paintRaster(data) {
    var rows = [2, 1, 0, 0, 0, 1, 2];    // margin of each line of the disc
    for (var y = 0; y < 7; y++) {
      this.paintRect(rows[y], y, 7-2*rows[y], 1, this.color);
    }
  } // paintRaster

  /**
   * One step; bounces off the walls of the given area.
   * @param {number} width - The area's width.
   * @param {number} height - The area's height.
   */
  step(width, height) {
    this.x += this.dx;
    this.y += this.dy;
    if (this.x <= 1 || this.x+this.width >= width-1) {
      this.dx = -this.dx;
    }
    if (this.y <= 1 || this.y+this.height >= height-1) {
      this.dy = -this.dy;
    }
  } // step

} // BallEntity
