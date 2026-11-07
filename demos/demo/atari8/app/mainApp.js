const { AbstractApp } = await import('./svision/js/abstractApp.js?ver='+window.srcVersion);
const { Atari8Fonts8x8 } = await import('./svision/js/platform/canvas2D/atari8/atari8Fonts8x8.js?ver='+window.srcVersion);
const { Atari8BootModel } = await import('./svision/js/platform/canvas2D/atari8/atari8BootModel.js?ver='+window.srcVersion);
const { DemoModel } = await import('./demoModel.js?ver='+window.srcVersion);
const { Version } = await import('./version.js?ver='+window.srcVersion);
// begin code

/**
 * The demo application: switches the machine on, runs the demo. Two
 * models, switched by name the way the games do it. No sound yet — POKEY is
 * a later step, so there is no audio manager here at all.
 */
export class MainApp extends AbstractApp {

  constructor(platform, importPath, wsURL) {
    super(platform, 'bodyApp', importPath, wsURL);
    this.id = 'MainApp';
    this.version = Version;

    this.fonts = {};
    /** the OS character set; `setBytes()` for the machine's memory, a font for text entities */
    this.fonts.atari8Fonts8x8 = new Atari8Fonts8x8(this, false);

    /** what the input manager reads: no bindings to remap here, only whether
        a gamepad or a touch screen is there (main.js sets `supported`) */
    this.controls = {
      keyboard: {},
      mouse: {enable: false},
      gamepads: {supported: false, devices: {}},
      touchscreen: {supported: false, type: false}
    };

    this.setModel('BootModel');
  } // constructor

  /**
   * Switches models: shuts the current one down, makes the next, initialises
   * it and lays it out.
   * @param {string} model - 'BootModel' or 'DemoModel'.
   */
  setModel(model) {
    var needResizeApp = false;
    if (this.model) {
      this.model.shutdown();
      needResizeApp = true;
    }
    switch (model) {
      case 'BootModel':
        this.model = new Atari8BootModel(this, {
          nextModel: 'DemoModel',
          commands: [{command: 'RUN "D:DEMO"'}]
        });
        break;
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
