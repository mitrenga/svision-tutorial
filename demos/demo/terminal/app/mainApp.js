const { AbstractApp } = await import('./svision/js/abstractApp.js?ver='+window.srcVersion);
const { DemoModel } = await import('./demoModel.js?ver='+window.srcVersion);
const { Version } = await import('./version.js?ver='+window.srcVersion);
// begin code

/**
 * The demo application: one model, the terminal with a host behind it. The
 * terminal's font is built with the platform (the desktop is sized by its
 * cell), so the application takes it from the platform config.
 */
export class MainApp extends AbstractApp {

  constructor(platform, importPath, wsURL) {
    super(platform, 'bodyApp', importPath, wsURL);
    this.id = 'MainApp';
    this.version = Version;

    this.fonts = {terminal: platform.config.font};

    /** what the input manager reads: no bindings to remap here, only whether
        a gamepad or a touch screen is there (main.js sets `supported`) */
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
