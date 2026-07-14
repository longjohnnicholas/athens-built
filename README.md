# Athens built

A data-driven scrollytelling explainer on how postwar Athens took its present
form — the polykatoikia apartment block, the antiparochi financing mechanism,
and the demographic and legal forces that produced a city where 46.8% of
Greece's surviving building stock (and more in Attica) dates from 1946–1980.
Static site: vanilla JS, MapLibre GL JS, Scrollama, and PMTiles, hosted on
GitHub Pages. See `PLAN.md` (kept outside this repo, in the planning
workspace) for the full narrative and technical spec.

## Structure

- `index.html` — page shell: sticky map + ten scrolling narrative steps
- `css/site.css` — layout only (no design system yet)
- `js/main.js` — MapLibre + Scrollama wiring, chapter-state stub
- `vendor/` — pinned, locally-served builds of MapLibre GL JS, Scrollama, and
  PMTiles; see `vendor/VERSIONS.md` for exact versions and sources
- `content/` — narrative text (arrives in a later stage)
- `data/` — processed map data (GeoJSON/TopoJSON/PMTiles; empty scaffold)
- `pipeline/` — one-off Python scripts that produce `data/` from source
  datasets; see `pipeline/README.md`
- `assets/` — images and diagrams (empty scaffold)

This repo is at the Stage 2 scaffold: a working scroll skeleton with
placeholder map states, no real data layers, and no design work.

## Attribution

Data and imagery used by this project carry their own licenses, listed here
as each layer is added. Known credits so far:

- © OpenStreetMap contributors, [ODbL](https://opendatacommons.org/licenses/odbl/) — building footprints (share-alike on the derived database)
- [Protomaps](https://protomaps.com/) basemap, including the ESA WorldCover landcover credit, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Copernicus/JRC [GHSL](https://ghsl.jrc.ec.europa.eu/) (Global Human Settlement Layer) and [Urban Atlas](https://land.copernicus.eu/local/urban-atlas) — free and open, attribution required
- [ELSTAT](https://www.statistics.gr/) (Hellenic Statistical Authority) published tables — attribution required, no distortion of the data
- [geodata.gov.gr](https://geodata.gov.gr/), [CC BY 3.0 GR](https://creativecommons.org/licenses/by/3.0/gr/)

Per-image credits will be added alongside the imagery in a later stage. See
`LICENSE` (code) and `LICENSE-CONTENT.md` (narrative text and original
diagrams) for how this repo's own output is licensed.
