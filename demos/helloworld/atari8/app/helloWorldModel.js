const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { TextEntity } = await import('./svision/js/platform/canvas2D/textEntity.js?ver='+window.srcVersion);
const { Atari8Color } = await import('./svision/js/platform/canvas2D/atari8/atari8Color.js?ver='+window.srcVersion);
// begin code

export class HelloWorldModel extends AbstractModel {

  constructor(app) {
    super(app);
    this.id = 'HelloWorldModel';
  } // constructor

  init() {
    super.init();

    // the colours of the OS's Graphics 0: the text field COLPF2 blue ($94, POKE 710), the characters in
    // the hue of the field with the luminance of COLPF1 ($CA, POKE 709) — $9A; the border COLBK is black
    // at power-on, here a lighter blue of the same hue ($98, POKE 712,152) to show it is a register too
    this.borderEntity.bkColor = Atari8Color.color(0x98);
    this.desktopEntity.bkColor = Atari8Color.color(0x94);
    this.desktopEntity.addEntity(new TextEntity(this.desktopEntity, this.app.fonts.atari8Fonts8x8, 0, 0, this.desktopWidth, 8, 'HELLO WORLD!', Atari8Color.color(0x9A), false, {}));
  } // init

} // HelloWorldModel
