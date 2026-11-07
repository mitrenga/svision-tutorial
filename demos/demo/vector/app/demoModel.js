const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { VectorEntity } = await import('./svision/js/platform/vector/vectorEntity.js?ver='+window.srcVersion);
const { VectorTextEntity } = await import('./svision/js/platform/vector/vectorTextEntity.js?ver='+window.srcVersion);
// begin code

/**
 * The test picture of the vector platform: a frame around the desktop, a
 * wireframe cube turning in the middle, a ramp of beam intensities 0-15, a
 * circle to check the aspect (round on a correct fit), a text run of the
 * browser's font and one of the vector font (VectorTextEntity). Every
 * frame rebuilds the cube's display list; the static parts keep their
 * version, so the layout leaves their SVG nodes alone.
 */
export class DemoModel extends AbstractModel {

  constructor(app) {
    super(app);
    this.id = 'DemoModel';
    this.frame = null;
    this.cube = null;
    this.angle = 0;
    this.lastTimestamp = 0;
  } // constructor

  init() {
    super.init();

    var w = this.desktopWidth;
    var h = this.desktopHeight;

    // static picture — built once
    this.frame = new VectorEntity(this.desktopEntity, 0, 0, w, h, '#40ff40', false);
    var l = this.frame.list;
    l.rect(2, 2, w-4, h-4, {strokeWidth: 2});
    l.circle(w/2, h/2, h/2-40, {intensity: 6});
    l.line(w/2-20, h/2, w/2+20, h/2, {intensity: 10});
    l.line(w/2, h/2-20, w/2, h/2+20, {intensity: 10});
    for (var i = 0; i <= 15; i++) {
      l.line(40+i*24, h-60, 40+i*24, h-20, {intensity: i, strokeWidth: 3});
    }
    l.text(40, h-70, 'INTENSITY 0-15', {size: 18, font: 'monospace'});
    l.text(w/2, 60, 'SVISION VECTOR PLATFORM', {size: 32, anchor: 'middle', color: '#ff4040'});
    l.text(w-40, h-30, 'DESKTOP '+w+'x'+h, {size: 18, anchor: 'end', intensity: 10});
    this.desktopEntity.addEntity(this.frame);

    // the vector font: glyphs as polylines, the text a player of a vector
    // game sees (the browser's font above is for debug output)
    this.desktopEntity.addEntity(new VectorTextEntity(this.desktopEntity, 0, 90, w, 28, '#40ff40', false, 'VECTOR FONT ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789', {size: 28, align: 'center'}));
    this.desktopEntity.addEntity(new VectorTextEntity(this.desktopEntity, 0, 130, w, 20, '#40ff40', false, '.,:;!?-+=/()[]<>\'"*_#%&© (C) 2026', {size: 20, align: 'center', intensity: 10}));
    // the same in the library's own font (VectorFont4x6)
    this.desktopEntity.addEntity(new VectorTextEntity(this.desktopEntity, 0, 160, w, 20, '#40ff40', false, 'VECTOR FONT 4X6 ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 .,:;!?-+=/()<>&©', {font: this.app.fonts.vector4x6, size: 20, align: 'center', intensity: 10}));

    // the cube — rebuilt every frame
    this.cube = new VectorEntity(this.desktopEntity, w/2-200, h/2-200, 400, 400, '#40ff40', false);
    this.desktopEntity.addEntity(this.cube);
  } // init

  /**
   * Draws the cube's twelve edges projected with a simple perspective.
   * @param {number} angle - Rotation about the vertical and horizontal axes.
   */
  buildCube(angle) {
    var c = Math.cos(angle), s = Math.sin(angle);
    var c2 = Math.cos(angle*0.7), s2 = Math.sin(angle*0.7);
    var pts = [];
    for (var i = 0; i < 8; i++) {
      var x = (i & 1) ? 1 : -1;
      var y = (i & 2) ? 1 : -1;
      var z = (i & 4) ? 1 : -1;
      // rotate around Y, then X
      var x1 = x*c+z*s, z1 = -x*s+z*c;
      var y1 = y*c2-z1*s2, z2 = y*s2+z1*c2;
      var d = 1/(3.2+z2);
      pts.push([200+x1*d*520, 200+y1*d*520, z2]);
    }
    var edges = [[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[2,6],[3,7]];
    var l = this.cube.list;
    l.clear();
    edges.forEach((e) => {
      var a = pts[e[0]], b = pts[e[1]];
      // the nearer an edge, the brighter — the beam of an XY monitor
      var intensity = Math.round(15-((a[2]+b[2])/2+1)*4);
      l.line(a[0], a[1], b[0], b[1], {intensity: intensity, strokeWidth: 2});
    });
  } // buildCube

  loopModel(timestamp) {
    super.loopModel(timestamp);
    if (this.lastTimestamp) {
      this.angle += (timestamp-this.lastTimestamp)/1000*0.8;
    }
    this.lastTimestamp = timestamp;
    this.buildCube(this.angle);
    this.drawModel();
  } // loopModel

} // DemoModel
