const { AbstractApp } = await import('./svision/js/abstractApp.js?ver='+window.srcVersion);
const { Fonts5x5 } = await import('./svision/js/platform/canvas2D/fonts5x5.js?ver='+window.srcVersion);
const { Fonts3x3 } = await import('./svision/js/platform/canvas2D/fonts3x3.js?ver='+window.srcVersion);
const { DemoModel } = await import('./demoModel.js?ver='+window.srcVersion);
const { Version } = await import('./version.js?ver='+window.srcVersion);
// begin code

/**
 * The demo application: one model, the test pattern. The two small fonts are
 * the ones the arcade remakes draw their UI with; a game's own character set
 * (Space Invaders' 8x8) stays in the game.
 */
export class MainApp extends AbstractApp {

  constructor(platform, importPath, wsURL) {
    super(platform, 'bodyApp', importPath, wsURL);
    this.id = 'MainApp';
    this.version = Version;

    this.fonts = {
      fonts5x5: new Fonts5x5(this),
      fonts3x3: new Fonts3x3(this)
    };

    this.setModel('DemoModel');
  } // constructor

  /**
   * Makes the model (again): the demo rebuilds it when the raster size changes.
   * @param {string} model - 'DemoModel'.
   */
  setModel(model) {
    var needResizeApp = false;
    if (this.model) {
      this.model.shutdown();
      needResizeApp = true;
    }
    this.model = new DemoModel(this);
    this.model.init();
    if (needResizeApp) {
      this.resizeApp();
    }
  } // setModel

} // MainApp
