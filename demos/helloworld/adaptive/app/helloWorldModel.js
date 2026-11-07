const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { TextEntity } = await import('./svision/js/platform/canvas2D/textEntity.js?ver='+window.srcVersion);
// begin code

export class HelloWorldModel extends AbstractModel {

  constructor(app) {
    super(app);
    this.id = 'HelloWorldModel';
  } // constructor

  init() {
    super.init();

    this.desktopEntity.bkColor = '#4f8fd6';   // light blue, white text
    this.text = new TextEntity(this.desktopEntity, this.app.fonts.vgaFonts8x16Mono, 0, 0, this.desktopWidth, 16, 'Hello world!', '#ffffff', false, {});
    this.desktopEntity.addEntity(this.text);
  } // init

  /**
   * The desktop follows the window: the layout sizes the desktop entity on
   * every resize (desktopWidth stays the platform's logical size), and the
   * text takes that width.
   */
  resizeModel() {
    super.resizeModel();
    this.text.width = this.desktopEntity.width;
    this.drawModel();                 // once more with the new width (super drew before it was known)
  } // resizeModel

} // HelloWorldModel
