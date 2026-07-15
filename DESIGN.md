# Design specification — How postwar Athens was built

*Stage 2 design system and art direction, 2026-07-14, revised after adversarial review (Codex, xhigh; dispositions in §11). This document is the contract for the Stage 3 build. The implemented draft (css/site.css, index.html, js/main.js) realizes the page chrome and placeholder map states; the layer, camera, and interaction tables below bind the build.*

## 1. Identity concept

The page enacts the site's thesis. Display typography wears the neoclassical city that was demolished: GFS Didot, the Greek Font Society's revival of the Didot tradition that dominated 19th-century Greek printing. Body and interface text wear the concrete city that replaced it: Commissioner, a grotesque by the Greek type designer Kostas Bartsokas, with full Greek coverage. The two faces meet on every chapter card the way the two cities meet on every block.

Color follows one discipline. The chrome is achromatic plaster and concrete. The Attic-clay family is the page's only strong hue: at full strength it encodes census data (the choropleth, the chapter-3 highlight layer, the future histogram), and it echoes in hairline UI accents (links, eyebrow dashes) that never encode data and never exceed 2px of area. The satellite record is deliberately colorless, and green is reserved for actual green space, so the three datasets cannot be confused with one another.

One theme, light, committed deliberately: the subject is a city defined by hard Mediterranean light, all map layers are tuned against a light ground, and the historic map scans read correctly only on it. `color-scheme: light` is declared; this is a decision, not an omission.

## 2. Tokens

### Neutrals and text

| Token | Value | Use | Contrast (validated) |
|---|---|---|---|
| `--paper` | `#F5F4F0` | page ground | — |
| `--card` | `#FDFCFA` | narrative cards, chips | vs paper 1.07:1 → 1px border required, present |
| `--ink` | `#26241F` | headings, body | 14.1:1 on paper, 15.1:1 on card |
| `--ink-2` | `#57534A` | secondary text, tagline, on-map notes | 7.5:1 on card, ≥6.3:1 on all map tints |
| `--ink-3` | `#6E695F` | captions, sources, chips on `--card` only | 5.3:1 on card (fails 4.5:1 on map tints — never used over the map) |
| `--line` | `#DCD9D2` | hairlines, card borders | — |
| `--accent` | `#77391A` | links, eyebrow dashes | 8.0:1 on paper |
| `--accent-2` | `#9C552B` | link hover, chapter-3 highlight layer | 4.5:1 on map ground |

### Attic-clay sequential ramp — census epoch choropleth

`#F2E4D5 → #E4C4A0 → #D4A171 → #BD7B49 → #9C552B → #77391A`

Validator (dataviz skill, `validate_palette.js`, light surface): relative luminance strictly monotone (0.792 → 0.069); worst adjacent-pair CVD separation ΔE 13.2 (deutan) — pass. The categorical-mode band/chroma checks do not apply to a sequential ramp. The three lightest fills sit below 3:1 against the map ground, so relief is structural: boundary strokes per the table below, an on-screen legend with labeled breaks whenever the layer is on, and the per-epoch data table as the textual equivalent. Adjacent light-fill polygons of near-equal value may read as continuous; that is acceptable (equal values are visually continuous), and identity is recovered by hover/tooltip and the table.

**Denominator.** Shares are of buildings standing at the **2021** census (ELSTAT Table 6). This supersedes PLAN §3's "standing in 2011", written before Stage 1 confirmed Table 6; the legend sentence is "share of buildings standing in 2021". The census "period not stated" category is a first-class bin: it appears in the epoch dropdown as "Period not stated", is included in every denominator, is quoted in every tooltip and the data table, and its regional share appears as a legend footnote.

**Scale.** Fixed cross-epoch breaks, left-closed: [0–5), [5–15), [15–25), [25–35), [35–50), [50–100]%. Recalibration criterion: after the full-region join in Stage 3, if the top bin captures more than 25% or fewer than 2% of municipality×epoch observations, shift once to quantile-rounded breaks; then freeze across all epochs. Breaks are printed in the legend; no autoscaling, ever.

### Satellite (GHSL) achromatic ramp — built-up land

`#DDDAD4 → #BBB7AF → #98948B → #736F66 → #4A463F`, five **cumulative** stops: built-up by 1975 / 1990 / 2000 / 2010 / 2020 (lighter = earlier). Semantics are cumulative and the legend says so ("land built up by 1990"); cells never built-up render as ground (absence is not data). Worst adjacent CVD ΔE 12.6 — pass. Colorlessness is the identity: the satellite record must read as a different instrument from the census.

### Green space — Urban Atlas

Fill `#7A9367` at 60% over map ground, boundary `#4F7A3D` at 0.5px. Class filter: Urban Atlas 2018 code **14100 (Green urban areas)** only — forests (31000), semi-natural areas, and sports facilities (14200) are excluded, and the on-screen caption names the class, the 2018 date, and the 0.25 ha minimum mapping unit. Deliberately desaturated: the layer-trio CVD check (clay mid, gray mid, green) passes at worst ΔE 12.3 (protan) only at this chroma.

**Layer exclusivity (binding).** Census, satellite, and green layers are mutually exclusive — radio selection, never stacked — each with its own text-labeled legend. Layer identity is never carried by color alone.

### Map ground and structural layers

| Token | Value | Use |
|---|---|---|
| `--map-ground` | `#E9E7E2` | land |
| `--map-water` | `#C7D2D5` | sea |
| `--map-footprint` | `#6E6862`, **opaque** | building footprints; alpha compositing over data fills would tint footprints with epoch color, violating the honesty rule, so opacity is 1.0 — soften by lightening the color, never by alpha |
| `--map-boundary` | over data fills: `#FFFFFF` 0.9px at 0.9 alpha; over plain ground: `#8F8A83` 0.75px | municipal boundaries; white reads on the four darkest ramp steps where gray vanishes |
| `--map-road` | `#F7F6F2` | roads as light lines above data fills |
| no-data hatch | `#6E695F` 1px lines, 4px pitch, 45° on `--map-ground` | 4.4:1 line-on-ground; suppressed/no-data areas only, named in the legend |

**Layer order (bottom → top):** ground · water · active data layer (one of census / GHSL / green) · municipal boundaries · roads · footprints · place labels · chapter highlight layer · UI (legend, controls, chip).

**Zoom ranges:** data layers z8.5–15; footprints minzoom 11 (below z11 the census fill alone carries the view — footprint texture is illegible at basin scale and its absence is stated in the sources page); place labels z10+ sparse (municipality names only), z12.5+ neighborhood names.

**Roads and labels:** primary roads 1px at z10 → 1.75px at z14, secondary from z12 at 0.75px, no casings at any zoom (casings add contrast the data layers need for themselves); no POI icons, no commercial labels, no hillshade. Place labels Commissioner Regular 11–13px, `--ink-2`, 1px `--map-ground` halo; Greek native names at z12.5+, transliterated at basin zoom.

**Glyphs (build prerequisite):** MapLibre symbol layers need PBF glyphs, not the page's woff2. Stage 3 pipeline step: generate `glyphs/{fontstack}/{range}.pbf` from Commissioner Regular and Commissioner SemiBold TTFs (font-maker/genfontgl), including Greek ranges U+0370–03FF and U+1F00–1FFF; style `glyphs:` URL points at the self-hosted directory; fontstack names exactly "Commissioner Regular" and "Commissioner SemiBold". Budget ≈2–3 MB, lazy-loaded per range.

**Kaupert raster (chapter 2, license pending):** multiply-blend at 0.9 opacity onto `--map-ground`, clipped to its sheet extent with a 0.75px `--map-boundary` edge. If the license fails, the fallback is the historic ground tint plus the 1875 built-up extent as an `--ink` 1px outline traced from PD sources — never a substitute raster.

**Chapter highlight strokes:** refugee quarters (ch 3): `--accent-2` 2px outline, `--accent-2` 12% fill, Commissioner SemiBold 11px labels. Plaka (ch 6): `--ink` 1.5px solid outline, no fill, one label.

### Addendum — building-height layer (2026-07-14)

The building-height carpet uses the validated sequential slate ramp `#DEE3E7 → #B8C2CA → #8FA0AC → #64798A → #3C4F60` at breaks 0–3 / 3–9 / 9–15 / 15–21 / 21+ m. It is served as a transparent, georeferenced PNG image overlay rather than vector cells; zero and no-data cells are transparent. The source is the Urban Atlas 2012 DHM at 10 m resolution, so the 2012 reference date and its caveat remain visible whenever the layer is on.

### Addendum — historic extent owner adjudication (2026-07-15)

Chapter 2 binds the traced 1894 built-up extent from the Baedeker Athens and Piraeus plans, both labelled “Nach Kaupert,” over the historic ground tint. The extent uses `#B9B4AA` at 0.5 fill opacity with a 1px `#57534A` outline. Its legend is “Built-up area · traced from the 1894 Baedeker plan (after Kaupert's survey) · georeferencing ≈25–45 m.” The owner accepted this layer after 99.26% of its area fell within the GHSL-1975 band buffered by 100 m.

The 1908 candidate is held, not rejected, at 98.57% pending the owner's Gate C decision. It must not be shipped or clipped in the interim: chapter 3 remains unchanged, and chapter 8's first GHSL state states that no comparable observation exists between 1894 and 1975.

### Addendum — map-side fact panels (2026-07-15)

Chapters 2–9 bind a single flat fact panel to chapter state in the upper part of the free map field. The component uses `--card`, a 1px `--line` border, no radius or shadow, a large GFS Didot figure, Commissioner caption text, and—where comparison is the point—an inline-SVG micro bar chart. Charts use flat `--ink-2` bars, `--line` reference rules, a single `--ink-2` baseline, direct value labels, and no axes; Athens (or Greece in the social-rental comparison) alone uses `--accent-2`. The panel shares the map overlay's 400ms opacity discipline and becomes instant under reduced motion. Its desktop bounds begin 1.5rem to the right of the card rail, remain in the upper field, and do not enter the bottom legend/chip zones or the top-right control zone.

The same panel is one real DOM node inside its chapter card, immediately below the folio. Above 700px it is fixed into the map field and only the active chapter's panel is visible; at 700px and below it returns to static flow, remains visible in every applicable card, and uses edge-only borders against `--paper`. Chapters 1 and 10 have no panel. This single-node binding prevents desktop/mobile copy drift and ensures a chapter's in-card data lockup is never duplicated by the panel.

### Addendum — aggregated 3D height view (2026-07-15)

The extrusion is an aggregate surface, never a building model. It is derived from the Urban Atlas 2012 10 m DHM by taking the mean of positive source samples in each web cell and omitting cells with no positive observation. The requested 100 m grid produced a 3.81 MB compact GeoJSON, above the 2.5 MB gate, so the binding fallback is 150 m: 17,638 occupied cells, heights rounded to 0.1 m, coordinates rounded to five decimal degrees, 1.84 MB. To remove repeated GeoJSON syntax without altering cell geometry, equal-height cell rings are grouped as MultiPolygon features carrying the shared `h` property. The mandated path remains `data/heights_grid_100m.geojson`; its metadata records both the requested 100 m size and the shipped 150 m size, and every user-facing disclosure says 150 m.

`height-extrusion` uses the same slate bands and breaks as the flat carpet, with extrusion height `h × 6`, flat band color on the whole prism, pitch 58°, and bearing −17°. Chapter 9 has two symmetric progress states: the 1946–80 census view first, then the extrusion. Its 3D legend begins, verbatim, “A plateau, not a skyline: the same five-to-seven-storey carpet across the basin.” and follows with “Urban Atlas 2012 · 150 m cells · ×6 vertical exaggeration.” Explore retains `Heights` for the 10 m flat raster and adds `Heights 3D`; rotation and pitch controls are enabled only for the 3D selection. Leaving 3D returns bearing and pitch to zero. Reduced motion makes both layer and camera changes instant.

## 3. Typography

| Role | Face | Size / weight |
|---|---|---|
| Site title | GFS Didot 400 | clamp(2.6rem, 6vw, 4.3rem), lh 1.05, `text-wrap: balance` |
| Chapter heading | GFS Didot 400 | 1.85rem, lh 1.15 |
| Eyebrow | Commissioner 600 | 0.78rem, uppercase, tracking 0.08em, `--ink-3`, preceded by a 1.4rem × 2px `--accent` dash |
| Body | Commissioner 400 | 1.09rem, lh 1.68, measure ≤ 65ch everywhere (cards ~58ch; hero tagline and sources prose capped in `ch`, not rem) |
| Sources / captions | Commissioner 400 | 0.8rem, `--ink-3` on card |
| Chip / UI labels | Commissioner 600 | 0.72rem, uppercase, tracking 0.06em, `tabular-nums` |
| Ghost placeholder numerals | GFS Didot 400 | clamp(3rem, 9vw, 7rem), `--ink` at 7% |

Self-hosted woff2 (latin + greek subsets, 81 KB), `font-display: swap`, OFL, recorded in `fonts/LICENSE-FONTS.md`. Commissioner is a variable font (`font-weight: 100 900`). Fallbacks: Didot → Georgia/serif; Commissioner → system sans. Neither family ships an italic on Google Fonts; display text never uses italic, and body-text loanwords render as synthesized oblique — acceptable at body sizes. FOUT: `swap` with metric-compatible fallbacks is accepted for this draft; revisit only if Gate C finds the swap visible enough to matter.

## 4. Layout

Desktop (>700px): the map owns the full viewport, sticky; narrative rides a left rail of cards, width min(26rem, 88vw), left margin clamp(1.25rem, 5vw, 4.5rem). Cards: `--card` ground, 1px `--line` border, 3px radius, 1.75rem/2rem padding, shadow `0 1px 2px rgba(38,36,31,.06), 0 10px 28px rgba(38,36,31,.05)`. Steps are ≥100vh with 3rem vertical padding so consecutive tall cards never touch; a card taller than the viewport reads continuously as it scrolls — accepted scrolly behavior, tested at 450/600/720/1200px heights in Stage 3's checklist. Hero: 92vh on `--paper`, left-aligned on the rail grid, bottom hairline.

**Map safe areas (binding).** All cameras apply MapLibre padding `{left: 480, top: 56, right: 56, bottom: 72}` on desktop so focal geometry centers in the free area right of the card rail — at 701–900px widths this is what keeps the rail from covering the subject. Reserved UI zones: top-right = controls (dropdown, layer radio, and in the draft the placeholder note), bottom-right = chapter chip, bottom-left = legend, left rail = cards. Between 701 and 900px the rail is capped at 24rem and padding.left drops to 420.

Mobile (≤700px): the stacked non-WebGL reading path is the default (PLAN §5) — live map hidden and **not instantiated** (no WebGL context, no tile fetches), cards full-width on `--paper`. Each chapter card carries a static pre-rendered map image (Stage 3): `<figure class="map-static">` after the heading, 780×975 (4:5) PNG at DPR 2, showing that chapter's build state — animated chapters use their final stop (ch 5: 1971–80; ch 8: built-up by 2020) with the span named in the caption — plus alt text stating the map state in one sentence and a `figcaption` with the layer's date and caveat.

## 5. Per-chapter states

Placeholder = what ships in this draft (ground tint + Didot ghost numeral + chip). Camera values are the binding starting contract; Stage 3 may tune each once against real geometry, then freeze.

| Ch | Eyebrow | Ghost | Tint | Camera (center / zoom) | Build state |
|---|---|---|---|---|---|
| 1 | Chapter 1 · Athens today | 2021 | neutral | 23.735, 37.99 / 10.4 | footprints only (≥z11 rule applies: open at z10.4 shows ground; a slow settle to z11.2 reveals texture, reduced-motion jumps straight to z11.2) |
| 2 | Chapter 2 · 1833–1920 | 1875 | historic | 23.727, 37.976 / 12.2 | Kaupert raster or extent-outline fallback |
| 3 | Chapter 3 · 1922–1928 | 1922 | neutral | 23.72, 38.0 / 11.2 | refugee-quarter highlights per §2 |
| 4 | Chapter 4 · 1929–1940 | 1929 | historic | 23.735, 37.985 / 13.0 | center camera; polykatoikia section diagram in card |
| 5 | Chapter 5 · 1946–1980 | 1946–1980 | neutral | 23.72, 37.98 / 10.8 | choropleth sweep (§6 choreography); antiparochi diagram in card |
| 6 | Chapter 6 · 1950s–1970s | 1955 | neutral | 23.727, 37.972 / 13.3 | tight core, Plaka outline |
| 7 | Chapter 7 · 1833 onward | 2018 | green | 23.75, 38.0 / 10.2 | Urban Atlas layer + caption |
| 8 | Chapter 8 · 1980–2008 | 1975–2020 | satellite | 23.85, 37.95 / 9.8 | GHSL cumulative sweep (§6) |
| 9 | Chapter 9 · 1946–1980 | 1946–1980 | neutral | = ch 1 | ch-1 camera + 1946–80 combined choropleth |
| 10 | Chapter 10 · Explore | — | neutral | = ch 1, maxBounds [[23.2,37.6],[24.3,38.4]] | free camera + controls per §7 |

**Diagrams (Stage 3, binding style).** Both are inline SVG in the card below the body text, `width:100%`, ink 1.5px linework on `--card`, at most two clay accents each, Commissioner 12px labels, `<title>`/`<desc>` plus `figcaption`, full alt text. Chapter 5, antiparochi flow: four panels left to right — owner's plot → contract (no money changes hands) → construction at the contractor's risk → finished block with the flats split owner/contractor; viewBox ≈ 700×420. Chapter 4, polykatoikia section: vertical cutaway — shops/pilotis at street, five repeated frame floors, two setback floors, roof terrace; concrete frame picked out in clay; viewBox ≈ 600×720.

## 6. Scroll choreography

Scroll position is the only controller; there is no timed autoplay. Chapters 5 and 8 use Scrollama progress mode on their steps: progress < 1/3 → state A, 1/3–2/3 → state B, ≥ 2/3 → state C (ch 5: 1946–60 / 1961–70 / 1971–80; ch 8: built-up by 1990 / by 2005 / by 2020). Reverse scrolling walks the states backward symmetrically. The legend and chip always name the current state. Transitions are 400ms opacity fades; `prefers-reduced-motion` collapses every transition to an instant swap and every camera `flyTo` (≤1600ms otherwise) to `jumpTo`. Crossing the 700px breakpoint re-anchors the viewport to the active chapter (implemented), so switching layout modes never relocates the reader.

## 7. Explore state (chapter 10)

| Control | Spec |
|---|---|
| Epoch dropdown | native `<select>`, chip type spec, label "Built in:" always visible; options = the Table 6 bins plus "1946–1980 (combined)" and "Period not stated"; default on entry = carried over from chapter 9 (1946–1980 combined) |
| Layer radio | census / satellite / green / footprints only; default census; mutually exclusive per §2 |
| Camera | `interactive: true` on step-10 enter, `false` on exit upward; maxBounds per §5; keyboard pan/zoom via MapLibre defaults with the container focusable |
| Legend | bottom-left, visible whenever a data layer is on, names layer + breaks + denominator sentence + not-stated footnote |
| Chip | hidden in chapter 10 (the controls carry the state) |
| Tooltip | hover/tap on polygon: municipality name, share, count, denominator sentence; keyboard equivalent is the data table linked beside the legend |

## 8. Accessibility acceptance criteria (Gate D checklist inputs)

Text tokens ≥ 4.5:1 in every pairing actually used (`--ink-3` confined to `--card`; on-map text uses `--ink-2`, ≥6.3:1 on all tints); focus-visible 2px `--ink` outline; **two skip links** — "Skip to the story" → `#chapter-1` and "Skip past the map narrative" → `#sources`, both targets carrying `tabindex="-1"`; full narrative in DOM regardless of map state; ghost numerals and chip `aria-hidden`; per-epoch data tables + text summaries for GHSL and green layers (Stage 3); touch targets ≥44px; WCAG 2.2 AA target per PLAN §5.

## 9. Canonical chrome copy

- Tagline: "Of the buildings standing in central Athens today, two in three went up between 1946 and 1980. Nine short chapters and one map explain why the city looks the way it does."
- Credit line: "Built on the 2021 Buildings Census (ELSTAT), read at municipality level."
- Placeholder note (draft only): "Map placeholder — data layers arrive with the build."
- Chapter 10's "sources and methods page linked below" resolves to the in-page `#sources` anchor now and to the dedicated page when Stage 3 splits it out.
- Sources section and footer text: as implemented in index.html, canonical.

## 10. Open questions for the build

Protomaps style JSON is hand-tuned against §2 in Stage 3 (no automated theme); the hatch fill-pattern ships as a 4px SVG tile; the epoch histogram (gated, PLAN §4.10) uses the clay ramp with the §2 fixed scale; Kaupert blend falls back per §2 if the license fails.

## 11. Adversarial review dispositions (Codex xhigh, 2026-07-14)

D1 footprint alpha → fixed (§2 opaque rule). D2 map/scroll coupling and mobile instantiation → fixed in js/main.js (Scrollama independent of map; WebGL- and viewport-gated map init). D3 paint contract gaps → bound in §2. D4 basemap/overlay bindings → §2. D5 sweep choreography → §6. D6 cameras and safe areas → §4–5. D7 glyph pipeline → §2. D8 denominator and unknown bin → §2 (supersession noted; PLAN §3's 2011 wording is amended by this document, flagged for Gate C). D9 skip links → §8 + index.html. D10 diagrams and mobile statics → §4–5. D11 stroke/hatch contrast → §2 table. D12 Explore state → §7. D13 card spacing → css (step padding). D14 note contrast → css (`--ink-2`). D15 breakpoint chapter loss → js (media-change re-anchor). D16 sources link → index.html anchor. D17 ghost timer race → js (timer guard). D18 measures in ch → css. D19 identity wording → §1. Verdict addressed: every named gap now carries a binding value; remaining tuning (cameras, breaks recalibration) is single-shot-then-freeze by construction.
