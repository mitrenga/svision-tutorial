const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { TerminalScreen } = await import('./svision/js/platform/canvas2D/terminal/terminalScreen.js?ver='+window.srcVersion);
const { TerminalVT52 } = await import('./svision/js/platform/canvas2D/terminal/terminalVT52.js?ver='+window.srcVersion);
const { TerminalLine } = await import('./svision/js/platform/canvas2D/terminal/terminalLine.js?ver='+window.srcVersion);
const { TerminalKeyboard } = await import('./svision/js/platform/canvas2D/terminal/terminalKeyboard.js?ver='+window.srcVersion);
const { TerminalScreenEntity } = await import('./svision/js/platform/canvas2D/terminal/terminalScreenEntity.js?ver='+window.srcVersion);
const { IE15Terminal } = await import('./ie15Terminal.js?ver='+window.srcVersion);
// begin code

/**
 * The terminal and the host behind it, both in this model (a game has the host
 * in a worker, R-061):
 *
 * - the **terminal** is the 15IE-00-013 of Tetris 1984 (ie15Terminal.js, the
 *   same file as in `tetris`): the firmware (`TerminalVT52` with its profile)
 *   over the screen (`TerminalScreen`, 80x24 and the status line) with its
 *   KOI-7 charset (SO/SI: Latin and Cyrillic), fed by the line
 *   (`TerminalLine`, 9600 baud) and shown by the entity; BEL is an event of
 *   the firmware — the platform has no sound and this demo plays none, the
 *   host only writes how many bells rang;
 * - the **host** is a script of bytes queued on the line — the banner, both
 *   character sets, tab stops, a box drawn by cursor addressing, the bell, a
 *   prompt — and then an echo of what is typed: `TerminalKeyboard` turns the
 *   keys into the bytes a terminal sends, the host sends them back, Enter
 *   makes a new line with a prompt, Backspace rubs out, Escape replays.
 *
 * The status line is the terminal's own firmware's: the speed of the line,
 * the setup bits and a clock from power-on (IE15Terminal.drawStatus).
 */
export class DemoModel extends AbstractModel {

  /** where the count of bells is written */
  static get BELL_ROW() { return 12; }
  static get BELL_COL() { return 70; }

  /** the speed of the line, bits a second — the terminal's */
  static get BAUD() { return IE15Terminal.BAUD; }

  constructor(app) {
    super(app);
    this.id = 'DemoModel';

    this.charset = null;
    this.screen = null;
    this.firmware = null;
    this.line = null;
    this.keyboard = null;
    this.terminalEntity = null;
    /** characters typed on the current line, for Backspace */
    this.typed = 0;
    /** the shift (SI/SO) the host's last byte left the terminal in */
    this.hostShift = null;
    /** the terminal's clock: when it was switched on and the second shown */
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
    this.firmware = new TerminalVT52(this.screen, this.charset, IE15Terminal.profile());
    this.firmware.onBell = () => this.bellRang();
    this.line = new TerminalLine((value) => this.firmware.writeByte(value), {baud: DemoModel.BAUD});
    // the terminal's keys (IE15Terminal.keyboard) plus Escape and the arrows for the demo
    this.keyboard = new TerminalKeyboard(this.charset, {
      keys: {
        Enter: 0x0D, Backspace: 0x7F, Delete: 0x7F, Tab: 0x09, Escape: 0x1B,
        ArrowUp: [0x1B, 0x41], ArrowDown: [0x1B, 0x42], ArrowRight: [0x1B, 0x43], ArrowLeft: [0x1B, 0x44]
      },
      printable: true
    });
    this.terminalEntity = new TerminalScreenEntity(this.desktopEntity, 0, 0,
      this.desktopWidth, this.desktopHeight, this.screen, this.app.fonts.terminal, config);
    this.desktopEntity.addEntity(this.terminalEntity);

    this.hostScript();
  } // init

  // ------------------------------------------------------------------- host

  /**
   * The host sends text: the charset encodes the printable characters — with
   * SO before Cyrillic and SI before Latin when the set changes, so the host
   * keeps track of the shift it left the terminal in — and a control
   * character (CR, LF, TAB, BEL ...) goes as its own byte.
   */
  send(text) {
    var run = '';
    var flushRun = () => {
      if (run) {
        var encoded = this.charset.encode(run, this.hostShift);
        this.line.push(encoded.bytes);
        this.hostShift = encoded.shift;
        run = '';
      }
    };
    Array.from(text).forEach((ch) => {
      var code = ch.charCodeAt(0);
      if (code < 0x20) {
        flushRun();
        this.line.push(code);
      } else {
        run += ch;
      }
    });
    flushRun();
  } // send

  /** The host sends ESC and the given characters. */
  esc(sequence) {
    this.line.push(0x1B);
    this.send(sequence);
  } // esc

  /** ESC Y: the cursor to a row and a column, both + 040 as on the VT52. */
  at(row, col) {
    this.line.push([0x1B, 0x59, 0x20+row, 0x20+col]);
  } // at

  /**
   * What the host sends at power-on: a screen that uses every part of the
   * firmware, so the whole platform is seen at the speed of the line.
   */
  hostScript() {
    this.line.flush();
    this.typed = 0;
    this.line.push(this.charset.shiftCodes.SI);            // the terminal into the Latin set
    this.hostShift = 'SI';
    this.esc('H');
    this.esc('J');
    this.send('SVISION TERMINAL DEMO  -  the 15IE-00-013 of Tetris 1984, a VT52 on a line\r\n');
    this.send('The host sends bytes, the firmware draws them; nothing here touches the screen.\r\n');
    this.send('\r\nKOI-7, 7 bits a byte: after SI (017) the Latin set, after SO (016) the Cyrillic\r\n');
    this.send(' !"#$%&\'()*+,-./0123456789:;<=>?   @ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\r\n');
    this.send('`abcdefghijklmnopqrstuvwxyz{|}~\x7f   (DEL 177 is the solid block here)\r\n');
    this.send(IE15Terminal.KOI7_SMALL+'   '+IE15Terminal.KOI7_CAPITALS+'\r\n');
    this.send('\r\nTAB\tstops\tevery\t8\tcolumns\r\n');
    this.send('\r\nESC H home   ESC J clear to end of screen   ESC K clear to end of line\r\n');
    this.send('ESC A B C D cursor up down right left   ESC I reverse line feed\r\n');
    this.send('BEL (07) is an event of the firmware (no sound here); bells so far: \x07\r\n\r\n');
    this.send('Keys: type and the host echoes; Enter a new line,\r\n');
    this.send('Backspace rubs out, Tab, arrows move the cursor,\r\n');
    this.send('Escape replays this screen.\r\n\r\n');
    this.send(DemoModel.BAUD+' baud, '+Math.floor(DemoModel.BAUD/10)+' chars a second: watch it fill.');

    // a box by cursor addressing, to the right of the keys
    var left = 50, right = 78, top = 15, bottom = 20;
    this.at(top, left);
    this.send('+'+'-'.repeat(right-left-1)+'+');
    for (var row = top+1; row < bottom; row++) {
      this.at(row, left);
      this.send('|');
      this.at(row, right);
      this.send('|');
    }
    this.at(bottom, left);
    this.send('+'+'-'.repeat(right-left-1)+'+');
    this.at(top+2, left+3);
    this.send('ESC Y row col: the cursor');
    this.at(top+3, left+3);
    this.send('goes where the host says');

    this.at(22, 0);
    this.send('> ');
  } // hostScript

  /**
   * BEL arrived: the demo has no sound, so the count goes on the screen — the
   * host writes it at the end of the BEL line and puts the cursor back.
   */
  bellRang() {
    var cursor = Object.assign({}, this.screen.cursor);
    var count = String(this.firmware.bells);
    this.screen.setCursor(DemoModel.BELL_COL, DemoModel.BELL_ROW);
    this.firmware.write(this.charset.encode(count, 'SI').bytes);
    this.screen.setCursor(cursor.col, cursor.row);
  } // bellRang

  /**
   * The host's side of typing: what the terminal sent comes back as an echo.
   * @param {Uint8Array} bytes - What the keyboard sent.
   */
  hostInput(bytes) {
    switch (bytes[0]) {
      case 0x0D:                                   // Enter: a new line and a prompt
        this.send('\r\n> ');
        this.typed = 0;
        break;
      case 0x7F:                                   // Backspace: back, blank, back - or the bell at the prompt
        if (this.typed > 0) {
          this.line.push([0x08, 0x20, 0x08]);
          this.typed--;
        } else {
          this.line.push(0x07);
        }
        break;
      case 0x1B:                                   // Escape: power-on again; ESC A-D: the cursor moves
        if (bytes.length == 1) {
          this.hostScript();
        } else {
          this.line.push(bytes);
        }
        break;
      default:
        this.line.push(bytes);
        this.typed++;
    }
  } // hostInput

  // --------------------------------------------------------------- terminal

  /**
   * The status line of the terminal's own firmware, its clock counting from
   * power-on — the page loaded.
   * @param {number} timestamp - The time now, ms.
   */
  updateStatus(timestamp) {
    if (this.powerOn === null) {
      this.powerOn = timestamp;
    }
    var second = Math.floor((timestamp-this.powerOn)/1000);
    if (second != this.statusSecond) {
      this.statusSecond = second;
      IE15Terminal.drawStatus(this.screen, this.charset, second);
    }
  } // updateStatus

  handleEvent(event) {
    if (super.handleEvent(event)) {
      return true;
    }
    switch (event.id) {
      case 'keyPress':
        var bytes = this.keyboard.bytesFor(event.key);
        if (bytes.length) {
          this.hostInput(bytes);
          return true;
        }
        break;
    }
    return false;
  } // handleEvent

  loopModel(timestamp) {
    super.loopModel(timestamp);
    this.line.update(timestamp);                   // bytes arrive at the speed of the line
    this.terminalEntity.loopEntity(timestamp);     // the cursor blinks
    this.updateStatus(timestamp);
    this.drawModel();                              // the app's loop only ticks the model; drawing is the model's
  } // loopModel

} // DemoModel
