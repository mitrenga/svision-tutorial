const { AbstractApp } = await import('./svision/js/abstractApp.js?ver='+window.srcVersion);
const { HelloWorldModel } = await import('./helloWorldModel.js?ver='+window.srcVersion);
const { AtariVectorFont } = await import('./svision/js/platform/vector/atari/atariVectorFont.js?ver='+window.srcVersion);
// begin code

export class MainApp extends AbstractApp {

  constructor(platform, importPath, wsURL) {
    super(platform, 'bodyApp', importPath, wsURL);

    this.fonts = {};
    this.fonts.vector = new AtariVectorFont();   // the font of the vector ROMs of Atari, drawn as lines

    this.model = new HelloWorldModel(this);
    this.model.init();
  } // constructor

} // MainApp
