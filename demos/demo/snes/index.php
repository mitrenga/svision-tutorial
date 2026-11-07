<?php
  $appName = 'Super Nintendo demo';
  $appDescription = 'Demo of the Super Nintendo platform of svision: the PPU over VRAM, CGRAM and OAM in mode 1, three scrolling backgrounds, sprites with the limits of the chip per line, the master brightness inside the frame.';
  $appPrefix = 'snesdemo';
  $devMode = true;
  if (file_exists(__DIR__.'/config/config.php')) {
    require_once __DIR__.'/config/config.php';
  }
  require_once 'app/svision/php/main.php';
