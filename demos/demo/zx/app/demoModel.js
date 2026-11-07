const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { ZXVideoRAMEntity } = await import('./svision/js/platform/canvas2D/zx/zxVideoRAMEntity.js?ver='+window.srcVersion);
const { ZXVideoRAM } = await import('./svision/js/platform/canvas2D/zx/zxVideoRAM.js?ver='+window.srcVersion);
const { ZXColor } = await import('./svision/js/platform/canvas2D/zx/zxColor.js?ver='+window.srcVersion);
const { ZXDialogEntity } = await import('./svision/js/platform/canvas2D/zx/zxDialogEntity.js?ver='+window.srcVersion);
const { ZXDialogProperties } = await import('./svision/js/platform/canvas2D/zx/zxDialogProperties.js?ver='+window.srcVersion);
const { ZXSettingsEntity } = await import('./svision/js/platform/canvas2D/zx/zxSettingsEntity.js?ver='+window.srcVersion);
const { ZXVolumeEntity } = await import('./svision/js/platform/canvas2D/zx/zxVolumeEntity.js?ver='+window.srcVersion);
const { ZXPlayerNameEntity } = await import('./svision/js/platform/canvas2D/zx/zxPlayerNameEntity.js?ver='+window.srcVersion);
const { ZXWaitForAudioEventEntity } = await import('./svision/js/platform/canvas2D/zx/zxWaitForAudioEventEntity.js?ver='+window.srcVersion);
// begin code

/**
 * The test picture: the whole 6912 bytes of video memory in one
 * ZXVideoRAMEntity, written into the way a game writes — glyphs with
 * pokeCell(), attributes with pokeAttribute(), a sprite with blitShifted()
 * and XOR, a tape block byte by byte at its interleaved address.
 *
 *   rows  0      title
 *   rows  2-9    64 ink x paper cells, normal (cols 0-7) and BRIGHT (cols 8-15);
 *                the character set of the ROM (cols 17-31); a FLASH line (row 9)
 *   rows 11-14   the keys
 *   rows 15-22   left: a ring XORed over scenery, moving a pixel a frame —
 *                what a Spectrum sprite does to the background;
 *                middle: cells with BRIGHT and FLASH set, for the attribute mask;
 *                right: the 8x8 cells a tape block loads into
 *   row  23      the layout's ratio and the element size
 *
 * Keys:
 *   T  load a block from "tape": pilot tone, then 576 bytes at the speed of
 *      the tape format, each byte poked as its sound has passed
 *   P  pilot tone on/off        K  key click          B  the ROM's beeps
 *   X  the XOR sprite on/off    M  attribute mask (hides BRIGHT and FLASH)
 *   C  border colour            F  FLASH phase running/stopped
 *   S  settings dialog          V  volume dialog      N  player name dialog
 *   E  the error panel          R  reset
 */
export class DemoModel extends AbstractModel {

  /** where the tape block lands and where the sprite moves, in cells */
  static get TAPE_AREA() { return {col: 24, row: 15, cols: 8, rows: 8}; }
  static get SPRITE_AREA() { return {col: 0, row: 15, cols: 16, rows: 8}; }
  static get MASK_AREA() { return {col: 17, row: 15, cols: 6, rows: 8}; }

  constructor(app) {
    super(app);
    this.id = 'DemoModel';

    this.screen = null;
    this.dialogProperties = ZXDialogProperties.merge({});

    this.flashRunning = true;
    this.borderColor = 7;
    this.masked = false;
    this.pilotPlaying = false;
    this.tapeBlock = null;       // the linear block: 512 bytes of bitmap, 64 of attributes
    this.tapeLoading = false;

    // the XOR sprite: a 16x16 ring, two bytes a line
    this.sprite = new Uint8Array([
      0x07,0xE0, 0x18,0x18, 0x20,0x04, 0x40,0x02, 0x40,0x02, 0x80,0x01, 0x80,0x01, 0x80,0x01,
      0x80,0x01, 0x80,0x01, 0x80,0x01, 0x40,0x02, 0x40,0x02, 0x20,0x04, 0x18,0x18, 0x07,0xE0
    ]);
    this.spriteRunning = true;
    this.spriteDrawn = false;
    this.spriteX = 3;
    this.spriteY = 15*8+5;
    this.spriteDX = 1;
    this.spriteDY = 1;
    this.spriteMovedAt = 0;
  } // constructor

  init() {
    super.init();

    this.borderEntity.bkColor = ZXColor.color(this.borderColor);
    this.screen = new ZXVideoRAMEntity(this.desktopEntity, 0, 0);
    this.desktopEntity.addEntity(this.screen);
    this.composePicture();
    this.tapeBlock = this.buildTapeBlock();

    this.sendEvent(0, {id: 'openAudioBus', bus: 'sounds', options: {}});
    this.app.stack.flashState = false;
    this.sendEvent(320, {id: 'changeFlashState'});
  } // init

  shutdown() {
    this.sendEvent(0, {id: 'stopAllAudioBuses'});
    this.events = [];
    super.shutdown();
  } // shutdown

  // ------------------------------------------------------------ the picture

  /**
   * An attribute byte out of its parts.
   * @param {number} ink - 0-7.
   * @param {number} paper - 0-7.
   * @param {boolean} [bright] - The BRIGHT bit.
   * @param {boolean} [flash] - The FLASH bit.
   * @returns {number} The byte.
   */
  static attr(ink, paper, bright, flash) {
    return ink | (paper << 3) | (bright ? 0x40 : 0) | (flash ? 0x80 : 0);
  } // attr

  /**
   * Writes a text into the memory, one cell per character.
   * @param {number} row - Character row.
   * @param {number} col - Character column of the first character.
   * @param {string} text - The text.
   * @param {number} attr - The attribute of every cell.
   */
  writeText(row, col, text, attr) {
    var vram = this.screen.videoRAM;
    var font = this.app.fonts.zxFonts8x8Mono;
    for (var i = 0; i < text.length; i++) {
      vram.pokeCell(row, col+i, font.glyphBytes(text[i]));
      vram.pokeAttribute(row, col+i, attr);
    }
  } // writeText

  /**
   * Draws the static part of the picture.
   */
  composePicture() {
    var vram = this.screen.videoRAM;
    var black = DemoModel.attr(0, 7);
    vram.clear(0, black);

    this.writeText(0, 0, ' ZX SPECTRUM 256x192 6912 BYTES ', DemoModel.attr(7, 0, true));

    // 8 inks x 8 papers, a blob of ink on the paper; the right block BRIGHT
    var blob = [0x3C, 0x7E, 0xFF, 0xFF, 0xFF, 0xFF, 0x7E, 0x3C];
    for (var paper = 0; paper < 8; paper++) {
      for (var ink = 0; ink < 8; ink++) {
        vram.pokeCell(2+paper, ink, blob);
        vram.pokeAttribute(2+paper, ink, DemoModel.attr(ink, paper));
        vram.pokeCell(2+paper, 8+ink, blob);
        vram.pokeAttribute(2+paper, 8+ink, DemoModel.attr(ink, paper, true));
      }
    }

    // the character set of the ROM, 15 a row
    var chars = this.app.fonts.zxFonts8x8Mono.fontsChars;
    for (var c = 0; c < chars.length; c++) {
      this.writeText(2+Math.floor(c/15), 17+(c%15), chars[c], black);
    }
    this.writeText(9, 17, 'FLASH ATTRIBUTE', DemoModel.attr(0, 6, true, true));

    this.writeText(11, 0, 'T TAPE   P PILOT  K CLICK B BEEP', black);
    this.writeText(12, 0, 'S SETUP V VOLUME N NAME E ERROR', black);
    this.writeText(13, 0, 'X SPRITE M MASK C BORDER F FLASH', black);
    this.writeText(14, 0, 'R RESET', black);

    // the scenery the sprite XORs over: cyan paper, a wall of bricks
    var area = DemoModel.SPRITE_AREA;
    vram.fillAttributes(area, DemoModel.attr(0, 5));
    var brick = [0xFF, 0x81, 0x81, 0xFF, 0xF8, 0x88, 0x88, 0xF8];
    for (var col = area.col; col < area.col+area.cols; col++) {
      vram.pokeCell(area.row+area.rows-1, col, brick);
      vram.pokeCell(area.row+area.rows-2, col, brick);
    }
    this.writeText(area.row+2, area.col+1, 'XOR SPRITE', DemoModel.attr(0, 5));
    this.writeText(area.row+3, area.col+1, 'OVER SCENERY', DemoModel.attr(0, 5));

    // cells with BRIGHT and FLASH for the mask: the mask takes both bits off
    area = DemoModel.MASK_AREA;
    for (var r = 0; r < area.rows; r++) {
      for (var k = 0; k < area.cols; k++) {
        vram.pokeCell(area.row+r, area.col+k, blob);
        vram.pokeAttribute(area.row+r, area.col+k, DemoModel.attr(k+1, (r+k)%7+1, true, r%2 == 1));
      }
    }

    // where the tape block lands: empty, framed by its attributes
    vram.clearArea(DemoModel.TAPE_AREA, DemoModel.attr(0, 7));
    this.writeText(DemoModel.TAPE_AREA.row+3, DemoModel.TAPE_AREA.col, 'PRESS T ', black);

    this.spriteDrawn = false;
    this.writeRatio();
    this.screen.invalidate();
  } // composePicture

  /**
   * The layout's ratio and the element size, on the last row.
   */
  writeRatio() {
    var text = 'RATIO '+(Math.round(this.app.layout.ratio*100)/100)+'  '+this.app.element.width+'x'+this.app.element.height;
    this.writeText(23, 0, text.padEnd(32, ' ').substring(0, 32), DemoModel.attr(0, 7));
    this.screen.invalidate();
  } // writeRatio

  /**
   * The block T loads: 8x8 cells as a linear bitmap (one byte per 8 pixels,
   * rows top to bottom) plus one attribute per cell — the shape a tape block
   * of a loading screen has, and the shape ZXVideoRAM.setLinear() takes.
   * @returns {Uint8Array} 576 bytes.
   */
  buildTapeBlock() {
    var lines = ['        ', ' LOADED ', '  FROM  ', '  TAPE  ', ' AT THE ', ' SPEED  ', 'OF SOUND', '        '];
    var papers = [1, 2, 3, 4, 5, 6, 2, 1];
    var font = this.app.fonts.zxFonts8x8Mono;
    var block = new Uint8Array(8*8*8+8*8);
    for (var row = 0; row < 8; row++) {
      for (var col = 0; col < 8; col++) {
        var glyph = (row == 0 || row == 7) ? [0xAA, 0x55, 0xAA, 0x55, 0xAA, 0x55, 0xAA, 0x55] : font.glyphBytes(lines[row][col]);
        for (var line = 0; line < 8; line++) {
          block[(row*8+line)*8+col] = glyph[line];
        }
        block[512+row*8+col] = DemoModel.attr(7, papers[row], true);
      }
    }
    return block;
  } // buildTapeBlock

  /**
   * One byte off the tape: index in the linear block -> its place in the
   * interleaved memory. Bitmap first (line by line, 8 bytes a line), then the
   * 64 attributes — the picture appears the way a real loading screen does,
   * in thirds of pixel lines and then in colour.
   * @param {number} at - Index in the block.
   * @param {number} value - The byte.
   */
  pokeTapeByte(at, value) {
    var area = DemoModel.TAPE_AREA;
    if (at < 512) {
      var line = Math.floor(at/area.cols);
      var col = at%area.cols;
      this.screen.pokeOffset(ZXVideoRAM.lineOffset(area.row*ZXVideoRAM.CELL+line)+area.col+col, value);
    } else {
      var index = at-512;
      this.screen.pokeOffset(ZXVideoRAM.ATTRIBUTES_OFFSET+(area.row+Math.floor(index/area.cols))*ZXVideoRAM.COLS+area.col+(index%area.cols), value);
    }
  } // pokeTapeByte

  // ---------------------------------------------------------------- dialogs

  /**
   * A dialog of the platform in its window, modal over the picture.
   * @param {string} title - The title bar.
   * @param {Function} contentFactory - dialog => the contents entity.
   */
  openDialog(title, contentFactory) {
    var p = this.dialogProperties;
    this.desktopEntity.addModalEntity(new ZXDialogEntity(this.desktopEntity, p.x, p.y, p.width, p.height, title, p, contentFactory));
  } // openDialog

  /**
   * Asks for the browser's gesture for audio before a sound.
   * @param {string} continueEvent - The event sent when the gesture comes.
   */
  openWaitForAudioEvent(continueEvent) {
    var p = this.dialogProperties.waitForAudioEvent;
    this.desktopEntity.addModalEntity(new ZXDialogEntity(this.desktopEntity, 66, 77, 124, 41, false, p,
      (dialog) => new ZXWaitForAudioEventEntity(dialog, dialog.innerX, dialog.innerY, dialog.innerWidth, dialog.innerHeight, continueEvent, p)));
  } // openWaitForAudioEvent

  // ----------------------------------------------------------------- events

  handleEvent(event) {
    if (super.handleEvent(event)) {
      return true;
    }
    switch (event.id) {
      case 'resizeModel':
        this.writeRatio();
        return true;

      case 'changeFlashState':
        if (this.flashRunning) {
          this.app.stack.flashState = !this.app.stack.flashState;
        }
        this.sendEvent(320, {id: 'changeFlashState'});
        return true;

      case 'startTape':
        if (this.app.inputEventsManager.needEventForAudio()) {
          this.openWaitForAudioEvent('startTape');
          return true;
        }
        this.tapeLoading = true;
        this.pilotPlaying = false;
        this.screen.videoRAM.clearArea(DemoModel.TAPE_AREA, DemoModel.attr(0, 7));
        this.screen.invalidate();
        this.sendEvent(0, {id: 'playSound', bus: 'sounds', sound: 'tapePilotTone', options: {repeat: true}});
        this.sendEvent(1500, {id: 'tapeData'});
        return true;
      case 'tapeData':
        this.sendEvent(0, {id: 'stopAudioBus', bus: 'sounds'});
        this.sendEvent(0, {id: 'playSound', bus: 'sounds', sound: 'tapeBlock', options: {bytes: this.tapeBlock}});
        return true;
      case 'tapeByte':
        this.pokeTapeByte(event.data.at, event.data.value);
        return true;
      case 'tapeEnd':
        this.tapeLoading = false;
        return true;

      case 'keyPress':
        var key = event.key.length == 1 ? event.key.toUpperCase() : event.key;
        switch (key) {
          case 'T':
          case 'Touch':
          case 'Mouse1':
            if (!this.tapeLoading) {
              this.sendEvent(0, {id: 'startTape'});
            }
            return true;
          case 'P':
            this.pilotPlaying = !this.pilotPlaying;
            if (this.pilotPlaying) {
              this.sendEvent(0, {id: 'playSound', bus: 'sounds', sound: 'tapePilotTone', options: {repeat: true}});
            } else {
              this.sendEvent(0, {id: 'stopAudioBus', bus: 'sounds'});
            }
            return true;
          case 'K':
            this.sendEvent(0, {id: 'playSound', bus: 'sounds', sound: 'keyClick', options: false});
            return true;
          case 'B':
            this.sendEvent(0, {id: 'playSound', bus: 'sounds', sound: 'basicBeeps', options: false});
            return true;
          case 'X':
            this.spriteRunning = !this.spriteRunning;
            return true;
          case 'M':
            this.masked = !this.masked;
            this.screen.setAttrMask(this.masked ? 0x3F : 0xFF);
            return true;
          case 'C':
            this.borderColor = (this.borderColor+1)%8;
            this.borderEntity.bkColor = ZXColor.color(this.borderColor);
            return true;
          case 'F':
            this.flashRunning = !this.flashRunning;
            return true;
          case 'S':
            this.openDialog('SETTINGS', (dialog) => new ZXSettingsEntity(dialog, dialog.innerX, dialog.innerY, dialog.innerWidth, dialog.innerHeight, this.app.controlsOptions, this.dialogProperties));
            return true;
          case 'V':
            this.openDialog('sounds', (dialog) => new ZXVolumeEntity(dialog, dialog.innerX, dialog.innerY, dialog.innerWidth, dialog.innerHeight, 'sounds', 'audioBusSoundsLevel', 'basicBeeps', this.dialogProperties));
            return true;
          case 'N':
            this.openDialog('PLAYER NAME', (dialog) => new ZXPlayerNameEntity(dialog, dialog.innerX, dialog.innerY, dialog.innerWidth, dialog.innerHeight, false, this.dialogProperties));
            return true;
          case 'E':
            this.app.showErrorMessage('This is the error panel of the platform. Nothing is wrong.', 'reopen');
            return true;
          case 'R':
            this.app.setModel('ResetModel');
            return true;
        }
        break;
    }
    return false;
  } // handleEvent

  // ------------------------------------------------------------- the sprite

  /**
   * XORs the ring at its position: drawn once it is there, drawn again it is
   * gone and the scenery is whole — the way the Spectrum games rub a sprite out.
   */
  blitSprite() {
    this.screen.videoRAM.blitShifted(this.sprite, 2, 16, this.spriteX, this.spriteY, DemoModel.SPRITE_AREA, 'xor');
    this.spriteDrawn = !this.spriteDrawn;
  } // blitSprite

  loopModel(timestamp) {
    super.loopModel(timestamp);

    // the sprite moves at the machine's frame rate, 50 a second
    if (this.spriteRunning && timestamp-this.spriteMovedAt >= 20) {
      this.spriteMovedAt = timestamp;
      if (this.spriteDrawn) {
        this.blitSprite();
      }
      var area = DemoModel.SPRITE_AREA;
      this.spriteX += this.spriteDX;
      this.spriteY += this.spriteDY;
      if (this.spriteX <= area.col*8 || this.spriteX >= (area.col+area.cols)*8-16) {
        this.spriteDX = -this.spriteDX;
      }
      if (this.spriteY <= area.row*8 || this.spriteY >= (area.row+area.rows)*8-16) {
        this.spriteDY = -this.spriteDY;
      }
      this.blitSprite();
      this.screen.invalidate();
    }
    this.drawModel();
  } // loopModel

} // DemoModel
