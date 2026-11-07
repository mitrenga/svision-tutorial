const { AbstractApp } = await import('./svision/js/abstractApp.js?ver='+window.srcVersion);
const { VGAFonts8x16 } = await import('./svision/js/platform/canvas2D/vga/vgaFonts8x16.js?ver='+window.srcVersion);
const { Fonts5x5 } = await import('./svision/js/platform/canvas2D/fonts5x5.js?ver='+window.srcVersion);
const { DemoModel } = await import('./demoModel.js?ver='+window.srcVersion);
const { Version } = await import('./version.js?ver='+window.srcVersion);
// begin code

/**
 * The demo application: one model that lays itself out again on every
 * resize. The 8x16 font is the one the adaptive games draw their consoles
 * with; the 5x5 font is there for the small print.
 */
export class MainApp extends AbstractApp {

  constructor(platform, importPath, wsURL) {
    super(platform, 'bodyApp', importPath, wsURL);
    this.id = 'MainApp';
    this.version = Version;

    this.fonts = {
      vgaFonts8x16: new VGAFonts8x16(this, true),
      vgaFonts8x16Mono: new VGAFonts8x16(this, false),
      fonts5x5: new Fonts5x5(this)
    };

    this.model = new DemoModel(this);
    this.model.init();
  } // constructor

} // MainApp
