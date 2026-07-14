// Stage 2 draft: chapter-state wiring with placeholder art direction.
// Real map layers (choropleth, GHSL, green space, Kaupert) arrive in Stage 3;
// per-chapter build states, cameras, and choreography are bound in DESIGN.md.

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  // CSS collapses the tint/ghost transitions under prefers-reduced-motion;
  // Stage 3 additionally swaps flyTo camera moves for jumpTo (DESIGN.md §6).

  var mobileQuery = window.matchMedia("(max-width: 700px)");

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

  var currentChapter = "1";
  var ghostTimer = null;

  function setGhost(text) {
    if (!ghost) return;
    if (ghostTimer !== null) {
      window.clearTimeout(ghostTimer);
      ghostTimer = null;
    }
    if (prefersReducedMotion) {
      ghost.textContent = text;
      return;
    }
    ghost.classList.add("is-fading");
    ghostTimer = window.setTimeout(function () {
      ghost.textContent = text;
      ghost.classList.remove("is-fading");
      ghostTimer = null;
    }, 200);
  }

  function setChapterState(n) {
    var state = CHAPTERS[String(n)];
    if (!state) return;
    currentChapter = String(n);
    if (chip) chip.textContent = state.chip;
    if (mapWrap) {
      TINT_CLASSES.forEach(function (c) {
        mapWrap.classList.remove(c);
      });
      if (state.tint) mapWrap.classList.add(state.tint);
    }
    setGhost(state.ghost);
    // Stage 3: layer visibility, epoch filters, and camera moves keyed to n,
    // with progress-mode substates on chapters 5 and 8 (DESIGN.md §6).
  }

  // Scrollama fires on scroll entry only; a deep link (#chapter-3) or reload
  // mid-page lands without an event, so sync once to whichever step spans the
  // trigger line.
  function syncToCurrentStep() {
    var trigger = window.innerHeight * 0.5;
    var steps = document.querySelectorAll(".step");
    for (var i = 0; i < steps.length; i++) {
      var rect = steps[i].getBoundingClientRect();
      if (rect.top <= trigger && rect.bottom >= trigger) {
        setChapterState(steps[i].getAttribute("data-chapter"));
        return;
      }
    }
  }

  // Chapter sync must not depend on the map: it runs even where WebGL is
  // unavailable and on the stacked mobile path (DESIGN.md §11, D2).
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
    syncToCurrentStep();
  }

  // Crossing the 700px breakpoint swaps layout mode (sticky map vs stacked);
  // pixel scroll position then points at a different chapter, so re-anchor
  // the viewport to the chapter the reader was in (DESIGN.md §11, D15).
  function onLayoutModeChange() {
    var section = document.getElementById("chapter-" + currentChapter);
    if (section) {
      section.scrollIntoView({ block: "center" });
    }
  }
  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", onLayoutModeChange);
  }

  function webglAvailable() {
    try {
      var canvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl"))
      );
    } catch (e) {
      return false;
    }
  }

  // The live map is a progressive enhancement: skip it entirely on the
  // stacked mobile path (the wrap is display:none — no WebGL context, no tile
  // fetches) and wherever WebGL is missing. The placeholder tints and ghost
  // live on the wrap div, not the map, so chapter states work regardless.
  function initMap() {
    if (mobileQuery.matches) return;
    if (!window.maplibregl || !webglAvailable()) return;

    if (window.pmtiles) {
      var protocol = new pmtiles.Protocol();
      maplibregl.addProtocol("pmtiles", protocol.tile);
    }

    // Transparent style: the tinted map-wrap div supplies the ground color so
    // chapter tints crossfade in CSS. No external tile requests in Stage 2.
    try {
      new maplibregl.Map({
        container: "map",
        style: { version: 8, sources: {}, layers: [] },
        center: [23.7275, 37.9838], // Athens
        zoom: 10,
        interactive: false,
        attributionControl: false
      });
    } catch (e) {
      console.warn("Map init failed; continuing without the live map", e);
    }
  }

  initScrollama();
  initMap();
})();
