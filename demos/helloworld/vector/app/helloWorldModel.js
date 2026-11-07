const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { VectorTextEntity } = await import('./svision/js/platform/vector/vectorTextEntity.js?ver='+window.srcVersion);
// begin code

export class HelloWorldModel extends AbstractModel {

  constructor(app) {
    super(app);
    this.id = 'HelloWorldModel';
  } // constructor

  init() {
    super.init();

    // the beam on the black screen: a text of lines, capitals 32 high, full intensity, the green of Battlezone's menu
    this.desktopEntity.bkColor = false;
    this.desktopEntity.addEntity(new VectorTextEntity(this.desktopEntity, 0, 0, this.desktopWidth, 48, '#40ff40', false, 'Hello world!', {font: this.app.fonts.vector, size: 32, intensity: 15}));
  } // init

} // HelloWorldModel
