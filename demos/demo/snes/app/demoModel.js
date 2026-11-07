const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { SNESPPUEntity } = await import('./svision/js/platform/canvas2D/snes/snesPPUEntity.js?ver='+window.srcVersion);
const { SNESTiles } = await import('./svision/js/platform/canvas2D/snes/snesTiles.js?ver='+window.srcVersion);
const { SNESColor } = await import('./svision/js/platform/canvas2D/snes/snesColor.js?ver='+window.srcVersion);
// begin code

/**
 * The test screen, built the way a game builds it: tiles, maps, colours and
 * sprites written into the PPU's own memory, the registers set, and the
 * chip left to make the picture ({@link SNESPPU}). What the machine can do
 * that the library's other machines cannot is on one screen — the layout of
 * *Super R-Type*, the first game on the platform:
 *
 *   BG1   a 64×64 map at word 0, 4 bpp: the ground, scrolling a pixel a frame
 *   BG2   a 64×64 map at word $1000, 4 bpp: stars, scrolling half as fast
 *   BG3   a 32×32 map at word $5C00, 2 bpp: the text — the top lines behind
 *         the sprites, the status lines at the bottom **in front of
 *         everything** through the BG3 priority bit of mode 1, the way the
 *         game's panel sits over the terrain
 *   OBJ   a 16×16 ship flying a figure of eight, and a row of drones to push
 *         the chip over its limits: 32 sprites or 34 tiles on one line, and
 *         the line loses sprites — the **first** ones — while STAT77 says so
 *
 * Keys:
 *
 *   ↑ ↓      more or fewer drones (0-40, 16 to begin with — 32 tiles, the
 *            most a line takes; a click or a tap adds four)
 *   B        the master brightness, 15 down to 0 and round
 *   F        a band of rows 96-127 at half brightness — a register write
 *            inside the frame, as data (`setLineWrites`)
 *   P        the BG3 priority bit of BGMODE on and off
 *   1 2 3 O  BG1, BG2, BG3 and the sprites on the main screen (TM)
 *   SPACE    stop and start the scroll
 *   R        power on again
 *
 * Nothing here is random: the stars come from a seeded generator, the ship
 * moves as a function of the frame counter, so the picture is the same on
 * every run.
 */
export class DemoModel extends AbstractModel {

  /** where the demo puts things in VRAM, in words (the layout of Super R-Type) */
  static get BG1_MAP() { return 0x0000; }
  static get BG2_MAP() { return 0x1000; }
  static get BG3_MAP() { return 0x5C00; }
  static get BG_CHR() { return 0x2000; }
  static get BG3_CHR() { return 0x5000; }
  static get OBJ_CHR() { return 0x6000; }
  /** the characters the BG3 font has, in tile order from tile 1 */
  static get CHARSET() { return ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:-/+?!'; }
  /** the palettes: BG1 ground 0 and 2, BG2 stars 3, BG3 text 7 (white) and 6 (yellow), sprites 8 and 9 */
  static get PAL_GROUND() { return 2; }
  static get PAL_STARS() { return 3; }
  static get PAL_TEXT() { return 7; }
  static get PAL_STATUS() { return 6; }
  static get MAX_DRONES() { return 40; }

  constructor(app) {
    super(app);
    this.id = 'DemoModel';

    this.screenEntity = null;
    this.ppu = null;
    this.frame = 0;
    this.scrolling = true;
    this.drones = 16;
    this.brightness = 15;
    this.band = false;
    this.bg3Priority = true;
    this.layers = 0x17;
  } // constructor

  init() {
    super.init();
    this.desktopEntity.bkColor = '#000000';

    this.screenEntity = new SNESPPUEntity(this.desktopEntity, 0, 0, this.desktopWidth, this.desktopHeight);
    this.desktopEntity.addEntity(this.screenEntity);
    this.ppu = this.screenEntity.ppu;
    this.powerOn();
  } // init

  /**
   * Everything the program would do after RESET: the colours, the tiles,
   * the maps, the sprites parked off screen, the registers.
   */
  powerOn() {
    var ppu = this.ppu;
    ppu.vram.fill(0);
    ppu.cgram.fill(0);
    this.frame = 0;
    this.buildPalette();
    this.buildTiles();
    this.buildFont();
    this.buildMaps();
    this.parkSprites();
    this.writeTexts();
    ppu.write(0x2100, 0x80);                 // forced blank while the program fills the memory
    ppu.write(0x2101, 0x03);                 // sprites 8x8 / 16x16, names at $6000
    ppu.write(0x2105, 0x09);                 // mode 1, BG3 priority
    ppu.write(0x2107, 0x03);                 // BG1 map at 0, 64x64
    ppu.write(0x2108, 0x13);                 // BG2 map at $1000, 64x64
    ppu.write(0x2109, 0x5C);                 // BG3 map at $5C00, 32x32
    ppu.write(0x210B, 0x22);                 // BG1, BG2 tiles at $2000
    ppu.write(0x210C, 0x05);                 // BG3 tiles at $5000
    ppu.write(0x212C, this.layers);
    this.applyBrightness();
    this.applyMode();
    ppu.touch();
  } // powerOn

  /**
   * One CGRAM colour.
   * @param {number} index - 0-255.
   * @param {number} r - 0-31.
   * @param {number} g - 0-31.
   * @param {number} b - 0-31.
   */
  color(index, r, g, b) {
    var word = SNESColor.value(r, g, b);
    this.ppu.cgram[index*2] = word & 0xFF;
    this.ppu.cgram[index*2+1] = word >> 8;
  } // color

  buildPalette() {
    // the backdrop: a deep blue
    this.color(0, 0, 0, 6);
    // palette 0 (1-15): a grey ramp
    for (var i = 1; i < 16; i++) {
      this.color(i, i*2, i*2, i*2);
    }
    // palette 2 (32-47): the ground — browns and a rust
    var ground = DemoModel.PAL_GROUND*16;
    this.color(ground+1, 14, 8, 4);
    this.color(ground+2, 20, 12, 6);
    this.color(ground+3, 8, 5, 3);
    this.color(ground+4, 24, 10, 4);
    this.color(ground+5, 28, 20, 10);
    // palette 3 (48-63): the stars
    var stars = DemoModel.PAL_STARS*16;
    this.color(stars+1, 31, 31, 31);
    this.color(stars+2, 18, 22, 31);
    this.color(stars+3, 31, 24, 12);
    // BG3 2 bpp: palette 7 (28-31) white text, palette 6 (24-27) yellow text on black
    this.color(DemoModel.PAL_TEXT*4+1, 31, 31, 31);
    this.color(DemoModel.PAL_TEXT*4+2, 16, 16, 20);
    this.color(DemoModel.PAL_STATUS*4+1, 31, 27, 8);
    this.color(DemoModel.PAL_STATUS*4+2, 0, 0, 0);
    this.color(DemoModel.PAL_STATUS*4+3, 12, 12, 12);
    // sprite palette 8 (128-143): the ship; palette 9 (144-159): the drones
    this.color(129, 31, 31, 31);
    this.color(130, 24, 24, 26);
    this.color(131, 8, 20, 31);
    this.color(132, 31, 8, 4);
    this.color(133, 31, 20, 0);
    this.color(145, 20, 31, 20);
    this.color(146, 6, 16, 6);
    this.color(147, 31, 31, 31);
  } // buildPalette

  /**
   * The 4 bpp tiles of the backgrounds and the sprites, as text.
   */
  buildTiles() {
    var vram = this.ppu.vram;
    var put = (base, index, rows, bpp) => vram.set(SNESTiles.fromText(rows, bpp), (base+index*SNESTiles.words(bpp))*2);
    // BG tiles 1-6 at $2000
    put(DemoModel.BG_CHR, 1, ['22222222', '21111113', '21111113', '23333333', '22222222', '11132111', '11132111', '33333333'], 4);
    put(DemoModel.BG_CHR, 2, ['33333333', '31111111', '31111111', '31111111', '33333333', '11113111', '11113111', '11113111'], 4);
    put(DemoModel.BG_CHR, 3, ['.4444444', '4555555.', '4544444.', '4544444.', '4544444.', '4544444.', '4544444.', '.4444444'], 4);
    put(DemoModel.BG_CHR, 4, ['........', '........', '........', '...1....', '........', '........', '........', '........'], 4);
    put(DemoModel.BG_CHR, 5, ['........', '........', '...2....', '..222...', '...2....', '........', '........', '........'], 4);
    put(DemoModel.BG_CHR, 6, ['........', '...3....', '...3....', '.33333..', '...3....', '...3....', '........', '........'], 4);
    put(DemoModel.BG_CHR, 7, ['55555555', '55555555', '55555555', '55555555', '55555555', '55555555', '55555555', '55555555'], 4);
    // the ship: 16x16 as tiles 0, 1, 16, 17 of the sprite table
    var ship = [
      '................',
      '.....2222.......',
      '....21111222....',
      '...2111111112...',
      '..21133111111222',
      '.211333111111112',
      '2111111111144442',
      '2111111111144442',
      '2111111111111112',
      '.211111111111112',
      '..2112222111222.',
      '...22...2222....',
      '....5...........',
      '...555..........',
      '....5...........',
      '................'
    ];
    var ring = [
      '.....111111.....',
      '...1133333311...',
      '..133222222331..',
      '.13322222222331.',
      '.13222222222231.',
      '1332222222222331',
      '1322222222222231',
      '1322222222222231',
      '1322222222222231',
      '1322222222222231',
      '1332222222222331',
      '.13222222222231.',
      '.13322222222331.',
      '..133222222331..',
      '...1133333311...',
      '.....111111.....'
    ];
    var quad = (rows, dx, dy) => rows.slice(dy, dy+8).map((r) => r.substring(dx, dx+8));
    [[ship, 0], [ring, 2]].forEach((item) => {
      var rows = item[0], base = item[1];
      put(DemoModel.OBJ_CHR, base, quad(rows, 0, 0), 4);
      put(DemoModel.OBJ_CHR, base+1, quad(rows, 8, 0), 4);
      put(DemoModel.OBJ_CHR, base+16, quad(rows, 0, 8), 4);
      put(DemoModel.OBJ_CHR, base+17, quad(rows, 8, 8), 4);
    });
  } // buildTiles

  /**
   * The BG3 font: the glyphs of the library's 5x5 font cut into 2 bpp
   * tiles, one character a tile from tile 1, in the order of CHARSET.
   */
  buildFont() {
    var font = this.app.fonts.fonts5x5;
    var chars = DemoModel.CHARSET;
    for (var i = 0; i < chars.length; i++) {
      var indices = new Uint8Array(64);
      var glyph = font.fontsData[chars.charAt(i)];
      if (glyph) {
        glyph.data.forEach((rect) => {
          for (var y = rect[1]; y < rect[1]+rect[3]; y++) {
            for (var x = rect[0]; x < rect[0]+rect[2]; x++) {
              if (x+1 < 8 && y+1 < 8) {
                indices[(y+1)*8+x+1] = 1;
              }
            }
          }
        });
      }
      this.ppu.vram.set(SNESTiles.encode(indices, 2), (DemoModel.BG3_CHR+(i+1)*SNESTiles.words(2))*2);
    }
  } // buildFont

  /**
   * One map entry.
   * @param {number} base - The map's word address.
   * @param {number} wide - Whether the map is 64 wide.
   * @param {number} col - The column.
   * @param {number} row - The row.
   * @param {number} entry - tile | palette << 10 | priority << 13 | hflip << 14 | vflip << 15.
   */
  mapEntry(base, wide, col, row, entry) {
    var addr = base+(wide ? ((row & 0x20) << 6) : 0)+((row & 0x1F) << 5)+(col & 0x1F)+(wide && (col & 0x20) ? 0x400 : 0);
    this.ppu.vram[addr*2] = entry & 0xFF;
    this.ppu.vram[addr*2+1] = entry >> 8;
  } // mapEntry

  buildMaps() {
    var ground = DemoModel.PAL_GROUND << 10;
    // BG1: the ground on rows 22-27 of the 64x64 map, pillars every so often, all 64 columns
    for (var col = 0; col < 64; col++) {
      this.mapEntry(DemoModel.BG1_MAP, true, col, 22, 7 | ground);
      for (var row = 23; row < 28; row++) {
        this.mapEntry(DemoModel.BG1_MAP, true, col, row, ((col+row) & 1 ? 1 : 2) | ground);
      }
      if ((col*7)%11 === 0) {
        for (var p = 16; p < 22; p++) {
          this.mapEntry(DemoModel.BG1_MAP, true, col, p, 3 | ground | (p === 16 ? 0x2000 : 0));
        }
      }
    }
    // BG2: stars from a seeded generator — the same sky on every run
    var seed = 0x2A5F1C3D;
    var stars = DemoModel.PAL_STARS << 10;
    for (var r = 0; r < 64; r++) {
      for (var c = 0; c < 64; c++) {
        seed = (Math.imul(seed, 1103515245)+12345) >>> 0;
        var v = (seed >>> 16) & 0x3F;
        if (v < 3) {
          this.mapEntry(DemoModel.BG2_MAP, true, c, r, (4+v) | stars);
        }
      }
    }
  } // buildMaps

  /**
   * Writes a line of text into the BG3 map.
   * @param {number} col - 0-31.
   * @param {number} row - 0-31.
   * @param {string} text - Upper case, the characters of CHARSET.
   * @param {number} palette - 0-7.
   * @param {boolean} [priority] - The priority bit.
   */
  print(col, row, text, palette, priority) {
    var chars = DemoModel.CHARSET;
    for (var i = 0; i < text.length && col+i < 32; i++) {
      var index = chars.indexOf(text.charAt(i).toUpperCase());
      var tile = (index < 0 ? chars.indexOf('?') : index)+1;
      this.mapEntry(DemoModel.BG3_MAP, false, col+i, row, tile | (palette << 10) | (priority ? 0x2000 : 0));
    }
  } // print

  writeTexts() {
    this.print(2, 1, 'SVISION  SUPER NINTENDO  PPU', DemoModel.PAL_TEXT);
    this.print(2, 2, 'MODE 1: BG1 BG2 BG3 OBJ', DemoModel.PAL_TEXT);
    this.print(2, 4, 'UP/DOWN OBJ  B BRIGHT  F BAND', DemoModel.PAL_TEXT);
    this.print(2, 5, 'P PRIO  1 2 3 O LAYERS  SPACE R', DemoModel.PAL_TEXT);
    this.writeStatus();
  } // writeTexts

  /**
   * The two status lines at the bottom, over the ground through the BG3
   * priority bit; the flags are those of the last frame painted.
   */
  writeStatus() {
    var ppu = this.ppu;
    var pad = (s, n) => (s+'                                ').substring(0, n);
    var tiles = this.drones*2;
    // STAT77 of the last frame painted: time over (bit 7) and range over (bit 6)
    this.print(0, 26, pad(' OBJ '+this.drones+' TILES '+tiles+' TIME '+(ppu.timeOver ? 1 : 0)+' RANGE '+(ppu.rangeOver ? 1 : 0), 32), DemoModel.PAL_STATUS, true);
    this.print(0, 27, pad(' BRIGHT '+this.brightness+' BAND '+(this.band ? 1 : 0)+' PRIO '+(this.bg3Priority ? 1 : 0)+' TM '+this.layers.toString(2).padStart(5, '0'), 32), DemoModel.PAL_STATUS, true);
  } // writeStatus

  /** every sprite off screen, as the game parks them: X -255, Y 240 */
  parkSprites() {
    var oam = this.ppu.oam;
    for (var i = 0; i < 128; i++) {
      oam[i*4] = 1;
      oam[i*4+1] = 0xF0;
      oam[i*4+2] = 0;
      oam[i*4+3] = 0;
    }
    oam.fill(0x55, 0x200);
  } // parkSprites

  /**
   * One sprite in OAM.
   * @param {number} i - 0-127.
   * @param {number} x - -256..255.
   * @param {number} y - 0-255.
   * @param {number} tile - The tile number.
   * @param {number} palette - 0-7.
   * @param {number} priority - 0-3.
   * @param {boolean} large - The large size of OBSEL.
   */
  sprite(i, x, y, tile, palette, priority, large) {
    var oam = this.ppu.oam;
    oam[i*4] = x & 0xFF;
    oam[i*4+1] = y & 0xFF;
    oam[i*4+2] = tile & 0xFF;
    oam[i*4+3] = ((priority & 3) << 4) | ((palette & 7) << 1);
    var shift = (i & 3)*2;
    oam[0x200+(i >> 2)] = (oam[0x200+(i >> 2)] & ~(3 << shift)) | (((x < 0 ? 1 : 0) | (large ? 2 : 0)) << shift);
  } // sprite

  /**
   * The sprites of this frame: the ship on its figure of eight, the drones
   * in a row on one line — their count is what the keys change.
   */
  placeSprites() {
    var f = this.frame;
    var shipX = Math.round(96+60*Math.sin(f/50));
    var shipY = Math.round(100+30*Math.sin(f/25));
    this.sprite(0, shipX, shipY, 0, 0, 2, true);
    var y = 136+Math.round(6*Math.sin(f/30));
    for (var i = 0; i < DemoModel.MAX_DRONES; i++) {
      if (i < this.drones) {
        this.sprite(1+i, 8+i*6, y, 2, 1, 1, true);
      } else {
        this.sprite(1+i, 1, 0xF0, 0, 0, 0, false);
        this.ppu.oam[0x200+((1+i) >> 2)] |= 1 << (((1+i) & 3)*2);
      }
    }
  } // placeSprites

  applyBrightness() {
    this.ppu.write(0x2100, this.brightness & 0x0F);
    this.applyBand();
  } // applyBrightness

  /** the band: rows 96-127 at half the brightness, as writes inside the frame */
  applyBand() {
    if (this.band) {
      this.ppu.setLineWrites([
        {line: 96, x: 0, register: 0x2100, value: this.brightness >> 1},
        {line: 128, x: 0, register: 0x2100, value: this.brightness}
      ]);
    } else {
      this.ppu.setLineWrites([]);
    }
  } // applyBand

  applyMode() {
    this.ppu.write(0x2105, 0x01 | (this.bg3Priority ? 0x08 : 0));
  } // applyMode

  handleEvent(event) {
    if (super.handleEvent(event)) {
      return true;
    }
    if (event.id !== 'keyPress') {
      return false;
    }
    var key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
    switch (key) {
      case 'ArrowUp':
        this.drones = Math.min(DemoModel.MAX_DRONES, this.drones+1);
        return true;
      case 'ArrowDown':
        this.drones = Math.max(0, this.drones-1);
        return true;
      case 'Mouse1':
      case 'Touch':
        this.drones = (this.drones+4) % (DemoModel.MAX_DRONES+1);
        return true;
      case 'B':
        this.brightness = (this.brightness+15) % 16;
        this.applyBrightness();
        return true;
      case 'F':
        this.band = !this.band;
        this.applyBand();
        return true;
      case 'P':
        this.bg3Priority = !this.bg3Priority;
        this.applyMode();
        return true;
      case '1': case '2': case '3': case 'O':
        this.layers ^= key === 'O' ? 0x10 : (1 << (key.charCodeAt(0)-49));
        this.ppu.write(0x212C, this.layers);
        return true;
      case ' ':
        this.scrolling = !this.scrolling;
        return true;
      case 'R':
        this.powerOn();
        return true;
    }
    return false;
  } // handleEvent

  /**
   * One frame of the program: the scroll, the sprites, the status — then
   * the chip paints.
   * @param {number} timestamp - What the animation loop was given.
   */
  loopModel(timestamp) {
    super.loopModel(timestamp);
    if (!this.ppu) {
      return;
    }
    if (this.scrolling) {
      this.frame++;
    }
    var ppu = this.ppu;
    var bg1 = this.frame & 0x3FF, bg2 = (this.frame >> 1) & 0x3FF;
    ppu.applyWrite(0x210D, bg1 & 0xFF); ppu.applyWrite(0x210D, bg1 >> 8);
    ppu.applyWrite(0x210F, bg2 & 0xFF); ppu.applyWrite(0x210F, bg2 >> 8);
    this.placeSprites();
    this.writeStatus();
    ppu.touch();
    this.drawModel();
  } // loopModel

} // DemoModel
