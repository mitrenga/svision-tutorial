const { AbstractApp } = await import('./svision/js/abstractApp.js?ver='+window.srcVersion);
const { HelloWorldModel } = await import('./helloWorldModel.js?ver='+window.srcVersion);
const { C64Fonts8x8 } = await import('./svision/js/platform/canvas2D/c64/c64Fonts8x8.js?ver='+window.srcVersion);
// begin code

export class MainApp extends AbstractApp {

  constructor(platform, importPath, wsURL) {
    super(platform, 'bodyApp', importPath, wsURL);

    this.fonts = {};
    this.fonts.c64Fonts8x8 = new C64Fonts8x8(this, false);

    this.model = new HelloWorldModel(this);
    this.model.init();
  } // constructor

} // MainApp
