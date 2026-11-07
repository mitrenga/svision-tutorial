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

Topics: `helloworld` (all nine platforms), `demo` (the former zxdemo,
c64demo, atari8demo, vgademo, snesdemo, arcadedemo, vectordemo, webgl2demo and
adaptivedemo as its nine platforms).

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

On the development server the project has a host of its own, `nginx/tutorial.shipard.pro`
(`https://tutorial.shipard.pro:34444/`): the shared `willy2.shipard.pro` rewrites only
`/<project>/...`, and the demos sit one level deeper. The file documents the DNS record and
the install.

## Licence

CC BY-NC-SA 4.0 — see [LICENSE.md](LICENSE.md).
