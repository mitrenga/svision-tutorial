# vectordemo — pískoviště vektorové platformy svision

Testovací obrázek pro `VectorPlatform` (`svision/js/platform/vector/`, R-031):
rám plochy, otáčející se drátěná krychle s jasem podle hloubky, rampa
intenzit 0–15, kružnice pro kontrolu poměru stran, text fontem prohlížeče
a text vektorovým fontem (`VectorTextEntity`, celá abeceda, číslice
a interpunkce — od BZ-M2 2026-09-15).

## Spuštění

Jako ostatní projekty: `index.php` přes `app/svision/php/main.php`,
`$devMode = true` servíruje zdroje z `app/` bez bundlu. Pro nasazení
`svtool build` (viz `svision/tools/svtool help`).

## Kontrola bez prohlížeče

```
node ../svision/tools/checkvector.mjs
```

prověří DOM-free část platformy (display list, markup, rozdíly).
