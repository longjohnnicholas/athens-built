# Vendored libraries

All files below were downloaded once (2026-07-14) and are served locally.
No CDN references exist in the site's HTML/JS at runtime.

| Library | Version | File(s) | Source URL |
|---|---|---|---|
| MapLibre GL JS | 5.24.0 | `maplibre-gl.js`, `maplibre-gl.css` | https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.js and `.css` (mirrors https://github.com/maplibre/maplibre-gl-js releases) |
| Scrollama | 3.2.0 | `scrollama.min.js` | https://cdn.jsdelivr.net/npm/scrollama@3.2.0/build/scrollama.min.js (mirrors https://github.com/russellgoldenberg/scrollama) |
| PMTiles (JS) | 4.4.1 | `pmtiles.js` | https://cdn.jsdelivr.net/npm/pmtiles@4.4.1/dist/pmtiles.js (mirrors https://github.com/protomaps/PMTiles) |

## Licenses

- MapLibre GL JS: 3-Clause BSD
- Scrollama: MIT
- PMTiles: BSD-3-Clause

## Notes

- `pmtiles.js` is the minified IIFE/browser bundle exposing a global `pmtiles` object; used to register the `pmtiles://` protocol with MapLibre. Not yet wired to any live tile source (Stage 2 placeholder only).
- Re-vendor by re-running the `curl` commands above with an updated version pin and updating this table. Do not switch to CDN references in `index.html` — the project serves all JS/CSS locally per PLAN.md §6.
