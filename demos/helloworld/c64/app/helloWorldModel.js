const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { TextEntity } = await import('./svision/js/platform/canvas2D/textEntity.js?ver='+window.srcVersion);
const { C64Color } = await import('./svision/js/platform/canvas2D/c64/c64Color.js?ver='+window.srcVersion);
// begin code

export class HelloWorldModel extends AbstractModel {

  constructor(app) {
    super(app);
    this.id = 'HelloWorldModel';
  } // constructor

  init() {
    super.init();

    // the colours of the machine switched on: light blue border, blue screen, light blue text
    this.borderEntity.bkColor = C64Color.lightBlue;
    this.desktopEntity.bkColor = C64Color.blue;
    this.desktopEntity.addEntity(new TextEntity(this.desktopEntity, this.app.fonts.c64Fonts8x8, 0, 0, this.desktopWidth, 8, 'HELLO WORLD!', C64Color.lightBlue, false, {}));
  } // init

} // HelloWorldModel
