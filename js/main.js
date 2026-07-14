// Stage 2 draft: chapter-state wiring with placeholder art direction.
// Real map layers (choropleth, GHSL, green space, Kaupert) arrive in Stage 3;
// per-chapter build states are specified in DESIGN.md §5.

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  // CSS collapses the tint/ghost transitions under prefers-reduced-motion;
  // Stage 3 additionally swaps flyTo camera moves for jumpTo + opacity fades.

  if (window.pmtiles && window.maplibregl) {
    var protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
  }

  // Transparent style: the tinted map-wrap div supplies the ground color so
  // chapter tints crossfade in CSS. No external tile requests in Stage 2.
  var blankStyle = {
    version: 8,
    sources: {},
    layers: []
  };

  var map = new maplibregl.Map({
    container: "map",
    style: blankStyle,
    center: [23.7275, 37.9838], // Athens
    zoom: 10,
    interactive: false,
    attributionControl: false
  });

  // Placeholder art direction per chapter (DESIGN.md §5):
  // ghost numeral, ground tint, chip text.
  var CHAPTERS = {
    "1": { chip: "01 · Athens today", ghost: "2021", tint: "" },
    "2": { chip: "02 · 1833–1920", ghost: "1875", tint: "tint-historic" },
    "3": { chip: "03 · 1922–1928", ghost: "1922", tint: "" },
    "4": { chip: "04 · 1929–1940", ghost: "1929", tint: "tint-historic" },
    "5": { chip: "05 · 1946–1980", ghost: "1946–1980", tint: "" },
    "6": { chip: "06 · 1950s–1970s", ghost: "1955", tint: "" },
    "7": { chip: "07 · 1833 onward", ghost: "2018", tint: "tint-green" },
    "8": { chip: "08 · 1980–2008", ghost: "1975–2020", tint: "tint-satellite" },
    "9": { chip: "09 · 1946–1980", ghost: "1946–1980", tint: "" },
    "10": { chip: "10 · Explore", ghost: "", tint: "" }
  };

  var TINT_CLASSES = ["tint-historic", "tint-satellite", "tint-green"];

  var mapWrap = document.getElementById("map-wrap");
  var chip = document.getElementById("chapter-chip");
  var ghost = document.getElementById("ghost-label");

  function setGhost(text) {
    if (!ghost) return;
    if (prefersReducedMotion) {
      ghost.textContent = text;
      return;
    }
    ghost.classList.add("is-fading");
    window.setTimeout(function () {
      ghost.textContent = text;
      ghost.classList.remove("is-fading");
    }, 200);
  }

  function setChapterState(n) {
    var state = CHAPTERS[String(n)];
    if (!state) return;
    if (chip) chip.textContent = state.chip;
    if (mapWrap) {
      TINT_CLASSES.forEach(function (c) {
        mapWrap.classList.remove(c);
      });
      if (state.tint) mapWrap.classList.add(state.tint);
    }
    setGhost(state.ghost);
    // Stage 3: layer visibility, epoch filters, and camera moves keyed to n.
  }

  function initScrollama() {
    if (!window.scrollama) {
      console.warn("Scrollama not loaded");
      return;
    }

    var scroller = scrollama();

    scroller
      .setup({
        step: ".step",
        offset: 0.5
      })
      .onStepEnter(function (response) {
        setChapterState(response.element.getAttribute("data-chapter"));
      });

    window.addEventListener("resize", scroller.resize);
  }

  map.on("load", function () {
    initScrollama();
  });
})();
