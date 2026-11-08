# svision-tutorial — tutoriál a dema platforem svision v jednom projektu

Shell (`index.php`, `shell.css`, `shell.js`): vlevo **témata**, pod nimi
**přepínač platforem**, vpravo iframe; dema jsou samostatné aplikace svision
v `demos/<téma>/<platforma>/` (od 2026-11-07; téma `helloworld` má všech devět
platforem — ZX je kopie projektu `helloworld` z kořene, ostatních osm nové
podle stejné kostry (WebGL2: text z kvádrů v rovině sklopené o 45° dozadu a otočený o 45° kolem svislé osy); téma `demo` má devět platforem = kopie projektů
`zxdemo`, `c64demo`, `atari8demo`, `vgademo`, `snesdemo`, `arcadedemo`,
`vectordemo`, `webgl2demo`, `adaptivedemo` z kořene; **originály smazány 2026-11-07**, dema žijí jen tady). Zvolená platforma se drží napříč tématy
a pamatuje se v localStorage; tutoriál přidá téma jako adresář s variantami. Platí `../CLAUDE.md` (pravidla o knihovně a tvaru projektu, ne
metodika — dema nemají originál).

## Pravidla, která tu platí zvlášť

- **Nespouštěj build.** Každé demo má `config/config.php` s `$devMode = true`,
  prohlížeč načítá `app/` přímo. Shell se nebuilduje vůbec.
- **`demos/*/*/app/svision` je symlink** `../../../../../svision` (o dvě úrovně
  hlouběji než u projektů v kořeni). `app/main.js` identický (R-002).
- **Shell nezasahuje do knihovny**: demo běží v iframe jako celá stránka
  (svision je stavěná na jednu aplikaci na stránku — globály okna, `fixed`
  CSS, service worker, klávesnice na dokumentu). Vestavěný režim pro `<div>`
  je krok 2 (ROADMAP), až pro tutoriál.
- Nové demo = `demos/<téma>/<platforma>/` + téma (nebo platforma v jeho
  seznamu) v `$topics` v `index.php`, popis platformy do `blurbs`.
- Změna dema se dělá **tady**, ne v původním adresáři v kořeni (kopie se
  nesynchronizují).
