<?php
/**
 * The source files of a demo, for the shell's source viewer.
 *
 *   source.php?demo=<topic>&platform=<platform>               the tree, as JSON
 *   source.php?demo=<topic>&platform=<platform>&file=<path>   one file, as text
 *
 * Only what a demo is made of goes out: app/, images/ and the files in its
 * root. Never config/ and db/ (the server's settings), the build outputs,
 * dot files and the project's working notes — the same line nginx draws. A
 * symbolic link is never followed: app/svision is named as the link to the
 * library it is, any other link is left out. The files a tool of the library
 * made from the icon's drawing carry a note saying so.
 */

/** names that never leave the server, at any depth */
const HIDDEN = ['config', 'db', 'js', 'build', 'node_modules', 'CLAUDE.md', 'MILNIKY.md', 'ZADANI.md', 'CHAT.md'];
/** shown as a picture by the viewer, not read as text */
const IMAGES = ['png', 'jpg', 'jpeg', 'gif', 'ico', 'svg', 'webp'];
/** a text file larger than this is not sent */
const TEXT_LIMIT = 512*1024;

function fail($status, $message) {
  http_response_code($status);
  header('Content-Type: text/plain; charset=utf-8');
  echo $message;
  exit;
}

/** a name the viewer may show: plain characters, no dot file, not hidden */
function visible($name) {
  return preg_match('/^[A-Za-z0-9_][A-Za-z0-9_.\-]*$/', $name) === 1 && !in_array($name, HIDDEN, true);
}

function kindOf($name) {
  return in_array(strtolower(pathinfo($name, PATHINFO_EXTENSION)), IMAGES, true) ? 'image' : 'text';
}

/** what made the file, for those a tool of the library generates from images/app-icon.svg; null for a source */
function generatedNote($root, $inner) {
  if (preg_match('~^images/app-icon-\d+x\d+\.png$~', $inner)) {
    $tool = 'make-app-icons';
  } elseif ($inner === 'favicon.ico') {
    $tool = 'make-favicon';
  } else {
    return null;
  }
  $from = is_file($root.'/images/app-icon.svg') ? ' from images/app-icon.svg' : '';
  return 'Generated'.$from.' by svision/tools/'.$tool.' — not a source file.';
}

/** the entries of a directory: directories first, then files, by name */
function tree($dir, $relative, $root) {
  $directories = [];
  $files = [];
  foreach (scandir($dir) as $name) {
    if (!visible($name)) {
      continue;
    }
    $path = $dir.'/'.$name;
    $inner = $relative === '' ? $name : $relative.'/'.$name;
    if (is_link($path)) {
      if ($inner === 'app/svision') {
        $directories[] = ['name' => $name, 'type' => 'link', 'note' => 'symlink to the svision library'];
      }
    } elseif (is_dir($path)) {
      $directories[] = ['name' => $name, 'type' => 'dir', 'children' => tree($path, $inner, $root)];
    } elseif (is_file($path)) {
      $file = ['name' => $name, 'type' => 'file', 'path' => $inner, 'kind' => kindOf($name), 'size' => filesize($path)];
      $note = generatedNote($root, $inner);
      if ($note !== null) {
        $file['generated'] = $note;
      }
      $files[] = $file;
    }
  }
  return array_merge($directories, $files);
}

$topic = $_GET['demo'] ?? '';
$platform = $_GET['platform'] ?? '';
if (!preg_match('/^[a-z0-9]+$/', $topic) || !preg_match('/^[a-z0-9]+$/', $platform)) {
  fail(400, 'Bad demo.');
}
$root = __DIR__.'/demos/'.$topic.'/'.$platform;
if (!is_dir($root) || is_link($root)) {
  fail(404, 'No such demo.');
}

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

if (!isset($_GET['file'])) {
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['demo' => $topic, 'platform' => $platform, 'tree' => tree($root, '', $root)], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

// one file: every step of the path is a visible name and no step is a link
$path = $root;
foreach (explode('/', (string)$_GET['file']) as $name) {
  if (!visible($name)) {
    fail(404, 'No such file.');
  }
  $path .= '/'.$name;
  if (is_link($path)) {
    fail(404, 'No such file.');
  }
}
if (!is_file($path)) {
  fail(404, 'No such file.');
}
if (kindOf($path) === 'image') {
  fail(415, 'A picture: the viewer shows it from its own address.');
}
if (filesize($path) > TEXT_LIMIT) {
  fail(413, 'The file is too large to show.');
}
$text = file_get_contents($path);
if (strpos($text, "\0") !== false) {
  fail(415, 'A binary file.');
}
header('Content-Type: text/plain; charset=utf-8');
echo $text;
