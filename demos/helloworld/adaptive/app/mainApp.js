const { AbstractApp } = await import('./svision/js/abstractApp.js?ver='+window.srcVersion);
const { HelloWorldModel } = await import('./helloWorldModel.js?ver='+window.srcVersion);
const { VGAFonts8x16 } = await import('./svision/js/platform/canvas2D/vga/vgaFonts8x16.js?ver='+window.srcVersion);
// begin code

export class MainApp extends AbstractApp {

  constructor(platform, importPath, wsURL) {
    super(platform, 'bodyApp', importPath, wsURL);

    this.fonts = {};
    this.fonts.vgaFonts8x16Mono = new VGAFonts8x16(this, false);   // the IBM PC's 8x16 text-mode font, as the adaptive demo

    this.model = new HelloWorldModel(this);
    this.model.init();
  } // constructor

} // MainApp
