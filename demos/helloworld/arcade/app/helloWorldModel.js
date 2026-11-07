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

    // the black screen of the cabinet, white text in the library's 5x5 font
    this.borderEntity.bkColor = '#000000';
    this.desktopEntity.bkColor = '#000000';
    this.desktopEntity.addEntity(new TextEntity(this.desktopEntity, this.app.fonts.fonts5x5, 0, 0, this.desktopWidth, 7, 'HELLO WORLD!', '#ffffff', false, {}));
  } // init

} // HelloWorldModel
