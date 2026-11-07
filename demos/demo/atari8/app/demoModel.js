const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { Atari8ScreenEntity } = await import('./svision/js/platform/canvas2D/atari8/atari8ScreenEntity.js?ver='+window.srcVersion);
const { Atari8DisplayList } = await import('./svision/js/platform/canvas2D/atari8/atari8DisplayList.js?ver='+window.srcVersion);
const { Atari8Color } = await import('./svision/js/platform/canvas2D/atari8/atari8Color.js?ver='+window.srcVersion);
const { Atari8Codes } = await import('./svision/js/platform/canvas2D/atari8/atari8Codes.js?ver='+window.srcVersion);
// begin code

/**
 * The test screen, built the way a game builds it: one display list of its
 * own that begins with the three blank-8 lines every Atari program begins
 * with and then fills **the 192 scan lines the desktop shows** — the picture
 * Graphics 0 draws too, so the boot screen and the demo are the same size
 * and neither leaves a band of background inside the picture. What the machine can do that a C64 cannot is the
 * list itself: five ANTIC modes on one screen, and the colour registers
 * changed between them by display list interrupts.
 *
 *   lines  mode  what
 *    24    blank  three blank-8 lines, as every list begins — outside the
 *                 desktop's window, so they are border
 *    16      7   the title: 20 double-width characters, a colour each
 *     8      2   what the list is made of
 *     8      2   the palette's heading (and the first DLI)
 *    64     13   the palette: 16 hues down, four luminances across, one DLI
 *                per hue — 64 of the 256 colours, and the reason a game
 *                needs DLIs at all (a scan line has four playfield colours)
 *    24      2   the character set: the ATASCII graphics, lowercase, inverse
 *    16      6   coloured text: the character's top two bits pick COLPF0-3
 *    16      4   the game's own set as 2x2 tiles, four colours plus COLPF3
 *    24      2   the keys
 *    16      2   the registers and the layout's ratio
 *
 * Keys:
 *
 *   B    next hue of COLBK (the background and, with it, the border)
 *   0-3  next hue of COLPF0-COLPF3
 *   C    CHBASE between the game's set and the ROM's
 *   X    player 0 width: normal, double, quadruple
 *   M    missiles on and off
 *   P    PRIOR bit 4: the missiles as a fifth player in COLPF3
 *   R    switch the machine off and on again
 *
 * A click or a tap is B. Nothing here is random: the players move as a
 * function of the clock, so the picture is the same on every run.
 */
export class DemoModel extends AbstractModel {

  /** where the demo puts things in the 64 KB */
  static get DLIST() { return 0x6800; }
  static get CHARSET() { return 0x7000; }
  static get PMBASE() { return 0x3000; }
  /** the screen memory of each block of the list */
  static get TITLE() { return 0x4000; }
  static get SUBTITLE() { return 0x4040; }
  static get PALETTE_HEAD() { return 0x4080; }
  static get PALETTE() { return 0x4400; }
  static get CHARS() { return 0x4900; }
  static get COLORTEXT() { return 0x4A00; }
  static get TILES() { return 0x4B00; }
  static get KEYS() { return 0x4C00; }
  static get STATUS() { return 0x4D00; }
  /** the first character of the tile glyphs in the set: past the letters */
  static get TILE_CHAR() { return 96; }
  /** the first scan line of each block in the picture */
  static get PALETTE_TOP() { return 56; }
  static get TILES_TOP() { return 160; }
  /** the frame line of a picture line: the picture starts at line 8 */
  static get FIRST_LINE() { return 8; }

  constructor(app) {
    super(app);
    this.id = 'DemoModel';

    this.screenEntity = null;
    this.screen = null;
    this.gameSet = true;
    this.playerSize = 0;
    this.missiles = true;
    this.fifthPlayer = true;
    this.playerRow = -1;
    this.stepAt = 0;
    this.stepIndex = 0;
  } // constructor

  init() {
    super.init();

    this.screenEntity = new Atari8ScreenEntity(this.desktopEntity, 0, 0, this.desktopWidth, this.desktopHeight);
    this.desktopEntity.addEntity(this.screenEntity);
    this.screen = this.screenEntity.screen;
    this.screen.powerOn(this.app.fonts.atari8Fonts8x8.setBytes(0));
    this.buildCharset();
    this.buildDisplayList();
    this.buildScreen();
    this.buildPlayers();
    this.applyBackground();
    this.writeRegisters();
    this.writeRatios();
  } // init

  /**
   * COLBK is one register for both: the background under the picture and the
   * border around it, which is why a game that changes it changes both.
   */
  applyBackground() {
    var color = Atari8Color.color(this.screen.colbk);
    if (this.borderEntity != null) {
      this.borderEntity.bkColor = color;
    }
    this.desktopEntity.bkColor = color;
  } // applyBackground

  /**
   * The game's character set: the ROM's first 96 glyphs (space to the
   * capitals and the graphics), then four tiles of 2x2 characters in mode 4
   * pixel pairs — 16 glyphs.
   */
  buildCharset() {
    var set = new Uint8Array(1024);
    set.set(this.app.fonts.atari8Fonts8x8.setBytes(0).subarray(0, DemoModel.TILE_CHAR*8));
    var at = DemoModel.TILE_CHAR*8;
    DemoModel.TILES_ART.forEach((tile) => {
      // a tile is 16 rows of 8 pairs; each quarter is a glyph of 8 rows of 4 pairs
      for (var q = 0; q < 4; q++) {
        var x0 = (q%2)*4, y0 = Math.floor(q/2)*8;
        for (var y = 0; y < 8; y++) {
          var byte = 0;
          for (var x = 0; x < 4; x++) {
            byte = (byte << 2) | (parseInt(tile[y0+y][x0+x], 10) & 3);
          }
          set[at++] = byte;
        }
      }
    });
    this.screen.write(DemoModel.CHARSET, set);
    this.screen.setCharsetPage(DemoModel.CHARSET >> 8);
  } // buildCharset

  /**
   * The display list: nine blocks, 240 scan lines, no blank lines. Every
   * block has its own LMS, so each one is a screen of its own in memory;
   * the palette's lines carry a display list interrupt each, so every hue
   * gets the four colour registers to itself.
   */
  buildDisplayList() {
    var list = new Atari8DisplayList()
      .blank(8).blank(8).blank(8)
      .mode(7, 1, {lms: DemoModel.TITLE})
      .mode(2, 1, {lms: DemoModel.SUBTITLE})
      .mode(2, 1, {lms: DemoModel.PALETTE_HEAD, dli: true});
    for (var hue = 0; hue < 16; hue++) {
      // two lines of mode D (two scan lines each) per hue, the second of them
      // handing the registers over to the next hue
      list.mode(13, 1, hue === 0 ? {lms: DemoModel.PALETTE} : undefined);
      list.mode(13, 1, {dli: true});
    }
    list
      .mode(2, 2, {lms: DemoModel.CHARS})
      .mode(2, 1, {dli: true})
      .mode(6, 2, {lms: DemoModel.COLORTEXT})
      .mode(4, 2, {lms: DemoModel.TILES})
      .mode(2, 3, {lms: DemoModel.KEYS})
      .mode(2, 2, {lms: DemoModel.STATUS})
      .jump(DemoModel.DLIST);

    this.screen.write(DemoModel.DLIST, list.bytes());
    this.screen.setDisplayList(DemoModel.DLIST);
    this.lineCount = list.scanLines();
  } // buildDisplayList

  /**
   * The interrupts as data: one per hue of the palette, and a last one that
   * gives the registers back to the rest of the screen. Rebuilt whenever a
   * key changes a colour, because that last one carries the current values.
   */
  buildDLI() {
    var s = this.screen;
    var list = [];
    for (var hue = 0; hue < 16; hue++) {
      list.push({
        colbk: Atari8Color.value(hue, 2),
        colpf0: Atari8Color.value(hue, 6),
        colpf1: Atari8Color.value(hue, 10),
        colpf2: Atari8Color.value(hue, 14)
      });
    }
    // the registers back for the rest of the screen, and with them the ROM
    // set: the character rows show all 128 glyphs, including the lowercase
    // the game's own set has spent on tiles
    list.push({colbk: s.colbk, colpf0: s.colpf[0], colpf1: s.colpf[1], colpf2: s.colpf[2], colpf3: s.colpf[3],
               chbase: 0xE0});
    // and the game's set again for the coloured text and the tiles
    list.push({chbase: this.gameSet ? DemoModel.CHARSET >> 8 : 0xE0});
    s.setDLI(list);
  } // buildDLI

  /**
   * Everything the list points at.
   */
  buildScreen() {
    var s = this.screen;

    // the colours the machine starts the demo with: COLPF2 is the text
    // background and a tile colour at once, COLPF1 only lends its luminance
    // to the text — that is the machine, and the DLIs above are the way out
    s.setColor('colbk', 0x00);
    s.setColor('colpf0', 0x26);
    s.setColor('colpf1', 0x0A);
    s.setColor('colpf2', 0x94);
    s.setColor('colpf3', 0xA8);
    this.buildDLI();

    // mode 7: the title, every character in one of the four playfield colours
    this.printWide(DemoModel.TITLE, 0, 'SVISION ATARI 8-BIT', (i) => i%4);

    s.print(0, 0, ' DISPLAY LIST  7 2 D 6 4  DLI  CHARSET', false, DemoModel.SUBTITLE);
    s.print(0, 0, ' GTIA PALETTE  16 HUES X 4 LUMINANCES', false, DemoModel.PALETTE_HEAD);
    this.buildPalette();

    // the ATASCII graphics: the 32 codes the machine puts below space
    var graphics = '';
    for (var code = 0; code < 32; code++) {
      graphics += String.fromCodePoint(Atari8Codes.codePoint(code));
    }
    s.print(0, 0, ' '+graphics, false, DemoModel.CHARS);
    s.print(0, 1, ' ♦ ♠ ↰ ◀ ▶   ABCDEFGHIJKLMNOPQRSTUVWXYZ', false, DemoModel.CHARS);
    s.print(0, 2, ' abcdefghijklmnopqrstuvwxyz', false, DemoModel.CHARS);
    s.print(29, 2, 'INVERSE', true, DemoModel.CHARS);

    // mode 6: 20 characters of double width, the colour in the top two bits
    this.printWide(DemoModel.COLORTEXT, 0, 'ANTIC MODE 6  20X8', (i) => i%4);
    this.printWide(DemoModel.COLORTEXT+20, 0, 'PF0 PF1 PF2 PF3 ', (i) => Math.floor(i/4));

    // the tile field: 20 tiles of 2 x 2 characters from the game's set
    for (var ty = 0; ty < 1; ty++) {
      for (var tx = 0; tx < 20; tx++) {
        var tile = (tx === 0 || tx === 19) ? 0
          : (tx*7+ty*3)%11 < 4 ? 3 : (tx+ty)%5 === 0 ? 1 : (tx*3+ty)%7 === 0 ? 2 : 3;
        this.putTile(tx, ty, tile);
      }
    }

    s.print(0, 0, ' B COLBK    0-3 COLPF0-3    C CHBASE', false, DemoModel.KEYS);
    s.print(0, 1, ' X SIZE   M MISSILES   P PRIOR (5TH)', false, DemoModel.KEYS);
    s.print(0, 2, ' R POWER OFF AND ON', false, DemoModel.KEYS);

  } // buildScreen

  /**
   * The palette's own screen memory: every line is four bands of ten bytes,
   * the pixel pairs 00, 01, 10 and 11 — COLBK, COLPF0, COLPF1 and COLPF2,
   * which the interrupt of that hue has just filled with four luminances.
   */
  buildPalette() {
    var bytes = new Uint8Array(32*40);
    var band = [0x00, 0x55, 0xAA, 0xFF];
    for (var line = 0; line < 32; line++) {
      for (var col = 0; col < 40; col++) {
        bytes[line*40+col] = band[Math.floor(col/10)];
      }
    }
    this.screen.write(DemoModel.PALETTE, bytes);
  } // buildPalette

  /**
   * Writes a line of mode 6 or 7: 20 characters of six bits, the colour
   * register in bits 6-7, so only the first 64 glyphs — capitals, digits and
   * punctuation, as on the machine.
   * @param {number} address - The line's screen memory.
   * @param {number} col - 0-19.
   * @param {string} text - The text, uppercase.
   * @param {Function} color - Index of the character to 0-3.
   */
  printWide(address, col, text, color) {
    var codes = Atari8Codes.encode(text);
    for (var i = 0; i < codes.length && col+i < 20; i++) {
      this.screen.memory[(address+col+i) & 0xFFFF] = (codes[i] & 0x3F) | ((color(i) & 3) << 6);
    }
    this.screen.touch();
  } // printWide

  /**
   * Writes one 2x2 tile into the tile area.
   * @param {number} tx - 0-19.
   * @param {number} ty - 0.
   * @param {number} tile - 0 frame, 1 disc, 2 star, 3 stipple.
   */
  putTile(tx, ty, tile) {
    var base = DemoModel.TILES+ty*80+tx*2;
    var code = DemoModel.TILE_CHAR+tile*4;
    var inverse = tile === 2 ? 0x80 : 0;   // the star takes COLPF3 for its brightest pair
    this.screen.memory[base] = code | inverse;
    this.screen.memory[base+1] = (code+1) | inverse;
    this.screen.memory[base+40] = (code+2) | inverse;
    this.screen.memory[base+41] = (code+3) | inverse;
    this.screen.touch();
  } // putTile

  /**
   * The registers as a status line, hex like a monitor.
   */
  writeRegisters() {
    var s = this.screen;
    var h2 = (v) => v.toString(16).toUpperCase().padStart(2, '0');
    var line = ' BK='+h2(s.colbk)+' PF='+h2(s.colpf[0])+' '+h2(s.colpf[1])+' '+h2(s.colpf[2])+' '+h2(s.colpf[3])
      +' CHB='+h2(s.chbase)+' SZ='+this.playerSize+' PR='+h2(s.prior);
    s.print(0, 0, ' '.repeat(40), false, DemoModel.STATUS);
    s.print(0, 0, line.substring(0, 40), false, DemoModel.STATUS);
  } // writeRegisters

  /**
   * The layout's ratio, in the last row — to see the scaling at work. The
   * picture fills the frame, so anything around it is the border alone.
   */
  writeRatios() {
    var layout = this.app.layout;
    // the list's lines and the window's: the difference is what the border
    // took over, and it is meant to be seen here
    var shown = this.screenEntity != null ? this.screenEntity.lines : this.lineCount;
    var text = ' RATIO '+layout.ratio+' '+this.app.element.width+'X'+this.app.element.height
      +'  '+this.lineCount+'/'+shown+' LINES '+this.screen.dli.length+' DLI';
    this.screen.print(0, 1, ' '.repeat(40), false, DemoModel.STATUS);
    this.screen.print(0, 1, text.substring(0, 40), false, DemoModel.STATUS);
  } // writeRatios

  /**
   * Players and missiles: PM memory at $3000, single line resolution, so one
   * byte of the strip is one scan line of the frame. Player 0 walks the tile
   * field, player 1 is a bar beside it, players 2 and 3 float over the
   * palette, and the four missiles are a fifth player in COLPF3.
   */
  buildPlayers() {
    var s = this.screen;
    s.memory.fill(0, DemoModel.PMBASE, DemoModel.PMBASE+2048);
    s.setRegister('pmbase', DemoModel.PMBASE >> 8);
    s.setRegister('dmactl', 0x3E);
    s.setRegister('gractl', 3);
    s.setColor('colpm0', 0x1E);
    s.setColor('colpm1', 0x58);
    s.setColor('colpm2', 0xC8);
    s.setColor('colpm3', 0x38);
    s.setRegister('prior', 0x10);
    s.setPlayerSize(1, 1);
    s.setPosition(false, 1, 48+140);

    // player 1: a bar down the right of the tile field
    var top = DemoModel.TILES_TOP+DemoModel.FIRST_LINE;
    for (var y = top; y < top+16; y++) {
      s.memory[DemoModel.PMBASE+1024+256+y] = (y & 4) ? 0x3C : 0x18;
    }
    // the missiles: a dashed column down the palette, all four side by side
    var palette = DemoModel.PALETTE_TOP+DemoModel.FIRST_LINE;
    for (var m = 0; m < 4; m++) {
      s.setPosition(true, m, 48+70+m*4);
    }
    for (var my = palette; my < palette+64; my++) {
      s.memory[DemoModel.PMBASE+768+my] = (my & 4) ? 0xFF : 0x00;
    }
    s.touch();
    this.placePlayer(0, 0);
    this.floatPlayers(0);
  } // buildPlayers

  /**
   * Clears a player's strip and puts a shape at a scan line of the frame.
   * @param {number} index - 0-3.
   * @param {number} frameLine - The scan line of the frame, 8-247.
   * @param {Uint8Array} shape - One byte per scan line.
   */
  setPlayerStrip(index, frameLine, shape) {
    var strip = DemoModel.PMBASE+1024+256*index;
    this.screen.memory.fill(0, strip, strip+256);
    this.screen.memory.set(shape, strip+Math.max(0, Math.min(256-shape.length, frameLine)));
    this.screen.touch();
  } // setPlayerStrip

  /**
   * Player 0 at a tile: the shape copied into the strip at the tile's scan
   * lines, the old one cleared, HPOS set — which is what moving a player
   * vertically meant on this machine.
   * @param {number} tx - 0-19.
   * @param {number} ty - 0.
   */
  placePlayer(tx, ty) {
    this.playerRow = DemoModel.TILES_TOP+DemoModel.FIRST_LINE+ty*16;
    this.setPlayerStrip(0, this.playerRow, DemoModel.WALKER);
    this.screen.setPosition(false, 0, 48+tx*8);
  } // placePlayer

  /**
   * Players 2 and 3 over the palette: 2 walks a figure eight, 3 a circle in
   * the opposite phase. A player moves sideways by one register (HPOS) and
   * up and down only by having its shape copied elsewhere in the strip,
   * which is what moving one vertically meant on this machine — and a player
   * is drawn over every ANTIC mode alike, which is why they are shown here.
   * @param {number} timestamp - Milliseconds.
   */
  floatPlayers(timestamp) {
    var top = DemoModel.PALETTE_TOP+DemoModel.FIRST_LINE;
    var middle = top+(64-DemoModel.DIAMOND.length)/2;
    var span = (64-DemoModel.DIAMOND.length)/2;
    var a = timestamp/3000*2*Math.PI;
    // the eight: one turn across to two up and down (a Lissajous figure 1:2)
    this.setPlayerStrip(2, Math.round(middle+Math.sin(a*2)*span), DemoModel.DIAMOND);
    this.screen.setPosition(false, 2, 88+Math.round(Math.sin(a)*24));
    // the circle, half a turn behind
    this.setPlayerStrip(3, Math.round(middle-Math.sin(a)*span), DemoModel.ARROW);
    this.screen.setPosition(false, 3, 178+Math.round(Math.cos(a)*20));
  } // floatPlayers

  handleEvent(event) {
    if (super.handleEvent(event)) {
      return true;
    }
    switch (event.id) {
      case 'resizeModel':
        this.writeRatios();
        return true;
      case 'keyPress':
        var key = event.key.length == 1 ? event.key.toUpperCase() : event.key;
        var s = this.screen;
        switch (key) {
          case 'B':
          case 'Mouse1':
          case 'Touch':
            s.setColor('colbk', s.colbk+0x10);
            this.applyBackground();
            this.buildDLI();
            this.writeRegisters();
            return true;
          case '0':
          case '1':
          case '2':
          case '3':
            var n = key.charCodeAt(0)-48;
            s.setColor('colpf'+n, s.colpf[n]+0x10);
            this.buildDLI();
            this.writeRegisters();
            return true;
          case 'C':
            this.gameSet = !this.gameSet;
            s.setCharsetPage(this.gameSet ? DemoModel.CHARSET >> 8 : 0xE0);
            this.buildDLI();
            this.writeRegisters();
            return true;
          case 'X':
            this.playerSize = [1, 3, 0, 0][this.playerSize];
            s.setPlayerSize(0, this.playerSize);
            this.writeRegisters();
            return true;
          case 'M':
            this.missiles = !this.missiles;
            s.setRegister('gractl', this.missiles ? 3 : 2);
            return true;
          case 'P':
            this.fifthPlayer = !this.fifthPlayer;
            s.setRegister('prior', this.fifthPlayer ? 0x10 : 0x00);
            this.writeRegisters();
            return true;
          case 'R':
            this.app.setModel('BootModel');
            return true;
        }
        break;
    }
    return false;
  } // handleEvent

  loopModel(timestamp) {
    super.loopModel(timestamp);

    // the walker steps through the field every 400 ms, snake-wise
    if (timestamp-this.stepAt >= 400) {
      this.stepAt = timestamp;
      this.stepIndex = (this.stepIndex+1)%36;
      var ty = 0;
      var tx = 1+(this.stepIndex < 18 ? this.stepIndex : 35-this.stepIndex);
      this.putTile(tx, ty, 3);
      this.placePlayer(tx, ty);
    }
    this.floatPlayers(timestamp);
    this.drawModel();
  } // loopModel

} // DemoModel

// the tiles: 16 rows of 8 pixel pairs, a digit per pair — 0 COLBK, 1 COLPF0,
// 2 COLPF1, 3 COLPF2 (COLPF3 with the inverse bit)

DemoModel.TILES_ART = [
  [ // frame
    '33333333', '32222223', '32000023', '32011023', '32011023', '32011023', '32011023', '32011023',
    '32011023', '32011023', '32011023', '32011023', '32000023', '32222223', '33333333', '33333333'
  ],
  [ // disc
    '00022000', '00222200', '02222220', '02222220', '22222222', '22211222', '22211222', '22222222',
    '22222222', '02222220', '02222220', '00222200', '00022000', '00000000', '00000000', '00000000'
  ],
  [ // star
    '00033000', '00033000', '00033000', '30033003', '33333333', '03333330', '00333300', '00033000',
    '00333300', '03333330', '33333333', '30033003', '00033000', '00033000', '00033000', '00000000'
  ],
  [ // stipple
    '11111111', '11211211', '11111111', '12111121', '11111111', '11211211', '11111111', '12111121',
    '11111111', '11211211', '11111111', '12111121', '11111111', '11211211', '11111111', '12111121'
  ]
];

/** player 0: the walker, 16 scan lines, 8 bits wide */
DemoModel.WALKER = Uint8Array.from([
  0x3C, 0x7E, 0x5A, 0x7E, 0x3C, 0x18, 0x7E, 0xDB, 0xDB, 0x5A, 0x18, 0x24, 0x24, 0x24, 0x66, 0x00
]);

/** player 2: 12 scan lines */
DemoModel.DIAMOND = Uint8Array.from([
  0x18, 0x3C, 0x7E, 0xFF, 0xFF, 0xE7, 0xE7, 0xFF, 0xFF, 0x7E, 0x3C, 0x18
]);

/** player 3: 12 scan lines */
DemoModel.ARROW = Uint8Array.from([
  0x18, 0x18, 0x18, 0x18, 0x18, 0xFF, 0x7E, 0x3C, 0x18, 0x00, 0x66, 0x66
]);
