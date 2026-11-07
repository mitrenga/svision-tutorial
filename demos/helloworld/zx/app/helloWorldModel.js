const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { TextEntity } = await import('./svision/js/platform/canvas2D/textEntity.js?ver='+window.srcVersion);
const { ZXColor } = await import('./svision/js/platform/canvas2D/zx/zxColor.js?ver='+window.srcVersion);
// begin code

export class HelloWorldModel extends AbstractModel {
  
  constructor(app) {
    super(app);
    this.id = 'HelloWorldModel';
  } // constructor

  init() {
    super.init();

    this.borderEntity.bkColor = ZXColor.green;
    this.desktopEntity.bkColor = ZXColor.white;
    this.desktopEntity.addEntity(new TextEntity(this.desktopEntity, this.app.fonts.zxFonts8x8Mono, 0, 0, this.desktopWidth, 8, 'Hello world!', ZXColor.red, false, {}));
  } // init

} // HelloWorldModel
