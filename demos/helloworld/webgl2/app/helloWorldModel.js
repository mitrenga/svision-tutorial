const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { SceneEntity } = await import('./svision/js/platform/scene3D/sceneEntity.js?ver='+window.srcVersion);
const { Mesh } = await import('./svision/js/platform/scene3D/mesh.js?ver='+window.srcVersion);
// begin code

/**
 * Hello world in 3D: the text is built of boxes — every rectangle of a glyph
 * of the library's 5x5 font is one box — laid in a plane tilted 45 degrees
 * back and the whole text turned 45 degrees about the vertical axis, so the
 * letters recede and shrink in the perspective of the camera looking at them
 * from the front and above. Nothing moves.
 */
export class HelloWorldModel extends AbstractModel {

  /** world units per pixel of the font */
  static get PIXEL() { return 0.5; }
  /** rows from the top of one line to the top of the next (5 rows of glyph + 1 gap) */
  static get LINE() { return 6; }
  /** the tilt of the text's plane back from vertical, degrees */
  static get TILT() { return 45; }
  /** the turn of the whole text about the vertical axis, degrees: its end goes away from the camera */
  static get YAW() { return 45; }
  /** where the text starts: its left end, on the ground, near the camera on the left */
  static get START() { return [-5, 0, -1]; }

  constructor(app) {
    super(app);
    this.id = 'HelloWorldModel';
    this.view = null;
  } // constructor

  init() {
    super.init();
    this.desktopEntity.bkColor = false;   // the 3D picture shows through the overlay

    this.view = new SceneEntity(this.desktopEntity, 0, 0, this.desktopWidth, this.desktopHeight, '#ffffff', false);
    this.view.scene.setBackground('#0c1830');
    // the target chosen so the text sits in the middle of the picture (measured headless)
    this.view.scene.setCamera({position: [-2, 2.5, 8], target: [-0.8, 0.5, -8], fov: 60, near: 0.1, far: 100});
    this.desktopEntity.addEntity(this.view);

    this.buildText(['HELLO WORLD!']);
  } // init

  /**
   * The lines of text as boxes in the tilted plane: the glyphs' rectangles
   * (x, y, width, height in pixels, y down from the top of the 5 rows), each
   * line centred, the last line's bottom row on the ground and the lines
   * above it, then the plane turned back about X and the whole text about Y
   * and moved so that it starts at START — the farther along, the farther
   * from the camera.
   * @param {string[]} lines - Top line first.
   */
  buildText(lines) {
    var font = this.app.fonts.fonts5x5, s = HelloWorldModel.PIXEL;
    var rad = HelloWorldModel.TILT*Math.PI/180, cos = Math.cos(rad), sin = Math.sin(rad);
    var yaw = HelloWorldModel.YAW*Math.PI/180, cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    var scene = this.view.scene;
    lines.forEach((text, line) => {
      var glyphs = [], width = 0;
      for (var i = 0; i < text.length; i++) {
        var g = font.getCharData(text[i], null, 1);
        glyphs.push({x: width, data: g.data || []});
        width += g.width+1;
      }
      width -= 1;
      var bottom = (lines.length-1-line)*HelloWorldModel.LINE;   // rows above the ground
      // the text's left end after the turn, moved to START
      var startX = -width/2*s, offX = HelloWorldModel.START[0]-startX*cosY, offZ = HelloWorldModel.START[2]+startX*sinY;
      glyphs.forEach((glyph) => {
        glyph.data.forEach((r) => {
          var cx = (glyph.x+r[0]+r[2]/2-width/2)*s;
          var cy = (bottom+5-r[1]-r[3]/2)*s;           // up from the ground
          // the plane's Y turned back (up and away from the camera), then the whole text
          // turned about the vertical axis so its end recedes — the boxes turn the same way
          var x = cx, y = cy*cos, z = -cy*sin;
          scene.mesh(Mesh.box(r[2]*s, r[3]*s, s/2), {   // half a pixel deep
            transform: {position: [x*cosY+z*sinY+offX, y+HelloWorldModel.START[1], -x*sinY+z*cosY+offZ], rotation: [-HelloWorldModel.TILT, HelloWorldModel.YAW, 0]},
            fill: '#ffffff', color: '#ffffff'
          });
        });
      });
    });
  } // buildText

  /**
   * The view fills the desktop, on init and on every resize.
   */
  resizeModel() {
    super.resizeModel();
    this.view.width = this.desktopWidth;
    this.view.height = this.desktopHeight;
    this.drawModel();                 // once more with the new size (super drew before it was known)
  } // resizeModel

} // HelloWorldModel
