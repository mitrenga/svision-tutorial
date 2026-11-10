const { AbstractApp } = await import('./svision/js/abstractApp.js?ver='+window.srcVersion);
const { ZXFonts8x8 } = await import('./svision/js/platform/canvas2D/zx/zxFonts8x8.js?ver='+window.srcVersion);
const { Fonts5x5 } = await import('./svision/js/platform/canvas2D/fonts5x5.js?ver='+window.srcVersion);
const { Fonts3x3 } = await import('./svision/js/platform/canvas2D/fonts3x3.js?ver='+window.srcVersion);
const { ZXResetModel } = await import('./svision/js/platform/canvas2D/zx/zxResetModel.js?ver='+window.srcVersion);
const { ZXErrorEntity } = await import('./svision/js/platform/canvas2D/zx/zxErrorEntity.js?ver='+window.srcVersion);
const { ZXColor } = await import('./svision/js/platform/canvas2D/zx/zxColor.js?ver='+window.srcVersion);
const { Tool } = await import('./svision/js/tool.js?ver='+window.srcVersion);
const { DemoModel } = await import('./demoModel.js?ver='+window.srcVersion);
const { AudioManager } = await import('./audioManager.js?ver='+window.srcVersion);
const { Version } = await import('./version.js?ver='+window.srcVersion);
// begin code

/**
 * The demo application: the machine resets, then the test picture runs. Two
 * models, switched by name the way the ZX remakes do it; the reset model of
 * the library hands over to 'MenuModel', which here is the test picture.
 *
 * What a ZX game has and the platform's dialogs read from the app is here in
 * its smallest form: the fonts, the audio manager, the player's name, the
 * controls with their options (what ZXSettingsEntity shows) and getControls()
 * (how a device's bindings come back from the cookies).
 */
export class MainApp extends AbstractApp {

  constructor(platform, importPath, wsURL) {
    super(platform, 'bodyApp', importPath, wsURL);
    this.id = 'MainApp';
    this.version = Version;
    this.copyright = '© 1982 Sinclair Research Ltd';

    this.fonts = {
      zxFonts8x8Mono: new ZXFonts8x8(this, false),
      zxFonts8x8: new ZXFonts8x8(this, true),
      zxFonts8x8Keys: new ZXFonts8x8(this, false),
      fonts5x5: new Fonts5x5(this),
      fonts3x3: new Fonts3x3(this)
    };
    this.audioManager = new AudioManager(this);
    this.playerName = Tool.readCookie('playerName', '');

    /** what ZXSettingsEntity lists: the devices, their actions and labels */
    this.controlsOptions = {
      keyboard: {
        device: 'keyboard',
        keys: [
          {action: 'left', label: 'LEFT'},
          {action: 'right', label: 'RIGHT'},
          {action: 'fire', label: 'FIRE'}
        ]
      },
      mouse: {
        device: 'mouse',
        keys: [
          {action: 'left', label: 'LEFT'},
          {action: 'right', label: 'RIGHT'},
          {action: 'fire', label: 'FIRE'}
        ]
      },
      gamepads: {
        device: 'gamepads',
        keys: [
          {action: 'left', label: 'LEFT', eventKey: 'GamepadLeft'},
          {action: 'right', label: 'RIGHT', eventKey: 'GamepadRight'},
          {action: 'fire', label: 'FIRE', eventKey: 'GamepadJump'},
          {action: 'up', label: 'MENU UP', eventKey: 'GamepadUp'},
          {action: 'down', label: 'MENU DOWN', eventKey: 'GamepadDown'},
          {action: 'ok', label: 'OK', eventKey: 'GamepadOK'},
          {action: 'exit', label: 'EXIT', eventKey: 'GamepadExit'}
        ]
      },
      touchscreen: {
        device: 'touchscreen',
        types: {
          keys: ['fireLeft', 'fireRight'],
          fireLeft: {
            left: {type: 'button', control: false, action: 'fire', actions: false, sprite: 'fire'},
            right: {type: 'joystick', control: 'horizontal', action: false, actions: ['left', 'right'], sprite: 'left-right'}
          },
          fireRight: {
            left: {type: 'joystick', control: 'horizontal', action: false, actions: ['left', 'right'], sprite: 'left-right'},
            right: {type: 'button', control: false, action: 'fire', actions: false, sprite: 'fire'}
          }
        },
        // the pictograms of the two layouts, the same ones the ZX remakes show
        icons: {
          fire: {compressedSpriteData: 'lP101300N0A970111030Z0510122382012345617171859'},
          'left-right': {compressedSpriteData: 'lP101300N08B701050P020N06910121213421245641465421243121217'}
        }
      }
    };
    this.controls = {
      keyboard: this.getControls('keyboard'),
      mouse: this.getControls('mouse'),
      touchscreen: this.getControls('touchscreen'),
      gamepads: this.getControls('gamepads')
    };

    this.setModel('ResetModel');
  } // constructor

  /**
   * The bindings of a device: the defaults, overlaid with what the player
   * saved through the settings dialog (one cookie per device, a list of
   * gamepad ids and one cookie per gamepad).
   * @param {string} device - 'keyboard', 'mouse', 'touchscreen' or 'gamepads'.
   * @returns {Object} The bindings.
   */
  getControls(device) {
    var result = {};
    switch (device) {
      case 'keyboard':
        result = {left: 'ArrowLeft', right: 'ArrowRight', fire: ' '};
        break;
      case 'mouse':
        result = {enable: false, left: 'Mouse1', right: 'Mouse2', fire: 'Mouse4'};
        break;
      case 'touchscreen':
        result = {supported: false, type: 'fireLeft'};
        break;
      case 'gamepads':
        result = {supported: false, devices: {}};
        break;
    }

    switch (device) {
      case 'keyboard':
      case 'mouse':
      case 'touchscreen':
        var cfgString = Tool.readCookie(device, false);
        if (cfgString !== false) {
          try {
            var cfg = JSON.parse(cfgString);
            Object.keys(cfg).forEach((item) => {
              result[item] = cfg[item];
              if (device == 'touchscreen' && !(result[item] in this.controlsOptions.touchscreen.types)) {
                result[item] = this.controlsOptions.touchscreen.types.keys[0];
              }
            });
          } catch (error) {
            console.error(error.message);
          }
        }
        break;
      case 'gamepads':
        var devicesString = Tool.readCookie('gamepads', false);
        if (devicesString !== false) {
          try {
            var devices = JSON.parse(devicesString);
            if (Array.isArray(devices)) {
              devices.forEach((id) => {
                var deviceString = Tool.readCookie(id, false);
                if (deviceString !== false) {
                  result.devices[id] = JSON.parse(deviceString);
                }
              });
            }
          } catch (error) {
            console.error(error.message);
          }
        }
        break;
    }
    return result;
  } // getControls

  /**
   * Switches models: shuts the current one down, makes the next, initialises
   * it and lays it out.
   * @param {string} model - 'ResetModel', or 'MenuModel' (the name the
   *        library's reset model hands over to) for the test picture.
   */
  setModel(model) {
    var needResizeApp = false;
    if (this.model) {
      this.model.shutdown();
      needResizeApp = true;
    }
    switch (model) {
      case 'ResetModel':
        this.model = new ZXResetModel(this);
        break;
      case 'MenuModel':
      case 'DemoModel':
        this.model = new DemoModel(this);
        break;
    } // switch
    this.model.init();
    if (needResizeApp) {
      this.resizeApp();
    }
  } // setModel

  /**
   * The error panel of the platform over whatever is on the screen.
   * @param {string} message - The text.
   * @param {string} action - 'restart', 'retry' or 'reopen'.
   */
  showErrorMessage(message, action) {
    var topModalEntity = this.model.desktopEntity.topModalEntity();
    topModalEntity.addModalEntity(new ZXErrorEntity(topModalEntity, -topModalEntity.absoluteX(), -topModalEntity.absoluteY(),
      this.fonts.zxFonts8x8, message, action, ZXColor.white, ZXColor.red));
  } // showErrorMessage

} // MainApp
