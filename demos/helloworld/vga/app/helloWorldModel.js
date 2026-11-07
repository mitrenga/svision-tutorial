const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { TextEntity } = await import('./svision/js/platform/canvas2D/textEntity.js?ver='+window.srcVersion);
const { VGAPalette } = await import('./svision/js/platform/canvas2D/vga/vgaPalette.js?ver='+window.srcVersion);
// begin code

export class HelloWorldModel extends AbstractModel {

  constructor(app) {
    super(app);
    this.id = 'HelloWorldModel';
  } // constructor

  init() {
    super.init();

    // the DOS prompt's colours: black screen and border, light grey text (colour 7 of the default palette)
    var palette = VGAPalette.defaultPalette();
    this.borderEntity.bkColor = palette.cssColor(0);
    this.desktopEntity.bkColor = palette.cssColor(0);
    this.desktopEntity.addEntity(new TextEntity(this.desktopEntity, this.app.fonts.vgaFonts8x16Mono, 0, 0, this.desktopWidth, 16, 'Hello world!', palette.cssColor(7), false, {}));
  } // init

} // HelloWorldModel
