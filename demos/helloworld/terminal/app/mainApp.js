const { AbstractApp } = await import('./svision/js/abstractApp.js?ver='+window.srcVersion);
const { HelloWorldModel } = await import('./helloWorldModel.js?ver='+window.srcVersion);
// begin code

export class MainApp extends AbstractApp {

  constructor(platform, importPath, wsURL) {
    super(platform, 'bodyApp', importPath, wsURL);

    // the terminal's font is built with the platform (the desktop is sized by its cell)
    this.fonts = {terminal: platform.config.font};

    this.model = new HelloWorldModel(this);
    this.model.init();
  } // constructor

} // MainApp
