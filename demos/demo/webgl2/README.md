# webgl2demo — pískoviště 3D platformy svision

Testovací obrázek pro `WebGL2Platform` (`svision/js/platform/webGL2/`,
R-032) nad scénou bez DOM (`svision/js/platform/scene3D/`): osvětlená
krychle s barvou na stěnu, koule a válec (všechny generátory `Mesh`) nad
rovinou s mřížkou, ve `SceneEntity` přes celý desktop, a nad tím
na 2D overlayi kružnice pro kontrolu poměru stran, HUD `TextEntity`
(FPS, `ratio`, `pixelRatio`, jestli je GL) a v rohu tatáž scéna jako drát
přes `Scene3D.project()` (most do rastru a vektoru).

Klávesy: `W` drát / plný, `C` perspektiva / ortografická kamera, `L` světlo;
klik nebo dotyk přepíná drát. Bez WebGL2 se scéna kreslí drátem na overlay.
Platforma jede s `fit: 'cover'`: 640×360 určí jen měřítko HUD, desktop
pak doroste přes celé okno a model si entity rozmístí znovu na každý resize.

## Spuštění

Jako ostatní projekty: `index.php` přes `app/svision/php/main.php`,
`$devMode = true` servíruje zdroje z `app/` bez bundlu. Pro nasazení
`svtool build` (viz `svision/tools/svtool help`).

## Kontrola bez prohlížeče

```
node ../svision/tools/checkscene.mjs
```

prověří DOM-free část platformy (matice, generátory sítí, markup scény,
projekci, headless layout). Otisk snímku je `markup()`, nikdy pixely z GPU.

## Kde je kód, který demo předvádí

Všechno je ve **svision**, demo jen skládá:

| třída | soubor v `app/svision/js/` |
|---|---|
| `Vec3`, `Mat4` (bez DOM) | `platform/scene3D/vec3.js`, `mat4.js` |
| `Mesh` (bez DOM) | `platform/scene3D/mesh.js` |
| `Scene3D` (bez DOM) | `platform/scene3D/scene3D.js` |
| `SceneEntity` | `platform/scene3D/sceneEntity.js` |
| `Scene3DHeadlessLayout` (bez DOM) | `platform/scene3D/scene3DHeadlessLayout.js` |
| `WebGL2Platform`, `WebGL2Layout`, `GLPrograms` | `platform/webGL2/` |
| `headlessSceneApp` | `tools/headlessApp.mjs` |

Návrh a zdůvodnění: `../DESIGN-3d.md`. Rozhodnutí: `../DECISIONS.md` R-032.
