# vectordemo

Pískoviště vektorové platformy svision (R-031, `DESIGN-vector.md` v kořeni
`sw/`). Není to remake — nemá originál ani `match*`. Platí pravidla knihovny
a tvar projektu ze `STANDARDS.md`, ne metodika.

- `app/svision` je symlink na sdílený checkout; změny platformy se dělají
  tam (`svision/js/platform/vector/`), ne tady.
- Nespouštěj `svtool build`; ověření bez prohlížeče je
  `node ../svision/tools/checkvector.mjs`.
- První skutečný konzument platformy bude `battlezone` (vektorový monitor
  Atari, AVG).
