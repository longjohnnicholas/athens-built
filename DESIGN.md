# Design specification — How postwar Athens was built

*Stage 2 design system and art direction, 2026-07-14. This document is the contract for the Stage 3 build and the target of the pre-build adversarial review. The implemented draft (css/site.css, index.html, js/main.js) realizes the page chrome and placeholder map states; map-layer paint specs below bind the build.*

## 1. Identity concept

The page enacts the site's thesis. Display typography wears the neoclassical city that was demolished: GFS Didot, the Greek Font Society's revival of the Didot tradition that dominated 19th-century Greek printing. Body and interface text wear the concrete city that replaced it: Commissioner, a grotesque by the Greek type designer Kostas Bartsokas, with full Greek coverage for map labels. The two faces meet on every chapter card the way the two cities meet on every block.

Color follows the same discipline. The chrome is achromatic plaster and concrete; the one strong hue on the page is an Attic-clay ramp reserved for the census data. The reader's eye goes to the choropleth because nothing else on the page competes with it. The satellite record is deliberately colorless (grays), and green is reserved for actual green space, so the three datasets cannot be confused with one another.

One theme, light, committed deliberately: the subject is a city defined by hard Mediterranean light, all map layers are tuned against a light ground, and the photography and historic map scans read correctly only on it. `color-scheme: light` is declared; this is a decision, not an omission (revisit only if Gate C demands it).

## 2. Tokens

### Neutrals and text

| Token | Value | Use | Contrast (validated) |
|---|---|---|---|
| `--paper` | `#F5F4F0` | page ground | — |
| `--card` | `#FDFCFA` | narrative cards, chips | vs paper 1.07:1 → 1px border required, present |
| `--ink` | `#26241F` | headings, body | 14.1:1 on paper, 15.1:1 on card |
| `--ink-2` | `#57534A` | secondary text, tagline | 7.5:1 on card |
| `--ink-3` | `#6E695F` | captions, sources, chips | 5.3:1 on card |
| `--line` | `#DCD9D2` | hairlines, card borders | — |
| `--accent` | `#77391A` | links, eyebrow dashes | 8.0:1 on paper |
| `--accent-2` | `#9C552B` | link hover, ch-3 highlights | 4.5:1 on map ground |

### Attic-clay sequential ramp — census epoch choropleth

`#F2E4D5 → #E4C4A0 → #D4A171 → #BD7B49 → #9C552B → #77391A`

Validator (dataviz skill, `validate_palette.js`, light surface): relative luminance strictly monotone (0.792 → 0.069); worst adjacent-pair CVD separation ΔE 13.2 (deutan) — pass. The categorical-mode band/chroma checks do not apply to a sequential ramp (light, low-chroma low ends are the encoding). The three lightest fills sit below 3:1 against the map ground, so the required relief is structural and non-negotiable: municipal boundary strokes (`--map-boundary`) on every polygon, a legend with labeled breaks on screen whenever the layer is on, and the per-epoch data table (PLAN §5) as the textual equivalent.

Fixed cross-epoch scale, breaks stated in the legend: 0–5, 5–15, 15–25, 25–35, 35–50, 50%+ of buildings standing at the 2021 census (breaks may be recalibrated once against full-region data in Stage 3, then frozen across all epochs). No-data/suppressed areas: 45° hatch of `--line` on `--map-ground` (fill-pattern), never a ramp color, named in the legend.

### Satellite (GHSL) achromatic ramp — built-up land by period

`#DDDAD4 → #BBB7AF → #98948B → #736F66 → #4A463F` (older → newer: darker = more recently built-up). Monotone; worst adjacent CVD ΔE 12.6 — pass. Colorlessness is the identity: the satellite record must read as a different instrument from the census. Same relief rules (legend + text labels).

### Green space — Urban Atlas

Fill `#7A9367` at 60% over map ground, boundary `#4F7A3D`. Deliberately desaturated: layer-trio CVD check (clay mid, gray mid, green) passes at worst ΔE 12.3 (protan) only at this chroma — a more saturated green collapses to ΔE 4.4 for protanopes against the clay. Bound design rule that protects this: **data layers are mutually exclusive** (radio selection in Explore, never stacked), each with its own text-labeled legend, so layer identity is never carried by color alone.

### Map ground

| Token | Value | Use |
|---|---|---|
| `--map-ground` | `#E9E7E2` | land |
| `--map-water` | `#C7D2D5` | sea, muted so data hues dominate |
| `--map-footprint` | `#6E6862` at 0.55 | building footprints, always neutral (honesty rule: no footprint ever carries an epoch color) |
| `--map-boundary` | `#8F8A83` | municipal hairlines, 0.75px |
| `--map-road` | `#F7F6F2` | roads as light lines, no casings below z14, labels sparse |

Basemap (Protomaps clip, Stage 3): suppress POI icons and commercial labels entirely; place labels in Commissioner (Greek script at native names, `text-size` 11–13); terrain/hillshade off; parks in the basemap rendered as ground (green appears only via the Urban Atlas layer).

## 3. Typography

| Role | Face | Size / weight |
|---|---|---|
| Site title | GFS Didot 400 | clamp(2.6rem, 6vw, 4.3rem), lh 1.05, `text-wrap: balance` |
| Chapter heading | GFS Didot 400 | 1.85rem, lh 1.15 |
| Eyebrow (chapter no. + period) | Commissioner 600 | 0.78rem, uppercase, tracking 0.08em, `--ink-3`, preceded by a 1.4rem × 2px `--accent` dash |
| Body | Commissioner 400 | 1.09rem, lh 1.68, measure ≤ 65ch |
| Sources / captions | Commissioner 400 | 0.8rem, `--ink-3`, top hairline |
| Chip / UI labels | Commissioner 600 | 0.72rem, uppercase, tracking 0.06em, `tabular-nums` |
| Ghost placeholder numerals | GFS Didot 400 | clamp(3rem, 9vw, 7rem), `--ink` at 7% |

Self-hosted woff2 (latin + greek subsets, 81 KB total), `font-display: swap`, OFL-licensed, recorded in `fonts/LICENSE-FONTS.md`. Commissioner ships as a variable font (`font-weight: 100 900`). Fallback stacks: Didot → Georgia/serif; Commissioner → system sans. Italics: neither family ships an italic via Google Fonts (GFS Didot italic does not exist there), so display text never uses italic, and body-text loanwords (antiparochi, polykatoikia) render as browser-synthesized oblique — acceptable at body sizes, revisit only if Gate C objects.

## 4. Layout

Desktop (>700px): the map owns the full viewport, sticky; narrative rides a left rail of cards, width min(26rem, 88vw), left margin clamp(1.25rem, 5vw, 4.5rem). Cards: `--card` ground, 1px `--line` border, 3px radius, 1.75rem/2rem padding, shadow `0 1px 2px rgba(38,36,31,.06), 0 10px 28px rgba(38,36,31,.05)` — crisp edge, faint sun-shadow, nothing floatier. Each step is ≥100vh so one card ≈ one viewport. Hero: 92vh on `--paper`, left-aligned on the same rail grid (nothing on this page is centered), holding eyebrow, title, tagline, census credit, scroll cue; a bottom hairline hands off to the map.

Mobile (≤700px): the stacked non-WebGL reading path is the default (PLAN §5) — map hidden, cards full-width on `--paper`, hero shortened; static per-chapter map images replace live states in Stage 3.

## 5. Per-chapter art direction

Placeholder = what ships in this draft (ground tint + Didot ghost numeral + chip); Build = the Stage 3 map state it stands for.

| Ch | Eyebrow | Ghost | Tint (draft) | Build state |
|---|---|---|---|---|
| 1 | Chapter 1 · Athens today | 2021 | neutral | basin-wide camera, footprints only |
| 2 | Chapter 2 · 1833–1920 | 1875 | historic (`#EDE6D8`) | Kaupert raster (license pending), modern layers off |
| 3 | Chapter 3 · 1922–1928 | 1922 | neutral | refugee quarters outlined in `--accent-2` |
| 4 | Chapter 4 · 1929–1940 | 1929 | historic | center camera; polykatoikia section diagram (inline SVG, full alt) beside card |
| 5 | Chapter 5 · 1946–1980 | 1946–1980 | neutral | choropleth sweep 1946–60 → 1961–70 → 1971–80, legend on |
| 6 | Chapter 6 · 1950s–1970s | 1955 | neutral | tight camera on the core, Plaka outlined in `--ink` |
| 7 | Chapter 7 · 1833 onward | 2018 | green (`#E7EAE2`) | Urban Atlas green layer, dated caveat on screen |
| 8 | Chapter 8 · 1980–2008 | 1975–2020 | satellite (`#E3E4E1`) | GHSL epochs animate outward |
| 9 | Chapter 9 · 1946–1980 | 1946–1980 | neutral | chapter-1 camera + 1946–80 choropleth |
| 10 | Chapter 10 · Explore | — | neutral | free camera, epoch dropdown, layer radio, sources link |

## 6. Interaction (build contract)

Epoch dropdown: native `<select>` styled to chip spec, top-right over the map, label always visible ("Built in:"), keyboard and screen-reader complete. Layer selection: radio group (census / satellite / green / none-but-footprints), mutually exclusive per §2. Hover/tap on a choropleth polygon: tooltip with municipality name, share, count, and denominator sentence; hit target the full polygon; keyboard equivalent is the data table. Touch targets ≥44px. Legend visible whenever a data layer is on; it names the layer in text.

## 7. Motion

Ghost/tint crossfade 400ms opacity ease; Stage 3 camera moves `flyTo` ≤ 1600ms. `prefers-reduced-motion: reduce` collapses all transitions to 0ms and swaps camera flights for `jumpTo` + opacity fade (already stubbed in js/main.js). No entrance animations on cards, no parallax, no scroll-jacking: scroll position is the only controller.

## 8. Accessibility acceptance criteria (Gate D checklist inputs)

All text tokens ≥ 4.5:1 (table above, computed 2026-07-14); focus-visible 2px `--ink` outline; skip link past the scrolly; full narrative in DOM regardless of map state; ghost numerals and chip `aria-hidden`; per-epoch data tables + text summaries for GHSL and green layers (Stage 3); WCAG 2.2 AA target per PLAN §5.

## 9. Canonical chrome copy

- Tagline: "Of the buildings standing in central Athens today, two in three went up between 1946 and 1980. Nine short chapters and one map explain why the city looks the way it does."
- Credit line: "Built on the 2021 Buildings Census (ELSTAT), read at municipality level."
- Placeholder note (draft only): "Map placeholder — data layers arrive with the build."
- Sources section and footer text: as implemented in index.html, canonical.

## 10. Open questions for the build

Protomaps style JSON is hand-tuned against §2 tokens in Stage 3 (no automated theme); hatch fill-pattern for no-data needs a 4px SVG tile; the epoch histogram (gated, PLAN §4.10) would use the clay ramp with the same fixed scale; Kaupert raster treatment (multiply-blend onto `--map-ground` vs raw sepia) is decided when the license clears.
