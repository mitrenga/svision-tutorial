const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { TerminalScreen } = await import('./svision/js/platform/canvas2D/terminal/terminalScreen.js?ver='+window.srcVersion);
const { TerminalVT52 } = await import('./svision/js/platform/canvas2D/terminal/terminalVT52.js?ver='+window.srcVersion);
const { TerminalScreenEntity } = await import('./svision/js/platform/canvas2D/terminal/terminalScreenEntity.js?ver='+window.srcVersion);
const { IE15Terminal } = await import('./ie15Terminal.js?ver='+window.srcVersion);
// begin code

/**
 * On a terminal nobody draws text: the host sends bytes down the line and the
 * terminal's firmware puts them on the screen. So the model is the firmware
 * (TerminalVT52 with the 15IE profile over a TerminalScreen with its KOI-7
 * charset), the entity shows the screen, and "HELLO WORLD!" is what the host
 * sent, then CR LF, so the cursor blinks on the next line. The status line is the terminal's own: the speed, the
 * setup bits and a clock from power-on.
 */
export class HelloWorldModel extends AbstractModel {

  constructor(app) {
    super(app);
    this.id = 'HelloWorldModel';
    this.screen = null;
    this.charset = null;
    this.terminalEntity = null;
    this.powerOn = null;
    this.statusSecond = -1;
  } // constructor

  init() {
    super.init();
    var config = this.app.platform.config;
    this.borderEntity.bkColor = config.borderColor;
    this.desktopEntity.bkColor = config.background;

    this.charset = IE15Terminal.charset();
    this.screen = new TerminalScreen(config);
    var firmware = new TerminalVT52(this.screen, this.charset, IE15Terminal.profile());
    this.terminalEntity = new TerminalScreenEntity(this.desktopEntity, 0, 0,
      this.desktopWidth, this.desktopHeight, this.screen, this.app.fonts.terminal, config);
    this.desktopEntity.addEntity(this.terminalEntity);

    // what came down the line: the text as the charset encodes it, CR and LF as bytes
    firmware.write(this.charset.encode('HELLO WORLD!').bytes);
    firmware.write([0x0D, 0x0A]);
  } // init

  loopModel(timestamp) {
    super.loopModel(timestamp);
    this.terminalEntity.loopEntity(timestamp);    // the cursor blinks by the model's clock
    if (this.powerOn === null) {
      this.powerOn = timestamp;
    }
    var second = Math.floor((timestamp-this.powerOn)/1000);
    if (second != this.statusSecond) {
      this.statusSecond = second;
      IE15Terminal.drawStatus(this.screen, this.charset, second);
    }
    this.drawModel();                             // the app's loop only ticks the model; drawing is the model's
  } // loopModel

} // HelloWorldModel
