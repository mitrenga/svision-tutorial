const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { TextEntity } = await import('./svision/js/platform/canvas2D/textEntity.js?ver='+window.srcVersion);
const { Tool } = await import('./svision/js/tool.js?ver='+window.srcVersion);
const { TestPatternEntity } = await import('./testPatternEntity.js?ver='+window.srcVersion);
const { BallEntity } = await import('./ballEntity.js?ver='+window.srcVersion);
// begin code

/**
 * The test pattern of the arcade platform: the raster (TestPatternEntity),
 * two moving discs, text in the two small fonts, and the layout's numbers
 * on the bottom lines. The overlay bands are painted by the layout after the
 * desktop (drawModel), which is the one thing an arcade game has to do
 * itself. Keys:
 *
 *   O  overlay on/off (kept in the 'overlay' cookie by the layout)
 *   C  display style: sharp → crt → grid → retro (the 'displayStyle' cookie)
 *   R  the raster: 224x256 (Space Invaders, Stinger) ↔ 208x256 (Pleiads);
 *      the platform's config changes and the model is rebuilt
 */
export class DemoModel extends AbstractModel {

  static get STYLES() { return ['sharp', 'crt', 'grid', 'retro']; }

  constructor(app) {
    super(app);
    this.id = 'DemoModel';
    this.pattern = null;
    this.balls = [];
    this.statusEntity = null;
    this.styleEntity = null;
    this.movedAt = 0;
  } // constructor

  init() {
    super.init();

    var w = this.desktopWidth, h = this.desktopHeight;
    var f5 = this.app.fonts.fonts5x5, f3 = this.app.fonts.fonts3x3;

    this.pattern = new TestPatternEntity(this.desktopEntity, 0, 0, w, h);
    this.desktopEntity.addEntity(this.pattern);

    this.desktopEntity.addEntity(new TextEntity(this.desktopEntity, f5, 0, 8, w, 7, 'ARCADE RASTER '+w+'x'+h, '#ffffff', false, {align: 'center'}));
    this.desktopEntity.addEntity(new TextEntity(this.desktopEntity, f5, 0, 16, w, 7, 'FONTS 5X5 ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#ffffff', false, {align: 'center'}));
    this.desktopEntity.addEntity(new TextEntity(this.desktopEntity, f3, 0, 60, w, 5, 'FONTS 3X3 0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#ffffff', false, {align: 'center'}));
    this.desktopEntity.addEntity(new TextEntity(this.desktopEntity, f5, 0, 68, w, 7, 'BANDS MULTIPLY OVER THE BARS', '#c0c0c0', false, {align: 'center'}));
    this.desktopEntity.addEntity(new TextEntity(this.desktopEntity, f5, 0, 168, w, 7, 'O OVERLAY  C STYLE  R RASTER', '#c0c0c0', false, {align: 'center'}));

    this.statusEntity = new TextEntity(this.desktopEntity, f5, 0, h-14, w, 7, '', '#ffff00', false, {align: 'center'});
    this.desktopEntity.addEntity(this.statusEntity);
    this.styleEntity = new TextEntity(this.desktopEntity, f5, 0, h-7, w, 7, '', '#ffff00', false, {align: 'center'});
    this.desktopEntity.addEntity(this.styleEntity);

    this.balls = [new BallEntity(this.desktopEntity, 20, 100, '#ffffff'), new BallEntity(this.desktopEntity, w-40, 150, '#ffffff')];
    this.balls[1].dx = -1;
    this.balls.forEach((ball) => this.desktopEntity.addEntity(ball));

    this.writeStatus();
  } // init

  /**
   * The bottom lines: the ratio, the element and the two switches.
   */
  writeStatus() {
    var layout = this.app.layout;
    this.statusEntity.setText('RATIO '+(Math.round(layout.ratio*100)/100)+'  ELEMENT '+this.app.element.width+'x'+this.app.element.height);
    this.styleEntity.setText('OVERLAY '+(layout.overlayEnabled ? 'ON' : 'OFF')+'  STYLE '+layout.displayStyle.toUpperCase());
  } // writeStatus

  handleEvent(event) {
    if (super.handleEvent(event)) {
      return true;
    }
    switch (event.id) {
      case 'resizeModel':
        this.writeStatus();
        return true;
      case 'keyPress':
        var key = event.key.length == 1 ? event.key.toUpperCase() : event.key;
        switch (key) {
          case 'O':
          case 'Touch':
          case 'Mouse1':
            this.app.layout.setOverlayEnabled(!this.app.layout.overlayEnabled);
            this.writeStatus();
            return true;
          case 'C':
            // the layout reads the cookie only at startup: set the style
            // directly and let the next frame's resize apply it
            var styles = DemoModel.STYLES;
            var style = styles[(styles.indexOf(this.app.layout.displayStyle)+1)%styles.length];
            Tool.writeCookie('displayStyle', style);
            this.app.layout.displayStyle = style;
            this.app.resizeRequested = true;
            this.writeStatus();
            return true;
          case 'R':
            var config = this.app.platform.config;
            config.width = (config.width == 224) ? 208 : 224;
            config.overlay.bands.forEach((band) => { band.width = config.width; });
            this.app.setModel('DemoModel');
            return true;
        }
        break;
    }
    return false;
  } // handleEvent

  /**
   * The overlay goes over the desktop, after everything on it.
   */
  drawModel() {
    super.drawModel();
    this.app.layout.paintOverlay(this);
  } // drawModel

  loopModel(timestamp) {
    super.loopModel(timestamp);
    // the discs move at the monitor's 60 Hz
    if (timestamp-this.movedAt >= 1000/60) {
      this.movedAt = timestamp;
      this.balls.forEach((ball) => ball.step(this.desktopWidth, this.desktopHeight));
    }
    this.drawModel();
  } // loopModel

} // DemoModel
