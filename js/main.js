// Stage 2 scaffold: wiring only, no real map layers yet.
// MapLibre GL JS, Scrollama, and PMTiles are loaded globally via <script> tags
// in index.html (vendor/maplibre-gl.js, vendor/scrollama.min.js, vendor/pmtiles.js).

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  // Stub: later stages use this to swap camera flyTo/flyToBounds animations
  // for instant jumpTo/setCenter calls and opacity fades instead of motion.
  if (prefersReducedMotion) {
    console.log("prefers-reduced-motion: reduce — animations will be disabled in a later stage");
  }

  // Register the pmtiles:// protocol with MapLibre so PMTiles archives can be
  // used as vector/raster sources later. Not used by any source yet.
  if (window.pmtiles && window.maplibregl) {
    var protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
  }

  // Blank/neutral style: no external tile requests. A single flat background
  // layer stands in for the real basemap until Stage 3.
  var blankStyle = {
    version: 8,
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": "#e8e8e8"
        }
      }
    ]
  };

  var map = new maplibregl.Map({
    container: "map",
    style: blankStyle,
    center: [23.7275, 37.9838], // Athens
    zoom: 10,
    interactive: false
  });

  var debugLabel = document.getElementById("chapter-debug-label");

  function setChapterState(n) {
    console.log("Chapter " + n + " placeholder");
    if (debugLabel) {
      debugLabel.textContent = "Chapter " + n + " placeholder";
    }
    // Real per-chapter map states (layer visibility, camera moves, epoch
    // filters) are wired in Stage 3, per PLAN.md §4.
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
        var chapter = response.element.getAttribute("data-chapter");
        setChapterState(chapter);
      });

    window.addEventListener("resize", scroller.resize);
  }

  map.on("load", function () {
    initScrollama();
  });
})();
