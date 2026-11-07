const { AbstractApp } = await import('./svision/js/abstractApp.js?ver='+window.srcVersion);
const { Fonts5x5 } = await import('./svision/js/platform/canvas2D/fonts5x5.js?ver='+window.srcVersion);
const { DemoModel } = await import('./demoModel.js?ver='+window.srcVersion);
const { Version } = await import('./version.js?ver='+window.srcVersion);
// begin code

/**
 * The demo application: one model, the sandbox of the Super Nintendo
 * platform. **No boot model**: the console has no BIOS, RESET jumps into the
 * cartridge (R-050), so there is nothing to show before the program. No
 * sound either — the S-DSP and the SPC700 are a later step, so there is no
 * audio manager here at all.
 */
export class MainApp extends AbstractApp {

  constructor(platform, importPath, wsURL, devModeName) {
    super(platform, 'bodyApp', importPath, wsURL);
    this.id = 'MainApp';
    this.version = Version;
    this.devModeName = devModeName === undefined ? false : devModeName;

    this.fonts = {};
    /** the library's 5x5 font: the demo cuts its BG3 text tiles out of its glyphs */
    this.fonts.fonts5x5 = new Fonts5x5(this);

    /** what the input manager reads: no bindings to remap here, only whether
        a gamepad or a touch screen is there (main.js sets `supported`) */
    this.controls = {
      keyboard: {},
      mouse: {enable: false},
      gamepads: {supported: false, devices: {}},
      touchscreen: {supported: false, type: false}
    };

    this.setModel('DemoModel');
  } // constructor

  /**
   * Switches models — there is one, but the shape is the games' (R-002).
   * @param {string} model - 'DemoModel'.
   */
  setModel(model) {
    var needResizeApp = false;
    if (this.model) {
      this.model.shutdown();
      needResizeApp = true;
    }
    switch (model) {
      case 'DemoModel':
        this.model = new DemoModel(this);
        break;
    } // switch
    this.model.init();
    if (needResizeApp) {
      this.resizeApp();
    }
  } // setModel

} // MainApp
