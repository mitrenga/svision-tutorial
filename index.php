<?php
/**
 * The shell of the svision tutorial: the topics down the left, the platforms
 * as a row of buttons under them, the chosen demo running in an iframe on
 * the right. A demo is a complete svision application of its own in
 * demos/<topic>/<platform>/ (index.php, app/, config/), so the shell only
 * frames it. A topic has a variant for some platforms only; the platform
 * chosen stays when the topic changes (and is remembered in the browser),
 * falling back to the topic's first platform. On a narrow screen the list
 * hides behind the menu button. ?demo=<topic>&platform=<platform> picks a
 * demo so a link can be shared; clicking changes the iframe and the
 * address without reloading the page.
 */

$platforms = [
  'zx'       => 'ZX Spectrum',
  'c64'      => 'Commodore 64',
  'atari8'   => 'Atari 8-bit',
  'vga'      => 'VGA',
  'terminal' => 'Terminal',
  'snes'     => 'Super Nintendo',
  'arcade'   => 'Arcade',
  'vector'   => 'Vector',
  'webgl2'   => '3D (WebGL2)',
  'adaptive' => 'Adaptive',
];

$topics = [
  ['id' => 'helloworld', 'title' => 'Hello world',
   'blurb' => 'The smallest possible svision application: one platform, one model, one text entity in the machine\'s font. The skeleton every project starts from.',
   'platforms' => ['zx', 'c64', 'atari8', 'vga', 'terminal', 'snes', 'arcade', 'vector', 'webgl2', 'adaptive']],
  ['id' => 'demo', 'title' => 'Demo',
   'blurb' => 'The whole layer of one platform on a single screen — not a game, a place to see what the platform can do.',
   'blurbs' => [
     'zx'       => 'The ZX Spectrum layer on one screen: attributes and colour clash, the border, the beeper, sprites over the video RAM — the common ground of the Spectrum remakes.',
     'c64'      => 'The Commodore 64 layer: the text screen with screen codes and Color RAM, the Char ROM, the border, hardware sprites and the SID.',
     'atari8'   => 'The Atari 400/800/XL/XE layer: the ANTIC display list over 64 KB, GTIA colours of a PAL 800XL, player/missile graphics.',
     'vga'      => 'The VGA layer of the DOS remakes: mode 13h video RAM, the 256-colour palette, the 4:3 picture, samples.',
     'terminal' => 'The terminal platform on the 15IE-00-013 of Tetris 1984, a VT52 on a serial line at 9600 baud — the host sends bytes, the firmware draws them; KOI-7 Latin and Cyrillic, cursor addressing, tabs, the bell, the status line and the keyboard with the host\'s echo.',
     'snes'     => 'The Super Nintendo layer: the PPU in mode 1 over VRAM, CGRAM and OAM, sprites with the per-line limits, brightness inside the frame.',
     'arcade'   => 'The raster arcade layer: scaling, the bezel, the colour overlay and the display styles of the cabinet.',
     'vector'   => 'The vector (SVG) platform: a display list of lines with beam intensity, the test picture, the vector fonts — the ground of Asteroids and Battlezone.',
     'webgl2'   => 'The 3D platform: a scene without DOM rendered by WebGL2 — lit cube, sphere and cylinder over a grid, with a 2D overlay.',
     'adaptive' => 'The platform of the library\'s own games: the logical desktop follows the window instead of a fixed machine screen.',
   ],
   'platforms' => ['zx', 'c64', 'atari8', 'vga', 'terminal', 'snes', 'arcade', 'vector', 'webgl2', 'adaptive']],
];

$topicIds = array_column($topics, 'id');
$topicId = isset($_GET['demo']) && in_array($_GET['demo'], $topicIds, true) ? $_GET['demo'] : $topicIds[0];
$topic = $topics[array_search($topicId, $topicIds, true)];
$platformId = isset($_GET['platform']) && in_array($_GET['platform'], $topic['platforms'], true) ? $_GET['platform'] : $topic['platforms'][0];
$shellJSON = json_encode(['platforms' => $platforms, 'topics' => $topics, 'topic' => $topicId, 'platform' => $platformId], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>svision tutorial</title>
  <meta name="description" content="Demos of the svision library, each on the platforms it supports: ZX Spectrum, Commodore 64, Atari 8-bit, VGA, a serial terminal, Super Nintendo, arcade, vector, 3D and adaptive.">
  <link rel="icon" href="favicon.ico">
  <link rel="stylesheet" href="shell.css">
</head>
<body>
  <header class="top">
    <button class="menu-button" id="menuButton" type="button" aria-label="Menu" aria-controls="sidebar" aria-expanded="false">
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <a class="brand" href="./">svision tutorial</a>
    <span class="current" id="currentTitle"></span>
  </header>

  <nav class="sidebar" id="sidebar" aria-label="Demos">
    <ul class="demo-list" id="demoList">
<?php foreach ($topics as $t): ?>
      <li><a href="?demo=<?= $t['id'] ?>" data-topic="<?= $t['id'] ?>"<?= $t['id'] === $topicId ? ' class="active" aria-current="page"' : '' ?>>
        <span class="title"><?= htmlspecialchars($t['title']) ?></span>
        <span class="platform"><?= count($t['platforms']) ?> platform<?= count($t['platforms']) == 1 ? '' : 's' ?></span>
      </a></li>
<?php endforeach; ?>
    </ul>
    <div class="platforms" id="platformBar" role="group" aria-label="Platform">
<?php foreach ($platforms as $id => $label): ?>
      <button type="button" data-platform="<?= $id ?>"<?= $id === $platformId ? ' class="active" aria-pressed="true"' : ' aria-pressed="false"' ?>><?= htmlspecialchars($label) ?></button>
<?php endforeach; ?>
    </div>
  </nav>
  <div class="backdrop" id="backdrop"></div>

  <main class="content">
    <div class="info" id="info">
      <p class="blurb" id="blurb"></p>
      <a class="open" id="openLink" href="#" target="_blank" rel="noopener">Open on its own ↗</a>
    </div>
    <div class="frame">
      <iframe id="demoFrame" title="Demo" allow="gamepad; fullscreen" src="demos/<?= $topicId ?>/<?= $platformId ?>/"></iframe>
    </div>
  </main>

  <script>window.shell = <?= $shellJSON ?>;</script>
  <script src="shell.js"></script>
</body>
</html>
