# adaptivedemo

Minimal demo of the adaptive platform of the **svision** library — the
platform of the library's own games (genesis, endlessuniverse) rather than of
a remake. It is a sandbox where the one thing that makes the platform
different can be watched: the logical desktop follows the window.

What it shows:

1. **The layout** (`AdaptiveLayout`) — the element's width divided by a
   whole-number ratio lands near the target (512 by default); the height comes
   from the same ratio. The heading prints target, ratio, desktop and element.
2. **A grid** (`GridEntity`) of logical pixels: on a resize the cells stay the
   same size and the desktop gets more or fewer of them.
3. **Laying out again** — the model rebuilds the screen on every `resizeModel`
   event, which is what an adaptive game has to do and a fixed-raster game
   never does.
4. **The UI set** — a paragraph that wraps to the width (`TextEntity`), a
   menu (`MenuEntity`), buttons (`ButtonEntity`), a text input (`InputEntity`)
   and a scrolling console (`ScrollViewEntity`) that logs every resize and
   every event.
5. `-` and `+` change the target (256 … 1024), so the ratio changes without
   the window moving; `G` cycles the grid step; `Escape` clears the console.

## Running

```
php -S localhost:8080        # in the adaptivedemo root
```

`config/config.php` has `$devMode = true`, so the sources in `app/` are loaded
directly; no bundle is needed. Resize the window, or turn a phone, to see the
layout at work.

## What is where

| file | what it does |
|---|---|
| `app/appPlatform.js` | `new AdaptivePlatform(512, background)` |
| `app/mainApp.js` | the fonts, the one model |
| `app/demoModel.js` | `buildScreen()` on every resize, the menu, the console, the keys |
| `app/gridEntity.js` | the grid of logical pixels |
| `app/main.js` | identical in every project (R-002) — do not edit locally |
