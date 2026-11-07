const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { C64TextModeEntity } = await import('./svision/js/platform/canvas2D/c64/c64TextModeEntity.js?ver='+window.srcVersion);
const { C64SpriteEntity } = await import('./svision/js/platform/canvas2D/c64/c64SpriteEntity.js?ver='+window.srcVersion);
const { C64SpriteData } = await import('./svision/js/platform/canvas2D/c64/c64SpriteData.js?ver='+window.srcVersion);
const { C64Color } = await import('./svision/js/platform/canvas2D/c64/c64Color.js?ver='+window.srcVersion);
// begin code

/**
 * The test screen: the 16 colours as coloured text, a frame of PETSCII
 * graphics, both character sets, the border and background registers, and
 * four hardware sprites bouncing over the text — two hires, two multicolour,
 * one of them animated. Keys:
 *
 *   C  switch the character set (uppercase/graphics, lowercase/uppercase)
 *   B  next border colour ($D020)       G  next background colour ($D021)
 *   F  flash the border like a loader   X  expand the sprites (X and Y)
 *   M  hires/multicolour of the multicolour sprites
 *   R  switch the machine off and on again
 *
 * A click or a tap is B. The sprite motion is a function of the clock, not
 * of a random source — there is no simulation here to reproduce.
 */
export class DemoModel extends AbstractModel {

  constructor(app) {
    super(app);
    this.id = 'DemoModel';

    this.screen = null;
    this.sprites = [];
    this.border = 14;
    this.background = 6;
    this.flashing = false;
    this.expanded = false;
    this.multicolor = true;
    this.animatedAt = 0;
  } // constructor

  init() {
    super.init();

    this.setBorder(this.border);
    this.screen = new C64TextModeEntity(this.desktopEntity, 0, 0, this.desktopWidth, this.desktopHeight, this.app.fonts.c64Fonts8x8);
    this.desktopEntity.addEntity(this.screen);
    this.screen.textRAM.setBackground(this.background).showCursor(false);
    this.composeScreen();
    this.buildSprites();
  } // init

  /**
   * $D020: the border entity is the register.
   * @param {number} color - 0-15.
   */
  setBorder(color) {
    this.border = color & 15;
    if (this.borderEntity != null) {
      this.borderEntity.bkColor = C64Color.color(this.border);
    }
  } // setBorder

  /**
   * $D021: the background of the text screen and of the desktop under it.
   * @param {number} color - 0-15.
   */
  setBackground(color) {
    this.background = color & 15;
    this.desktopEntity.bkColor = C64Color.color(this.background);
    this.screen.textRAM.setBackground(this.background);
  } // setBackground

  /**
   * Writes the static part of the screen.
   */
  composeScreen() {
    var text = this.screen.textRAM;
    text.clear(14);

    // a frame of PETSCII box pieces round the title
    text.printAt(0, 0, '┌'+'─'.repeat(38)+'┐', 1);
    text.printAt(0, 1, '│', 1);
    text.printAt(39, 1, '│', 1);
    text.printAt(0, 2, '└'+'─'.repeat(38)+'┘', 1);
    text.printAt(2, 1, 'SVISION C64 PLATFORM  40X25 TEXT MODE', 1);

    // the 16 colours, two columns, name in its own colour on the background
    for (var c = 0; c < 16; c++) {
      var col = c < 8 ? 1 : 21;
      var row = 4+(c%8);
      text.printAt(col, row, String(c).padStart(2, ' ')+' '+C64Color.colorsNames[c].toUpperCase(), c);
      // and as a reverse block, the way a colour bar looks
      text.printAt(col+14, row, '  ', c, true);
    }

    // graphics characters: the shaded blocks, the suits, the quarters
    text.printAt(1, 13, '♠♥♦♣ ▌▄▔▁▒ ▖▗▘▝▚ ╭╮╰╯ ╱╲╳ ┼├┤┬┴ ●○π', 7);
    text.printAt(1, 14, 'SHIFTED  SPACE  IS  A  GLYPH:', 15);
    text.printAt(31, 14, '   ', 15, true);

    // the keys
    text.printAt(1, 16, 'C CHARSET   B BORDER   G BACKGROUND', 13);
    text.printAt(1, 17, 'F FLASH     X EXPAND   M MULTICOLOUR', 13);
    text.printAt(1, 18, 'R POWER OFF AND ON', 13);

    this.writeRegisters();
    this.writeRatios();
  } // composeScreen

  /**
   * The registers as a status line, the way a monitor would show them.
   */
  writeRegisters() {
    var text = this.screen.textRAM;
    var line = '$D020='+this.border.toString(16).toUpperCase().padStart(2, '0')
      +' $D021='+this.background.toString(16).toUpperCase().padStart(2, '0')
      +' CHARSET='+text.charset
      +' MC='+(this.multicolor ? 1 : 0)
      +' XP='+(this.expanded ? 1 : 0);
    text.printAt(1, 20, ' '.repeat(38), 1);
    text.printAt(1, 20, line, 1);
  } // writeRegisters

  /**
   * The layout's ratios, in the last row — to see the scaling at work.
   */
  writeRatios() {
    var layout = this.app.layout;
    var text = 'RATIO '+layout.ratio+'  CANVAS '+this.app.element.width+'X'+this.app.element.height;
    this.screen.textRAM.printAt(1, 23, ' '.repeat(38), 12);
    this.screen.textRAM.printAt(1, 23, text.substring(0, 38), 12);
  } // writeRatios

  /**
   * Four sprites from shapes drawn here as character grids and encoded to
   * the 63 bytes of the chip, so the whole path from bytes to picture runs.
   */
  buildSprites() {
    var memory = new Uint8Array(64*5);
    memory.set(C64SpriteData.encode(DemoModel.BALL), 0);
    memory.set(C64SpriteData.encode(DemoModel.BALL_SQUASHED), 64);
    memory.set(C64SpriteData.encode(DemoModel.SHIP), 128);
    memory.set(C64SpriteData.encode(DemoModel.GHOST, {multicolor: true}), 192);
    memory.set(C64SpriteData.encode(DemoModel.FLOWER, {multicolor: true}), 256);

    var ball = new C64SpriteEntity(this.desktopEntity);
    ball.setShapes(memory, 2, 0).setColors(1);
    var ship = new C64SpriteEntity(this.desktopEntity);
    ship.setShapes(memory, 1, 128).setColors(7);
    var ghost = new C64SpriteEntity(this.desktopEntity, {multicolor: true});
    ghost.setShapes(memory, 1, 192).setColors(3, 1, 0);
    var flower = new C64SpriteEntity(this.desktopEntity, {multicolor: true});
    flower.setShapes(memory, 1, 256).setColors(10, 5, 7);

    // motion: a centre, radii and a period per sprite, in sprite coordinates
    this.sprites = [
      {entity: ball, cx: 100, cy: 150, rx: 60, ry: 70, period: 5000, phase: 0},
      {entity: ship, cx: 250, cy: 130, rx: 70, ry: 40, period: 7000, phase: 1.5},
      {entity: ghost, cx: 180, cy: 200, rx: 120, ry: 30, period: 9000, phase: 3},
      {entity: flower, cx: 80, cy: 90, rx: 40, ry: 30, period: 4000, phase: 4.5}
    ];
    this.sprites.forEach((s) => this.desktopEntity.addEntity(s.entity));
    this.moveSprites(0);
  } // buildSprites

  /**
   * Places every sprite on its ellipse for the moment.
   * @param {number} timestamp - Milliseconds.
   */
  moveSprites(timestamp) {
    this.sprites.forEach((s) => {
      var a = timestamp/s.period*2*Math.PI+s.phase;
      s.entity.setSpritePosition(Math.round(s.cx+Math.cos(a)*s.rx), Math.round(s.cy+Math.sin(a)*s.ry));
    });
    // the ball squashes twice a second
    if (timestamp-this.animatedAt >= 250) {
      this.animatedAt = timestamp;
      var ball = this.sprites[0].entity;
      ball.frame = (ball.frame+1)%ball.frames;
    }
  } // moveSprites

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
        switch (key) {
          case 'C':
            this.screen.textRAM.setCharset(this.screen.textRAM.charset ? 0 : 1);
            this.writeRegisters();
            return true;
          case 'B':
          case 'Mouse1':
          case 'Touch':
            this.flashing = false;
            this.setBorder(this.border+1);
            this.writeRegisters();
            return true;
          case 'G':
            this.setBackground(this.background+1);
            this.writeRegisters();
            return true;
          case 'F':
            this.flashing = !this.flashing;
            return true;
          case 'X':
            this.expanded = !this.expanded;
            this.sprites.forEach((s) => s.entity.setExpand(this.expanded, this.expanded));
            this.writeRegisters();
            return true;
          case 'M':
            this.multicolor = !this.multicolor;
            this.sprites[2].entity.setMulticolor(this.multicolor);
            this.sprites[3].entity.setMulticolor(this.multicolor);
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

    if (this.flashing) {
      // a loader's stripes: a different colour every frame
      this.setBorder(Math.floor(timestamp/20));
    }
    this.moveSprites(timestamp);
    this.screen.loopEntity(timestamp);
    this.drawModel();
  } // loopModel

} // DemoModel

// the shapes: `.` transparent, `2` the sprite's colour; in multicolour `1`
// and `3` are the shared registers and every pair of characters is one pixel

DemoModel.BALL = [
  '........22222222........',
  '......222222222222......',
  '.....22222222222222.....',
  '....2222222222222222....',
  '...222222222222222222...',
  '..22222222222222222222..',
  '..22222222222222222222..',
  '.222222222222222222222..',
  '.2222222222222222222222.',
  '.2222222222222222222222.',
  '.2222222222222222222222.',
  '.2222222222222222222222.',
  '.2222222222222222222222.',
  '.2222222222222222222222.',
  '..22222222222222222222..',
  '..22222222222222222222..',
  '...222222222222222222...',
  '....2222222222222222....',
  '.....22222222222222.....',
  '......222222222222......',
  '........22222222........'
];

DemoModel.BALL_SQUASHED = [
  '........................',
  '........................',
  '........................',
  '........22222222........',
  '......222222222222......',
  '....2222222222222222....',
  '...222222222222222222...',
  '..22222222222222222222..',
  '.2222222222222222222222.',
  '.2222222222222222222222.',
  '222222222222222222222222',
  '222222222222222222222222',
  '.2222222222222222222222.',
  '.2222222222222222222222.',
  '..22222222222222222222..',
  '...222222222222222222...',
  '....2222222222222222....',
  '......222222222222......',
  '........22222222........',
  '........................',
  '........................'
];

DemoModel.SHIP = [
  '...........22...........',
  '...........22...........',
  '..........2222..........',
  '..........2222..........',
  '.........222222.........',
  '.........222222.........',
  '.........222222.........',
  '........22222222........',
  '........22222222........',
  '.......2222222222.......',
  '.......2222222222.......',
  '......222222222222......',
  '.....22222222222222.....',
  '....2222222222222222....',
  '...222222222222222222...',
  '..2222....2222....2222..',
  '..22......2222......22..',
  '..2........22........2..',
  '...........22...........',
  '..........2222..........',
  '.........22..22.........'
];

// multicolour: 12 pixels a row, two characters each
DemoModel.GHOST = [
  '......222222222222......',
  '....2222222222222222....',
  '..22222222222222222222..',
  '..22222222222222222222..',
  '2222111122222222111122..',
  '2222111133222222111133..',
  '2222111133222222111133..',
  '222222222222222222222222',
  '222222222222222222222222',
  '222222222222222222222222',
  '222222222222222222222222',
  '222222222222222222222222',
  '222222222222222222222222',
  '222222222222222222222222',
  '222222222222222222222222',
  '222222222222222222222222',
  '222222222222222222222222',
  '222222222222222222222222',
  '222222222222222222222222',
  '2222..22222222..22222222',
  '22....2222......2222....'
];

DemoModel.FLOWER = [
  '..........1111..........',
  '........11111111........',
  '......111133331111......',
  '......111133331111......',
  '..11111133333333111111..',
  '..11111133333333111111..',
  '111133333333333333331111',
  '111133333333333333331111',
  '..11111133333333111111..',
  '..11111133333333111111..',
  '......111133331111......',
  '......111133331111......',
  '........11111111........',
  '..........1111..........',
  '..........2222..........',
  '..........2222..........',
  '......22222222..........',
  '....2222222222..........',
  '..........2222..........',
  '..........22222222......',
  '..........2222222222....'
];
