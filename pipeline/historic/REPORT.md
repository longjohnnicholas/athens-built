# Historic extent attempt — fallback report

Date: 2026-07-15
Decision: **fallback fired; no historic extent polygons were promoted.**

The accepted georeferencing results are retained in `pipeline/historic/warped/`.
The automated candidates were rejected because neither nested completely inside
the GHSL 1975 observation. In the final extraction pass, 0.127 km² of the nominal
1875 candidate and 0.259 km² of the nominal 1925 candidate fell outside that band.
Per the honesty gate, `data/extent_1875.geojson` and
`data/extent_1925.geojson` were not created and chapters 2, 3, and 8 were not
changed.

## Provenance

All source records below are on Wikimedia Commons and were marked public domain
when retrieved on 2026-07-15. Exact Commons license templates are copied from the
file-page wikitext.

| Role | Commons file page | Record date and resolution | Commons license tags | Local source SHA-256 |
|---|---|---|---|---|
| Kaupert high-resolution coverage check; rejected before extraction because it omits Piraeus | <https://commons.wikimedia.org/wiki/File:Athen_mit_Umgebung_-_von_J._A._Kaupert_-_btv1b53172841g.jpg> | 1891; 9,046 × 9,646 | `PD-France`, `PD-US-expired` | `cea189cacd3d9e24537fdd65d6b184484b705ebd0fde7a136256d460b70b5011` |
| Kaupert-derived Athens extraction plate (printed “Nach Kaupert”) | <https://commons.wikimedia.org/wiki/File:Map_of_Athens_in_1894_-_Baedeker_Karl_-_1894.jpg> | 1894; 1,780 × 1,792 | `PD-art|PD-old`, `PD-1996` | `9648ee27256f20c6015e1cba14e25ebb42282078c34fd4e22a1ae7e0073d193c` |
| Kaupert-derived Piraeus extraction plate (printed “Nach Kaupert”) | <https://commons.wikimedia.org/wiki/File:Le_Pir%C3%A9e_-_Baedeker_Karl_-_1894.jpg> | 1894; 1,500 × 1,128 | `PD-art|PD-old`, `PD-1996` | `1fc3de4ee9b0f99496d931e47c8845892d8598633f8effb747c0b0163c25dbaa` |
| Later Athens and Piraeus extraction plates | <https://commons.wikimedia.org/wiki/File:Griechenland_-_Handbuch_f%C3%BCr_Reisende_%28IA_griechenlandhand00karl%29.pdf> | 1908; 638-page scan; Athens page rendered at 3,396 × 2,660, Piraeus at 3,021 × 2,250 | `PD-US-expired` | PDF: `41a80100a29aac2d7b0d1df739c05f6dda5366cd88d54a5da192dd73a38251f8`; rendered pages: `982562ff846073afb05a46e565f2870e26403c9eb8d52182cbfeea500de6b23d`, `5292a16bd8b3c55ac002185c6a60825f6a2a5639858e61fcf6ea4f2a21b0d9be` |
| Low-resolution regional cross-check; rejected for extraction | <https://commons.wikimedia.org/wiki/File:Athens_and_Piraeus_map_1908.jpg> | 1908; 827 × 545 | `PD-scan|PD-old-100` | `32761935757020cf80cde497508bec17f6695769300c8f2cdab85b258e68b863` |

Decision log:

- The single 1891 Kaupert scan has the best source resolution, but it does not
  cover the Piraeus built-up area. Using it alone would fail the requested basin
  coverage. The two 1894 Baedeker plates were tested instead because they cover
  Athens and Piraeus separately and explicitly credit Kaupert on the plates.
- “1875” was treated only as the requested nominal timeline state for the
  1875–94 Kaupert series. The actual tested plates are dated 1894; this is not an
  observation made exactly in 1875.
- The 1908 full-volume plates were used instead of the 827 × 545 regional preview
  because their block rendering is materially cleaner. “1925” was likewise a
  nominal chapter state; the accepted scan date is 1908, before the refugee
  settlement wave.
- Standalone GDAL command-line programs were unavailable. Rasterio 1.4.3 linked
  against GDAL 3.9.3 performed the GCP affine fits and EPSG:4326 warps.

## Georeferencing

The fit used an affine transform per sheet. RMS is the root mean square of each
GCP's planar residual at Athens latitude. The acceptance threshold was 60 m per
sheet, not per individual control point.

| Sheet | GCP anchors | GCPs | RMS | Individual residuals (m) | Result |
|---|---|---:|---:|---|---|
| Kaupert-derived Athens 1894 | Acropolis, Panathenaic Stadium, Omonia, Syntagma, Olympieion, National Archaeological Museum, Pnyx | 7 | 24.21 m | 1.12, 33.88, 11.30, 21.61, 44.68, 10.80, 15.68 | accept |
| Kaupert-derived Piraeus 1894 | Mikrolimano basin, main-harbour mouth, Zea entrance, Mikrolimano entrance, Kastella summit | 5 | 45.99 m | 26.72, 28.09, 63.21, 66.05, 26.71 | accept |
| Baedeker Athens 1908 | same seven Athens anchors | 7 | 40.46 m | 28.11, 17.33, 69.20, 30.25, 30.46, 45.01, 41.37 | accept |
| Baedeker Piraeus 1908 | same five Piraeus anchors | 5 | 45.99 m | 26.72, 28.09, 63.21, 66.05, 26.71 | accept |

An alternate Piraeus control interpretation produced 72 m RMS and was rejected;
the retained fit is the 45.99 m solution above. No sheet exceeded the 60 m RMS
threshold.

Warped raster facts:

| File | Pixel dimensions | EPSG:4326 bounds (west, south, east, north) | SHA-256 |
|---|---:|---|---|
| `kaupert-athens-1894-epsg4326.tif` | 1,689 × 1,206 | 23.7132118, 37.9659263, 23.7469918, 37.9900463 | `19acd70b83fa6a8548fbce01f392ef26ade0ac2a27c503af88031e08742c74bd` |
| `kaupert-piraeus-1894-epsg4326.tif` | 2,487 × 1,926 | 23.6155420, 37.9182465, 23.6652820, 37.9567665 | `586c4dfe151f7101c65d43bb80a49ce1244605ba1d0c37d14158ba41c19dbc26` |
| `baedeker-athens-1908-epsg4326.tif` | 2,061 × 1,246 | 23.7115682, 37.9656667, 23.7527882, 37.9905867 | `d71ce032d5d1d1f67543bb83bfbf9b880a06bd9ab1ec0fac0bf093d2ff041dcd` |
| `baedeker-piraeus-1908-epsg4326.tif` | 2,478 × 1,909 | 23.6148606, 37.9187334, 23.6644206, 37.9569134 | `fad356856e97f5efd89e3d280bc73949fc2802a8849d59020ab46b685c61278b` |

## Extraction and gates

The candidate method selected the maps' orange/red block pigment, removed isolated
source pixels, calculated local pigment density over a 41-pixel window, performed
morphological closing and opening, polygonized the result, removed components
under 1 ha, and applied a 12 m topology-preserving simplification. No GHSL clipping
was used: GHSL remained an independent gate.

| Pass | Density floors: 1894 Athens / Piraeus; 1908 Athens / Piraeus | 1875 area | 1925 area | 1925 ÷ 1875 | Outside GHSL 1975: 1875 / 1925 | Result |
|---|---|---:|---:|---:|---:|---|
| Baseline | .070 / .055; .085 / .080 | 9.262 km² | 8.729 km² | 0.943 | 0.193 / 0.273 km² | reject: later extent smaller; containment fails |
| Iteration 1 | .095 / .075; .055 / .060 | 8.588 km² | 9.256 km² | 1.078 | 0.160 / 0.307 km² | reject: growth not visibly large; containment fails |
| Iteration 2 | .120 / .110; .035 / .090 | 7.677 km² | 9.020 km² | 1.175 | 0.127 / 0.259 km² | reject: exact containment fails |

Final-pass plausibility facts:

- Both candidates are compact and limited to the historic Athens core and
  Piraeus. Bounds are 23.616062–23.745792 E, 37.923366–37.989326 N for the nominal
  1875 state and 23.615481–23.746948 E, 37.923893–37.990147 N for the nominal 1925
  state. Neither reaches Kifissia, Nea Ionia, or the airport plain.
- The nominal 1925 candidate is 17.5% larger than the nominal 1875 candidate.
- Exact GHSL 1975 containment fails. The visible errors concentrate on coastal
  strokes and printed terrain/harbour detail that the texture method cannot
  reliably distinguish from built blocks. The candidates were not clipped to
  manufacture a pass.
- QA overlays for the rejected candidates are at
  `/private/tmp/claude-501/-Users-ntsivanidis/8b19effd-dac5-417e-9c4d-0fbca094fedc/scratchpad/qa-extent-1875.png`
  and
  `/private/tmp/claude-501/-Users-ntsivanidis/8b19effd-dac5-417e-9c4d-0fbca094fedc/scratchpad/qa-extent-1925.png`.

## Manual tracing required

1. Trace occupied block faces from the warped Athens and Piraeus scans, not the
   orange road, contour, shoreline, fortification, or label strokes.
2. Delineate harbour water and the undeveloped rocky coast as explicit exclusions;
   inspect every coastal ring at native scan resolution.
3. Have a second reviewer re-identify the Piraeus controls, where two individual
   residuals exceed 60 m even though the sheet RMS passes.
4. Preserve the actual observation dates in the published legend. If the desired
   state must be labelled 1925, locate and georeference a genuinely 1920s plan;
   the 1908 scan can only support a pre-refugee baseline.
5. Re-run the 1 ha sliver gate, compact-basin bounds, temporal growth comparison,
   and exact GHSL 1975 containment before adding chapter-bound extent layers.
