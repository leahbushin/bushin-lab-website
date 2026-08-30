# Bushin Lab — website

Website for the [Bushin Lab](https://yeatmanlab.github.io/bushin-lab-website/), Department of
Chemistry, Stanford University. PI: **Leah B. Bushin**, Assistant Professor of Chemistry.

## Stack

Deliberately dependency-free: hand-written HTML, CSS, and vanilla JS. No build step, no
framework, no bundler. Deploys to GitHub Pages straight from `main`.

```
index.html              home: research, PI, press, publications, join
people.html             "Meet the Bushin Lab" roster
assets/css/style.css    design system (dark-first, light theme via [data-theme])
assets/js/main.js       lattice canvas, reveals, publication filters, theme toggle
assets/img/             portraits
.nojekyll               serve files as-is
```

## Design notes

- **Logo** is a plasmid map: a thin backbone ring carrying three engineered cassettes
  (amber, ember, cyan) around the hexagonal molecule they produce — synthetic biology on
  the outside, chemistry in the middle. Five shapes, so it holds together at 20 px.
- **Palette** is derived from xanthommatin, the ommochrome pigment the lab taught a microbe
  to make: amber (oxidized) → ember (reduced) → Stanford cardinal, with a cool cyan as
  the fourth accent.
- **Hero canvas** (`#lattice`) is a living biosynthetic network — nodes drift, transient bonds
  form within range, and reactive-intermediate walkers traverse the lattice leaving decaying
  crosslinks behind — biosynthesis, abstracted. It respects
  `prefers-reduced-motion` and pauses when the tab is hidden.
- **Accessibility**: skip link, visible focus rings, semantic landmarks, `aria-current`
  scrollspy, reduced-motion fallbacks, AA contrast in both themes.

## Local preview

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Editing content

Everything is in `index.html`. Publications live in `#pub-list` as `<li class="pub">` items;
the `data-topics` attribute drives the filter chips (`rsam ripp engineering discovery
microbiome first`). Add a topic to a paper and it appears under that chip automatically —
the counter updates itself.

## Sources

Content is drawn from the [Stanford Chemistry faculty
page](https://chemistry.stanford.edu/people/leah-b-bushin), the department's [welcome
announcement](https://chemistry.stanford.edu/news/stanford-welcomes-dr-leah-bushin-assistant-professor-chemistry),
the [Scripps press
release](https://scripps.ucsd.edu/news/scientists-produce-powerhouse-pigment-behind-octopus-camouflage)
for the 2025 *Nature Biotechnology* xanthommatin paper, and PubMed for the publication list.
Contact details and the group roster are placeholders pending confirmation from the lab.
