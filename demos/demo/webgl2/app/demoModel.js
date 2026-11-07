const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { SceneEntity } = await import('./svision/js/platform/scene3D/sceneEntity.js?ver='+window.srcVersion);
const { Mesh } = await import('./svision/js/platform/scene3D/mesh.js?ver='+window.srcVersion);
const { VectorEntity } = await import('./svision/js/platform/vector/vectorEntity.js?ver='+window.srcVersion);
const { TextEntity } = await import('./svision/js/platform/canvas2D/textEntity.js?ver='+window.srcVersion);
// begin code

/**
 * The test picture of the 3D platform: a lit cube turning over a ground
 * plane with a grid, a sphere and a cylinder beside it (every generator of
 * Mesh), in a SceneEntity over the whole desktop, and over it on the 2D
 * overlay: a circle to check the aspect (round on a correct fit), the HUD text
 * (FPS, ratio, pixel ratio, whether GL is there) and, in the corner, the
 * same scene projected into a wireframe through Scene3D.project() — the
 * bridge, drawn by the canvas 2D half of the layout.
 *
 * Keys: W wireframe / solid, C perspective / orthographic camera, L light
 * on / off; a click or a tap toggles the wireframe.
 */
export class DemoModel extends AbstractModel {

  constructor(app) {
    super(app);
    this.id = 'DemoModel';
    this.view = null;
    this.wire = null;
    this.hud = null;
    this.overlay = null;
    this.angle = 0;
    this.lastTimestamp = 0;
    this.frames = 0;
    this.fpsAt = 0;
    this.fps = 0;
    this.wireframe = false;
    this.orthographic = false;
    this.lit = true;
    this.cube = Mesh.box(2, 2, 2, {id: 'cube', faceColors: [[0.9, 0.3, 0.3], [0.3, 0.9, 0.3], [0.3, 0.3, 0.9], [0.9, 0.9, 0.3], [0.9, 0.3, 0.9], [0.3, 0.9, 0.9]]});
    this.ground = Mesh.plane(12, 12, {id: 'ground', color: [0.32, 0.36, 0.42]});
    this.ball = Mesh.sphere(0.8, {id: 'ball', segments: 24, rings: 12});
    this.pillar = Mesh.cylinder(0.5, 2, {id: 'pillar', segments: 20});
  } // constructor

  init() {
    super.init();
    this.desktopEntity.bkColor = false;   // the 3D picture shows through the overlay

    // the viewport into the world: the whole desktop
    this.view = new SceneEntity(this.desktopEntity, 0, 0, 1, 1, '#ffffff', false);
    this.view.scene.setBackground('#0c1830');
    this.view.scene.setCamera({position: [0, 3, 7], target: [0, 0.3, 0], fov: 50, near: 0.1, far: 100});
    this.desktopEntity.addEntity(this.view);

    // the 2D overlay: the aspect circle
    this.overlay = new VectorEntity(this.desktopEntity, 0, 0, 1, 1, '#ffff40', false);
    this.desktopEntity.addEntity(this.overlay);

    // the bridge: the same scene as a wireframe in the corner
    this.wire = new VectorEntity(this.desktopEntity, 0, 0, 160, 90, '#40ff40', false);
    this.desktopEntity.addEntity(this.wire);

    // the HUD: canvas2D text over the 3D picture
    this.hud = new TextEntity(this.desktopEntity, this.app.fonts.fonts5x5, 0, 0, 1, 24, '', '#ffffff', false, {scale: 2});
    this.desktopEntity.addEntity(this.hud);
    this.help = new TextEntity(this.desktopEntity, this.app.fonts.fonts5x5, 0, 0, 1, 10, 'W WIREFRAME   C CAMERA   L LIGHT   SVISION 3D PLATFORM (R-032)', '#c0c0c0', false, {scale: 2});
    this.desktopEntity.addEntity(this.help);

    this.layoutEntities();
    this.buildScene();
  } // init

  /**
   * Places the entities by the desktop size — on init and on every resize,
   * because with `fit: 'cover'` the desktop grows to the window.
   */
  layoutEntities() {
    var w = this.desktopWidth;
    var h = this.desktopHeight;
    var inset = 8;   // margin of the HUD only; the viewport is the whole desktop

    this.view.x = 0;
    this.view.y = 0;
    this.view.width = w;
    this.view.height = h;

    this.overlay.width = w;
    this.overlay.height = h;
    var l = this.overlay.list;
    l.clear();
    l.circle(w/2, h/2, 60, {intensity: 6});
    l.line(w/2-8, h/2, w/2+8, h/2, {intensity: 10});
    l.line(w/2, h/2-8, w/2, h/2+8, {intensity: 10});

    this.wire.x = w-inset-164;
    this.wire.y = inset+4;

    this.hud.x = inset+6;
    this.hud.y = inset+6;
    this.hud.width = w-2*inset-12;
    this.hud.invalidate();
    this.help.x = inset+6;
    this.help.y = h-inset-16;
    this.help.width = w-2*inset-12;
    this.help.invalidate();
  } // layoutEntities

  /**
   * Rebuilds the scene's items from the state: the ground with its grid,
   * the cube turning, the sphere and the cylinder.
   */
  buildScene() {
    var s = this.view.scene;
    s.clear();
    var style = {wireframe: this.wireframe, shading: this.lit ? 'flat' : 'none'};
    s.mesh(this.ground, Object.assign({transform: {position: [0, -1, 0]}, color: '#6080a0'}, style));
    for (var i = -6; i <= 6; i += 2) {
      s.line(i, -0.99, -6, i, -0.99, 6, {color: '#8090b0', intensity: 6});
      s.line(-6, -0.99, i, 6, -0.99, i, {color: '#8090b0', intensity: 6});
    }
    s.mesh(this.cube, Object.assign({transform: {position: [0, 0.2, 0], rotation: [0, this.angle, 0]}, color: '#ffffff'}, style));
    s.mesh(this.ball, Object.assign({transform: {position: [-3, -0.2, 0], rotation: [0, -this.angle, 0]}, fill: '#e0a040', color: '#ffc060'}, style));
    s.mesh(this.pillar, Object.assign({transform: {position: [3, 0, 0], rotation: [0, this.angle*0.5, 0]}, fill: '#40c0a0', color: '#60ffd0'}, style));
    // the axes at the origin: x red, y green, z blue
    s.line(0, -0.98, 0, 2, -0.98, 0, {color: '#ff4040'});
    s.line(0, -0.98, 0, 0, 1.02, 0, {color: '#40ff40'});
    s.line(0, -0.98, 0, 0, -0.98, 2, {color: '#4080ff'});
  } // buildScene

  /**
   * The HUD line.
   */
  refreshHUD() {
    var layout = this.app.layout;
    var gl = this.app.stack.gl ? 'WEBGL2' : 'NO GL - WIREFRAME BRIDGE';
    this.hud.setText('FPS '+this.fps+'   RATIO '+(Math.round(layout.ratio*100)/100)+'   PIXELRATIO '+(Math.round((layout.pixelRatio || 1)*100)/100)
      +'   DESKTOP '+this.desktopWidth+'x'+this.desktopHeight
      +'\n'+gl+'   '+(this.wireframe ? 'WIREFRAME' : 'SOLID')+'   '+(this.orthographic ? 'ORTHOGRAPHIC' : 'PERSPECTIVE')+'   LIGHT '+(this.lit ? 'ON' : 'OFF'));
  } // refreshHUD

  handleEvent(event) {
    if (super.handleEvent(event)) {
      return true;
    }
    switch (event.id) {
      case 'resizeModel':
        this.layoutEntities();
        this.refreshHUD();
        return true;
      case 'keyPress':
        var key = event.key.length == 1 ? event.key.toUpperCase() : event.key;
        switch (key) {
          case 'W':
          case 'Mouse1':
          case 'Touch':
            this.wireframe = !this.wireframe;
            return true;
          case 'C':
            this.orthographic = !this.orthographic;
            this.view.scene.setCamera(this.orthographic
              ? {type: 'orthographic', height: 8}
              : {type: 'perspective', fov: 50});
            return true;
          case 'L':
            this.lit = !this.lit;
            return true;
        }
        return false;
    }
    return false;
  } // handleEvent

  loopModel(timestamp) {
    super.loopModel(timestamp);
    if (this.lastTimestamp) {
      this.angle = (this.angle+(timestamp-this.lastTimestamp)/1000*40)%360;
    }
    this.lastTimestamp = timestamp;
    this.frames++;
    if (timestamp-this.fpsAt >= 1000) {
      this.fps = Math.round(this.frames*1000/(timestamp-this.fpsAt));
      this.frames = 0;
      this.fpsAt = timestamp;
      this.refreshHUD();
    }
    this.buildScene();
    // the bridge: the same scene, projected
    var l = this.wire.list;
    l.clear();
    l.append(this.view.scene.project(160, 90));
    l.rect(0, 0, 160, 90, {intensity: 8});
    this.drawModel();
  } // loopModel

} // DemoModel
