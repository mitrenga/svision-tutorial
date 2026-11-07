const { RasterEntity } = await import('./svision/js/platform/canvas2D/rasterEntity.js?ver='+window.srcVersion);
// begin code

/**
 * The background of the adaptive desktop: a grid of logical pixels over the
 * whole of it, minor lines every `step`, major lines every four steps, and
 * the diagonals of the desktop. The grid is what makes the adaptive layout
 * visible — on a resize the desktop gets more or fewer cells, never smaller
 * or bigger ones, because the ratio is a whole number.
 *
 * As big as the desktop; the model resizes it and repaints it.
 */
export class GridEntity extends RasterEntity {

  constructor(parentEntity, width, height, step, colors) {
    super(parentEntity, 0, 0, width, height, false, false);
    this.id = 'GridEntity';
    this.step = step;
    this.colors = colors;     // {background, minor, major, diagonal}
  } // constructor

  paintRaster(data) {
    var w = this.width, h = this.height;
    this.paintRect(0, 0, w, h, this.colors.background);
    for (var x = 0; x < w; x += this.step) {
      this.paintRect(x, 0, 1, h, (x/this.step)%4 == 0 ? this.colors.major : this.colors.minor);
    }
    for (var y = 0; y < h; y += this.step) {
      this.paintRect(0, y, w, 1, (y/this.step)%4 == 0 ? this.colors.major : this.colors.minor);
    }
    // the diagonals, a pixel at a time
    var steps = Math.max(w, h);
    for (var i = 0; i < steps; i++) {
      var dx = Math.floor(i*w/steps), dy = Math.floor(i*h/steps);
      this.paintRect(dx, dy, 1, 1, this.colors.diagonal);
      this.paintRect(w-1-dx, dy, 1, 1, this.colors.diagonal);
    }
    this.paintRect(0, 0, w, 1, this.colors.major);
    this.paintRect(0, h-1, w, 1, this.colors.major);
    this.paintRect(0, 0, 1, h, this.colors.major);
    this.paintRect(w-1, 0, 1, h, this.colors.major);
  } // paintRaster

} // GridEntity
