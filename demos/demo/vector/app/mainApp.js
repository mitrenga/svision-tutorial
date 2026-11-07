const { AbstractApp } = await import('./svision/js/abstractApp.js?ver='+window.srcVersion);
const { DemoModel } = await import('./demoModel.js?ver='+window.srcVersion);
const { AtariVectorFont } = await import('./svision/js/platform/vector/atari/atariVectorFont.js?ver='+window.srcVersion);
const { VectorFont4x6 } = await import('./svision/js/platform/vector/vectorFont4x6.js?ver='+window.srcVersion);
// begin code

export class MainApp extends AbstractApp {

  constructor(platform, importPath, wsURL) {
    super(platform, 'bodyApp', importPath, wsURL);

    this.controls = {
      keyboard: {},
      mouse: {enable: false},
      gamepads: {supported: false, devices: {}},
      touchscreen: {supported: false, type: false}
    };

    // the vector fonts of the texts (no default one, R-063): the Atari ROM's and the library's own
    this.fonts = {vector: new AtariVectorFont(), vector4x6: new VectorFont4x6()};

    this.model = new DemoModel(this);
    this.model.init();
  } // constructor

} // MainApp
