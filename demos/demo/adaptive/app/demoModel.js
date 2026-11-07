const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { TextEntity } = await import('./svision/js/platform/canvas2D/textEntity.js?ver='+window.srcVersion);
const { ButtonEntity } = await import('./svision/js/platform/canvas2D/buttonEntity.js?ver='+window.srcVersion);
const { MenuEntity } = await import('./svision/js/platform/canvas2D/menuEntity.js?ver='+window.srcVersion);
const { InputEntity } = await import('./svision/js/platform/canvas2D/inputEntity.js?ver='+window.srcVersion);
const { ScrollViewEntity } = await import('./svision/js/platform/canvas2D/scrollViewEntity.js?ver='+window.srcVersion);
const { GridEntity } = await import('./gridEntity.js?ver='+window.srcVersion);
// begin code

/**
 * The adaptive desktop, laid out again on every resize: the platform gives
 * the model a desktop of whatever logical size the element and the target
 * produce, and the model has to place its entities in it — which is what an
 * adaptive game does in its 'resizeModel' handler and a fixed-raster game
 * never has to.
 *
 * On the screen: the grid (GridEntity), a heading with the numbers that
 * matter (target, ratio, desktop, element), a paragraph of wrapped text that
 * reflows with the width, a menu (MenuEntity), a row of buttons
 * (ButtonEntity), a text input (InputEntity) and a scrolling console
 * (ScrollViewEntity) that logs every resize and every event — the UI set the
 * adaptive games are built from. Keys:
 *
 *   -  +   target 256 / 384 / 512 / 768 / 1024 logical pixels (the ratio changes)
 *   G      grid step 8 / 16 / 32
 *   Escape clears the console
 */
export class DemoModel extends AbstractModel {

  static get TARGETS() { return [256, 384, 512, 768, 1024]; }
  static get STEPS() { return [8, 16, 32]; }

  constructor(app) {
    super(app);
    this.id = 'DemoModel';

    this.colors = {
      background: '#10181f', minor: '#1c2a36', major: '#2a4050', diagonal: '#1f3340',
      text: '#c8d8e0', dim: '#7090a0', accent: '#ffd060', bar: '#3f8fbf', barText: '#081018',
      hover: '#264a60', click: '#3a6a88', input: '#0a1016'
    };
    this.stepIndex = 1;
    this.menu = [
      {t1: 'GRID STEP', event: {id: 'gridStep'}},
      {t1: 'SMALLER TARGET', event: {id: 'targetDown'}},
      {t1: 'LARGER TARGET', event: {id: 'targetUp'}},
      {t1: 'CLEAR CONSOLE', event: {id: 'clearConsole'}}
    ];
    this.log = [];
    this.inputValue = 'type here';
    this.resizes = 0;

    this.grid = null;
    this.console = null;
    this.consoleText = null;
    this.menuEntity = null;
  } // constructor

  init() {
    super.init();
    this.desktopEntity.bkColor = this.colors.background;
    // nothing is placed here: the desktop has no size until the first
    // resizeModel, and every resize lays the screen out afresh
  } // init

  // ------------------------------------------------------------- the layout

  /**
   * Places everything for the current desktop size. Called for every resize,
   * so it starts from an empty desktop.
   */
  buildScreen() {
    var d = this.desktopEntity;
    d.shutdown();
    d.modalEntity = null;
    var w = d.width, h = d.height;
    var mono = this.app.fonts.vgaFonts8x16Mono, prop = this.app.fonts.vgaFonts8x16;
    var cw = 8, ch = 16;
    var margin = 8;
    var c = this.colors;

    this.grid = new GridEntity(d, w, h, DemoModel.STEPS[this.stepIndex], c);
    d.addEntity(this.grid);

    // the heading: what the layout made of the element
    var layout = this.app.layout;
    var heading = 'TARGET '+this.app.platform.optSize+'  RATIO '+layout.ratio+'  DESKTOP '+w+'x'+h+'  ELEMENT '+this.app.element.width+'x'+this.app.element.height;
    d.addEntity(new TextEntity(d, mono, margin, margin, w-2*margin, ch, heading, c.accent, false, {}));

    // a paragraph that reflows with the width
    var paragraph = 'The adaptive layout picks a whole-number ratio so that the logical width lands near the target; '
      +'the height follows from the same ratio. Resize the window: the cells of the grid stay the same size and '
      +'the desktop gets more or fewer of them. This text wraps to the width it is given.';
    var paragraphRows = (w < 400) ? 6 : (w < 700 ? 4 : 3);
    d.addEntity(new TextEntity(d, prop, margin, margin+ch+4, w-2*margin, paragraphRows*ch, paragraph, c.text, false, {textWrap: true, align: 'left'}));

    // the menu, left; the buttons and the input, right of it (or under it when narrow)
    var top = margin+ch+4+paragraphRows*ch+8;
    var menuWidth = 18*cw;
    this.menuEntity = new MenuEntity(d, margin, top, menuWidth, this.menu.length*ch, false, {
      fonts: mono, itemHeight: ch, t1LeftMargin: cw, t2Width: cw,
      textColor: c.text, selectionTextColor: c.barText, selectionBarColor: c.bar,
      hoverColor: c.hover, selectionHoverColor: c.bar, clickColor: c.click, selectionClickColor: c.bar,
      selection: 0
    }, this, this.getMenuData);
    d.addEntity(this.menuEntity);

    var narrow = (w < menuWidth+2*margin+30*cw);
    var right = narrow ? margin : margin+menuWidth+2*cw;
    var rightTop = narrow ? top+this.menu.length*ch+8 : top;
    var buttons = [
      {label: ' - ', event: {id: 'targetDown'}, keys: ['-']},
      {label: ' + ', event: {id: 'targetUp'}, keys: ['+']},
      {label: ' GRID ', event: {id: 'gridStep'}, keys: ['G', 'g']}
    ];
    var bx = right;
    buttons.forEach((b) => {
      d.addEntity(new ButtonEntity(d, mono, bx, rightTop, b.label.length*cw, ch, b.label, b.event, b.keys, c.barText, c.bar, {hoverColor: c.hover, clickColor: c.click}));
      bx += b.label.length*cw+cw;
    });
    d.addEntity(new TextEntity(d, mono, right, rightTop+ch+4, 6*cw, ch, 'INPUT', c.dim, false, {}));
    d.addEntity(new InputEntity(d, mono, right+6*cw, rightTop+ch+4, Math.min(24*cw, w-right-6*cw-margin), ch, 'demo', this.inputValue, c.accent, c.input, 24, {}));

    // the console: everything below, scrolling
    var consoleTop = Math.max(top+this.menu.length*ch, rightTop+2*ch+4)+12;
    var consoleHeight = h-consoleTop-margin;
    if (consoleHeight >= 2*ch) {
      this.console = new ScrollViewEntity(d, margin, consoleTop, w-2*margin, consoleHeight, this.colors.input, {scrollX: false, scrollY: true, followBottom: true, scrollbarColor: c.bar, scrollbarTrackColor: c.minor});
      d.addEntity(this.console);
      this.consoleText = new TextEntity(this.console, mono, 0, 0, this.console.contentAreaWidth(), ch, '', c.text, false, {textWrap: true, align: 'left'});
      this.console.addEntity(this.consoleText);
      this.refreshConsole();
    } else {
      this.console = null;
      this.consoleText = null;
    }
  } // buildScreen

  /**
   * MenuEntity's data source.
   */
  getMenuData(self, key, row) {
    switch (key) {
      case 'numberOfItems': return self.menu.length;
      case 't2': return '';
      default: return self.menu[row][key];
    }
  } // getMenuData

  // ------------------------------------------------------------ the console

  /**
   * A line into the console; the last 200 are kept.
   * @param {string} line - The text.
   */
  println(line) {
    this.log.push(line);
    if (this.log.length > 200) {
      this.log.shift();
    }
    this.refreshConsole();
  } // println

  /**
   * Puts the log into the console's text and sizes the content to it.
   */
  refreshConsole() {
    if (this.console === null) {
      return;
    }
    var ch = 16;
    var cols = Math.max(1, Math.floor(this.console.contentAreaWidth()/8));
    var rows = 0;
    this.log.forEach((line) => { rows += Math.max(1, Math.ceil(line.length/cols)); });
    this.consoleText.height = Math.max(this.console.height, rows*ch);
    this.consoleText.setText(this.log.join('\n'));
    this.console.setContentSize(this.console.contentAreaWidth(), rows*ch);
  } // refreshConsole

  // ----------------------------------------------------------------- events

  handleEvent(event) {
    if (event.id == 'changeInputValue') {
      // remember it, so a resize does not lose what was typed
      var input = this.desktopEntity.entities.find((e) => e.id == 'InputEntity' || e.inputId == 'demo');
      if (input) {
        this.inputValue = input.value;
      }
    }
    if (super.handleEvent(event)) {
      return true;
    }
    switch (event.id) {
      case 'resizeModel':
        this.resizes++;
        this.buildScreen();
        this.println('resize #'+this.resizes+': element '+this.app.element.width+'x'+this.app.element.height+' -> ratio '+this.app.layout.ratio+', desktop '+this.desktopEntity.width+'x'+this.desktopEntity.height);
        return true;
      case 'gridStep':
        this.stepIndex = (this.stepIndex+1)%DemoModel.STEPS.length;
        this.grid.step = DemoModel.STEPS[this.stepIndex];
        this.grid.invalidate();
        this.println('grid step '+this.grid.step);
        return true;
      case 'targetDown':
      case 'targetUp':
        var targets = DemoModel.TARGETS;
        var at = targets.indexOf(this.app.platform.optSize);
        at = Math.max(0, Math.min(targets.length-1, at+(event.id == 'targetUp' ? 1 : -1)));
        if (targets[at] != this.app.platform.optSize) {
          this.app.platform.optSize = targets[at];
          this.println('target '+targets[at]);
          this.app.resizeRequested = true;
        }
        return true;
      case 'clearConsole':
        this.log = [];
        this.refreshConsole();
        return true;
      case 'changeInputValue':
        this.println('input: '+this.inputValue);
        return true;
      case 'keyPress':
        if (event.key == 'Escape') {
          this.sendEvent(0, {id: 'clearConsole'});
          return true;
        }
        break;
    }
    return false;
  } // handleEvent

  loopModel(timestamp) {
    super.loopModel(timestamp);
    this.drawModel();
  } // loopModel

} // DemoModel
