# svision-tutorial

*svision tutorial and demos — one example, more platforms.*

The tutorial and the demos of the **svision** library in one place: a page with the topics down
the left, a row of platform buttons under them, and the chosen demo running on
the right. A demo is a complete svision application of its own in
`demos/<topic>/<platform>/` (`index.php`, `app/`, `config/`, `app/svision` a
symlink to the shared checkout), exactly as the former separate projects were;
the shell (`index.php`, `shell.css`, `shell.js`) only frames it in an iframe.
A topic has a variant for some platforms; the platform chosen stays when the
topic changes and is remembered in the browser. On a narrow screen the list
hides behind the menu button. `?demo=<topic>&platform=<platform>` picks a demo
so a link can be shared.

Topics: `helloworld` (all ten platforms), `demo` (the former zxdemo,
c64demo, atari8demo, vgademo, snesdemo, arcadedemo, vectordemo, webgl2demo and
adaptivedemo, plus a terminal demo written here, as its ten platforms).

## Running

Serve the directory over PHP (as every project here, the demos need
`app/svision/php/main.php`); each demo has `config/config.php` with
`$devMode = true`, so its sources are served as they are and nothing is
built. To run a demo on its own open `demos/<topic>/<platform>/`.

## Adding a demo

Put the application in `demos/<topic>/<platform>/` with
`app/svision -> ../../../../../svision` and add the topic (or the platform to
the topic's list) in `$topics` in `index.php`; a platform-specific blurb goes
to `blurbs`.

## Server

The project needs a host of its own: the demos sit two levels deep
(`/demos/<topic>/<platform>/`) and each is an application with its own rewrite to
`index.php`. Two nginx configurations are in `nginx/`:

- `tutorial.sampledev.com` — a sample for a development server; the header lists what to
  replace (host name, checkout path, certificate, PHP-FPM socket) and how to install it.
- `tutorial.svision.place` — the production server, `https://tutorial.svision.place/`.

## Licence

CC BY-NC-SA 4.0 — see [LICENSE.md](LICENSE.md).
