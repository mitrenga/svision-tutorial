const { AbstractApp } = await import('./svision/js/abstractApp.js?ver='+window.srcVersion);
const { VGAFonts8x16 } = await import('./svision/js/platform/canvas2D/vga/vgaFonts8x16.js?ver='+window.srcVersion);
const { DOSBootModel } = await import('./svision/js/platform/canvas2D/vga/dosBootModel.js?ver='+window.srcVersion);
const { DemoModel } = await import('./demoModel.js?ver='+window.srcVersion);
const { AudioManager } = await import('./audioManager.js?ver='+window.srcVersion);
const { Version } = await import('./version.js?ver='+window.srcVersion);
// begin code

/**
 * The demo application: boots "MS-DOS", runs the test picture. Two models,
 * switched by name the way the games do it.
 */
export class MainApp extends AbstractApp {

  constructor(platform, importPath, wsURL) {
    super(platform, 'bodyApp', importPath, wsURL);
    this.id = 'MainApp';
    this.version = Version;

    this.fonts = {};
    this.fonts.vgaFonts8x16Mono = new VGAFonts8x16(this, false);
    this.audioManager = new AudioManager(this);

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
        this.model = new DOSBootModel(this, {
          nextModel: 'DemoModel',
          dos: {
            autoexec: ['Microsoft (R) Mouse Driver Version 8.20', ''],
            commands: [
              {command: 'CD VGADEMO', prompt: 'C:\\VGADEMO>'},
              {command: 'VGADEMO'}
            ]
          }
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
