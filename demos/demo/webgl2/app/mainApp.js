const { AbstractApp } = await import('./svision/js/abstractApp.js?ver='+window.srcVersion);
const { Fonts5x5 } = await import('./svision/js/platform/canvas2D/fonts5x5.js?ver='+window.srcVersion);
const { DemoModel } = await import('./demoModel.js?ver='+window.srcVersion);
const { Version } = await import('./version.js?ver='+window.srcVersion);
// begin code

/**
 * The demo application: one model, the test scene.
 */
export class MainApp extends AbstractApp {

  constructor(platform, importPath, wsURL) {
    super(platform, 'bodyApp', importPath, wsURL);
    this.id = 'MainApp';
    this.version = Version;

    // the HUD is canvas2D text over the 3D picture: a bitmap font of the library
    this.fonts = {
      fonts5x5: new Fonts5x5(this)
    };

    this.controls = {
      keyboard: {},
      mouse: {enable: false},
      gamepads: {supported: false, devices: {}},
      touchscreen: {supported: false, type: false}
    };

    this.model = new DemoModel(this);
    this.model.init();
  } // constructor

} // MainApp
