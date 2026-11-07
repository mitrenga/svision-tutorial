const { AbstractApp } = await import('./svision/js/abstractApp.js?ver='+window.srcVersion);
const { HelloWorldModel } = await import('./helloWorldModel.js?ver='+window.srcVersion);
const { Fonts5x5 } = await import('./svision/js/platform/canvas2D/fonts5x5.js?ver='+window.srcVersion);
// begin code

export class MainApp extends AbstractApp {

  constructor(platform, importPath, wsURL) {
    super(platform, 'bodyApp', importPath, wsURL);

    this.fonts = {};
    this.fonts.fonts5x5 = new Fonts5x5(this);   // the console has no font ROM: the library's 5x5

    this.model = new HelloWorldModel(this);
    this.model.init();
  } // constructor

} // MainApp
