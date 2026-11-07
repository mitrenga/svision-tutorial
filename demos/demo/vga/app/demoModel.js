const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { VGAVideoRAMEntity } = await import('./svision/js/platform/canvas2D/vga/vgaVideoRAMEntity.js?ver='+window.srcVersion);
const { VGAVideoRAM } = await import('./svision/js/platform/canvas2D/vga/vgaVideoRAM.js?ver='+window.srcVersion);
const { VGAPalette } = await import('./svision/js/platform/canvas2D/vga/vgaPalette.js?ver='+window.srcVersion);
// begin code

/**
 * The test picture: all 256 registers of the BIOS default palette in a grid,
 * a circle to check the 4:3 aspect (it is round on a real monitor and an egg
 * without the pixel aspect), a hue bar that cycles, a grey ramp, and the
 * layout's ratios in text. Keys:
 *
 *   F  fade the palette to black and back
 *   R  start/stop colour cycling of the hue ring (registers 32-55)
 *   S  play a digitised sample (D a second one, N an 8-bit noise recording)
 *   B  boot again
 */
export class DemoModel extends AbstractModel {

  /** the first and last register of the hue ring that cycles */
  static get RING_FIRST() { return 32; }
  static get RING_LAST() { return 55; }

  constructor(app) {
    super(app);
    this.id = 'DemoModel';

    this.screen = null;
    this.originalPalette = null;
    this.fade = false;           // false, 'out' or 'in'
    this.rotating = false;
    this.rotatedAt = 0;
    this.rotatePeriod = 60;      // ms between steps of the colour cycle
  } // constructor

  init() {
    super.init();

    if (this.borderEntity != null) {
      this.borderEntity.bkColor = '#000000';
    }
    this.desktopEntity.bkColor = '#000000';

    this.screen = new VGAVideoRAMEntity(this.desktopEntity, 0, 0, new VGAVideoRAM(), VGAPalette.defaultPalette());
    this.desktopEntity.addEntity(this.screen);
    this.originalPalette = this.screen.palette.copy();
    this.composePicture();

    this.sendEvent(0, {id: 'openAudioBus', bus: 'sounds', options: {muted: false}});
  } // init

  shutdown() {
    this.sendEvent(0, {id: 'stopAllAudioBuses'});
    super.shutdown();
  } // shutdown

  /**
   * Draws the static part of the picture into the memory.
   */
  composePicture() {
    var vram = this.screen.videoRAM;
    var font = this.app.fonts.vgaFonts8x16Mono;
    vram.fill(0);

    // all 256 registers, 16 x 16 cells of 20 x 8 pixels
    for (var index = 0; index < 256; index++) {
      vram.fillRect((index%16)*20, Math.floor(index/16)*8, 20, 8, index);
    }

    // the aspect check: a circle of radius 30 drawn in pixel coordinates
    // corrected by 1.2, so it is round on the 4:3 display
    var cx = 44, cy = 164, r = 30;
    for (var a = 0; a < 360; a += 0.5) {
      var rad = a*Math.PI/180;
      vram.setPixel(Math.round(cx+Math.cos(rad)*r), Math.round(cy+Math.sin(rad)*r/1.2), 15);
    }
    vram.hLine(cx-r, cy, 2*r+1, 8);
    vram.vLine(cx, cy-Math.round(r/1.2), 2*Math.round(r/1.2)+1, 8);

    // the hue ring as a bar, 24 segments of 6 pixels
    for (var seg = 0; seg < 24; seg++) {
      vram.fillRect(92+seg*6, 132, 6, 14, DemoModel.RING_FIRST+seg);
    }
    // the 16 greys as a ramp
    for (var grey = 0; grey < 16; grey++) {
      vram.fillRect(244+grey*4, 132, 4, 14, 16+grey);
    }

    vram.drawText(font, 92, 150, 'VGA 320x200 256 COLOURS', 15);
    vram.drawText(font, 92, 168, 'F FADE R CYCLE S SOUND B BOOT', 7);
    this.writeRatios();
    this.screen.invalidate();
  } // composePicture

  /**
   * The layout's ratios, in the last text line — to see the scaling at work.
   */
  writeRatios() {
    var layout = this.app.layout;
    var text = 'RATIO '+layout.ratio+' x '+(Math.round(layout.ratioY*100)/100)+'  '+this.app.element.width+'x'+this.app.element.height;
    this.screen.videoRAM.fillRect(92, 184, 228, 16, 0);
    this.screen.videoRAM.drawText(this.app.fonts.vgaFonts8x16Mono, 92, 184, text.substring(0, 28), 14);
    this.screen.invalidate();
  } // writeRatios

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
          case 'F':
            // a running fade turns round; otherwise out from the picture, in from black
            if (this.fade !== false) {
              this.fade = this.fade === 'out' ? 'in' : 'out';
            } else {
              this.fade = this.screen.palette.equals(this.originalPalette) ? 'out' : 'in';
            }
            return true;
          case 'R':
            this.rotating = !this.rotating;
            return true;
          case 'S':
          case 'Mouse1':
          case 'Touch':
            this.sendEvent(0, {id: 'playSound', bus: 'sounds', sound: 'blip', options: false});
            return true;
          case 'D':
            this.sendEvent(0, {id: 'playSound', bus: 'sounds', sound: 'chord', options: false});
            return true;
          case 'N':
            this.sendEvent(0, {id: 'playSound', bus: 'sounds', sound: 'noise', options: false});
            return true;
          case 'B':
            this.app.setModel('BootModel');
            return true;
        }
        break;
    }
    return false;
  } // handleEvent

  loopModel(timestamp) {
    super.loopModel(timestamp);

    var palette = this.screen.palette;
    if (this.fade === 'out') {
      if (palette.fadeStep(DemoModel.black(), 2)) {
        this.fade = false;
      }
    } else if (this.fade === 'in') {
      if (palette.fadeStep(this.originalPalette, 2)) {
        this.fade = false;
      }
    }
    if (this.rotating && timestamp-this.rotatedAt >= this.rotatePeriod) {
      this.rotatedAt = timestamp;
      palette.rotate(DemoModel.RING_FIRST, DemoModel.RING_LAST, true);
      // the original of the ring turns with it, so a fade in lands on the turned colours
      this.originalPalette.rotate(DemoModel.RING_FIRST, DemoModel.RING_LAST, true);
    }
    this.drawModel();
  } // loopModel

  /**
   * An all-black palette, made once.
   * @returns {VGAPalette} 256 black registers.
   */
  static black() {
    if (!DemoModel.blackPalette) {
      DemoModel.blackPalette = new VGAPalette();
    }
    return DemoModel.blackPalette;
  } // black

} // DemoModel

DemoModel.blackPalette = null;
