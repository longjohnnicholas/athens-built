(function () {
  "use strict";

  var mobileQuery = window.matchMedia("(max-width: 700px)");
  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  var MAP_GROUND = "#E9E7E2";
  var HISTORIC_GROUND = "#EDE6D8";
  var CLAY_RAMP = [
    "#F2E4D5",
    "#E4C4A0",
    "#D4A171",
    "#BD7B49",
    "#9C552B",
    "#77391A"
  ];
  var GHSL_RAMP = ["#DDDAD4", "#BBB7AF", "#736F66", "#4A463F"];
  var GHSL_YEARS = [1975, 1990, 2005, 2020];
  var HEIGHT_RAMP = ["#DEE3E7", "#B8C2CA", "#8FA0AC", "#64798A", "#3C4F60"];
  var MAX_BOUNDS = [
    [23.2, 37.6],
    [24.3, 38.4]
  ];
  var REFUGEE_MUNICIPALITIES = [
    "ΔΗΜΟΣ ΝΕΑΣ ΙΩΝΙΑΣ",
    "ΔΗΜΟΣ ΚΑΙΣΑΡΙΑΝΗΣ",
    "ΔΗΜΟΣ ΒΥΡΩΝΟΣ",
    "ΔΗΜΟΣ ΝΙΚΑΙΑΣ - ΑΓΙΟΥ ΙΩΑΝΝΗ ΡΕΝΤΗ"
  ];

  var EPOCHS = {
    p_pre1919: { label: "Before 1919", count: "n_pre1919" },
    p_1919_45: { label: "1919–1945", count: "n_1919_45" },
    p_1946_60: { label: "1946–1960", count: "n_1946_60" },
    p_1961_70: { label: "1961–1970", count: "n_1961_70" },
    p_1971_80: { label: "1971–1980", count: "n_1971_80" },
    p_1981_85: { label: "1981–1985", count: "n_1981_85" },
    p_1986_90: { label: "1986–1990", count: "n_1986_90" },
    p_1991_95: { label: "1991–1995", count: "n_1991_95" },
    p_1996_00: { label: "1996–2000", count: "n_1996_00" },
    p_2001_05: { label: "2001–2005", count: "n_2001_05" },
    p_2006_10: { label: "2006–2010", count: "n_2006_10" },
    p_2011_15: { label: "2011–2015", count: "n_2011_15" },
    p_2016_21: { label: "2016–2021", count: "n_2016_21" },
    p_undercons: { label: "Under construction", count: "n_undercons" },
    p_1946_80: {
      label: "1946–1980 (combined)",
      counts: ["n_1946_60", "n_1961_70", "n_1971_80"]
    }
  };

  var CHAPTERS = {
    "1": {
      chip: "01 / 10 · Athens today",
      center: [23.735, 37.99],
      zoom: 10.4,
      layer: "heights"
    },
    "2": {
      chip: "02 / 10 · 1833–1920",
      center: [23.727, 37.976],
      zoom: 12.2,
      layer: "footprints",
      historic: true
    },
    "3": {
      chip: "03 / 10 · 1922–1928",
      center: [23.72, 38.0],
      zoom: 11.2,
      layer: "footprints",
      refugees: true
    },
    "4": {
      chip: "04 / 10 · 1929–1940",
      center: [23.735, 37.985],
      zoom: 13.0,
      layer: "footprints",
      historic: true
    },
    "5": {
      chip: "05 / 10 · 1946–1980",
      center: [23.72, 37.98],
      zoom: 10.8,
      layer: "census"
    },
    "6": {
      chip: "06 / 10 · 1950s–1970s",
      center: [23.727, 37.972],
      zoom: 13.3,
      layer: "footprints"
    },
    "7": {
      chip: "07 / 10 · 1833 onward",
      center: [23.75, 38.0],
      zoom: 10.2,
      layer: "green"
    },
    "8": {
      chip: "08 / 10 · 1980–2008",
      center: [23.85, 37.95],
      zoom: 9.8,
      layer: "satellite"
    },
    "9": {
      chip: "09 / 10 · 1946–1980",
      center: [23.735, 37.99],
      zoom: 10.4,
      layer: "census",
      epoch: "p_1946_80"
    },
    "10": {
      chip: "10 / 10 · Explore",
      center: [23.735, 37.99],
      zoom: 10.4,
      layer: "census",
      epoch: "p_1946_80"
    }
  };

  var CENSUS_SWEEP = ["p_1946_60", "p_1961_70", "p_1971_80"];
  var GHSL_SWEEP = [1990, 2005, 2020];

  var chip = document.getElementById("chapter-chip");
  var legend = document.getElementById("map-legend");
  var legendTitle = document.getElementById("legend-title");
  var legendSwatches = document.getElementById("legend-swatches");
  var legendBreaks = document.getElementById("legend-breaks");
  var legendDescription = document.getElementById("legend-description");
  var controls = document.getElementById("map-controls");
  var epochSelect = document.getElementById("epoch-select");
  var tooltip = document.getElementById("map-tooltip");

  var map = null;
  var mapStyleReady = false;
  var dataReady = false;
  var dataPromise = null;
  var currentChapter = "1";
  var chapterProgress = { "5": 0, "8": 0, "9": 0 };
  var activeMapLayer = "footprints";
  var activeEpoch = "p_1946_80";
  var activeGhslStop = 2020;
  var renderedLayer = null;
  var renderedEpoch = null;
  var renderedGhslStop = null;
  var renderedGround = null;
  var renderedRefugees = null;
  var tooltipPinned = false;

  function cameraPadding() {
    return {
      left: window.innerWidth <= 900 ? 420 : 600,
      top: 56,
      right: 56,
      bottom: 72
    };
  }

  function webglAvailable() {
    try {
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!window.WebGLRenderingContext || !context) return false;
      var loseContext = context.getExtension("WEBGL_lose_context");
      if (loseContext) loseContext.loseContext();
      return true;
    } catch (error) {
      return false;
    }
  }

  function fetchGeoJSON(path) {
    return window.fetch(path).then(function (response) {
      if (!response.ok) {
        throw new Error(path + " returned " + response.status);
      }
      return response.json();
    });
  }

  function loadMapData() {
    if (!dataPromise) {
      dataPromise = Promise.all([
        fetchGeoJSON("data/community_epochs.geojson"),
        fetchGeoJSON("data/municipal_epochs.geojson"),
        fetchGeoJSON("data/attica_outline.geojson"),
        fetchGeoJSON("data/ghsl_bands.geojson"),
        fetchGeoJSON("data/green_areas.geojson"),
        fetchGeoJSON("data/heights_10m_bounds.json"),
        fetchGeoJSON("data/street_trees.geojson")
      ]);
    }
    return dataPromise;
  }

  function clayExpression(property) {
    return [
      "step",
      ["coalesce", ["get", property], 0],
      CLAY_RAMP[0],
      5,
      CLAY_RAMP[1],
      15,
      CLAY_RAMP[2],
      25,
      CLAY_RAMP[3],
      35,
      CLAY_RAMP[4],
      50,
      CLAY_RAMP[5]
    ];
  }

  function overlayTransition() {
    return { duration: prefersReducedMotion ? 0 : 400, delay: 0 };
  }

  function setBaseTransitions(localMap) {
    var duration = prefersReducedMotion ? 0 : 400;
    localMap.setPaintProperty("ground", "background-color-transition", {
      duration: duration,
      delay: 0
    });
    ["landuse-ground", "park-ground"].forEach(function (layerId) {
      localMap.setPaintProperty(layerId, "fill-color-transition", {
        duration: duration,
        delay: 0
      });
    });
    localMap.setPaintProperty(
      "municipality-labels",
      "text-halo-color-transition",
      { duration: duration, delay: 0 }
    );
  }

  function setGround(historic) {
    if (!mapStyleReady || !map) return;
    var color = historic ? HISTORIC_GROUND : MAP_GROUND;
    if (renderedGround === color) return;
    renderedGround = color;
    map.setPaintProperty("ground", "background-color", color);
    map.setPaintProperty("landuse-ground", "fill-color", color);
    map.setPaintProperty("park-ground", "fill-color", color);
    map.setPaintProperty("municipality-labels", "text-halo-color", color);
  }

  function setRefugeeHighlight(visible) {
    if (!dataReady || !map || renderedRefugees === visible) return;
    renderedRefugees = visible;
    map.setPaintProperty("refugee-fill", "fill-opacity", visible ? 0.12 : 0);
    map.setPaintProperty("refugee-line", "line-opacity", visible ? 1 : 0);
    map.setLayoutProperty(
      "refugee-labels",
      "visibility",
      visible ? "visible" : "none"
    );
  }

  function setBoundaryStyle(dataLayerVisible) {
    if (!dataReady || !map) return;
    [
      { id: "community-boundaries", dataWidth: 0.7, plainWidth: 0.6 },
      { id: "municipal-boundaries", dataWidth: 1.2, plainWidth: 0.9 }
    ].forEach(function (boundary) {
      map.setPaintProperty(
        boundary.id,
        "line-color",
        dataLayerVisible ? "#FFFFFF" : "#8F8A83"
      );
      map.setPaintProperty(
        boundary.id,
        "line-width",
        dataLayerVisible ? boundary.dataWidth : boundary.plainWidth
      );
      map.setPaintProperty(
        boundary.id,
        "line-opacity",
        dataLayerVisible ? 0.9 : 1
      );
    });
  }

  function renderDataLayer() {
    if (!dataReady || !map) return;

    var layerChanged = renderedLayer !== activeMapLayer;
    var epochChanged = renderedEpoch !== activeEpoch;
    var ghslChanged = renderedGhslStop !== activeGhslStop;

    if (epochChanged) {
      renderedEpoch = activeEpoch;
      map.setPaintProperty(
        "census-fill",
        "fill-color",
        clayExpression(activeEpoch)
      );
    }

    if (layerChanged) {
      renderedLayer = activeMapLayer;
      map.setPaintProperty(
        "census-fill",
        "fill-opacity",
        activeMapLayer === "census" ? 1 : 0
      );
      map.setLayoutProperty(
        "height-carpet",
        "visibility",
        activeMapLayer === "heights" ? "visible" : "none"
      );
      map.setPaintProperty(
        "street-tree-texture",
        "circle-opacity",
        activeMapLayer === "green" ? 0.7 : 0
      );
      map.setPaintProperty(
        "green-fill",
        "fill-opacity",
        activeMapLayer === "green" ? 0.6 : 0
      );
      map.setPaintProperty(
        "green-line",
        "line-opacity",
        activeMapLayer === "green" ? 1 : 0
      );
    }

    if (ghslChanged) {
      renderedGhslStop = activeGhslStop;
    }
    if (layerChanged || ghslChanged) {
      GHSL_YEARS.forEach(function (year) {
        map.setPaintProperty(
          "ghsl-" + year,
          "fill-opacity",
          activeMapLayer === "satellite" && year <= activeGhslStop ? 1 : 0
        );
      });
    }

    if (layerChanged) {
      setBoundaryStyle(activeMapLayer !== "footprints");
    }
    if (activeMapLayer !== "census") hideTooltip();
  }

  function setLegend(layer, title, colors, breaks, description) {
    legend.dataset.layer = layer;
    legendTitle.textContent = title;
    legendDescription.textContent = description;
    legendSwatches.replaceChildren();
    legendBreaks.replaceChildren();
    legend.style.setProperty("--legend-steps", colors.length);
    colors.forEach(function (color) {
      var swatch = document.createElement("span");
      swatch.style.backgroundColor = color;
      legendSwatches.appendChild(swatch);
    });
    breaks.forEach(function (label) {
      var item = document.createElement("span");
      item.textContent = label;
      legendBreaks.appendChild(item);
    });
    legend.hidden = false;
  }

  function showCensusLegend() {
    setLegend(
      "census",
      "Built " + EPOCHS[activeEpoch].label,
      CLAY_RAMP,
      ["0–<5", "5–<15", "15–<25", "25–<35", "35–<50", "50–100%"],
      "Share of buildings standing at the 2021 census"
    );
  }

  function showGhslLegend() {
    setLegend(
      "satellite",
      "Built-up land · by " + activeGhslStop,
      GHSL_RAMP,
      ["1975", "1990", "2005", "2020"],
      "Cumulative built-up land: all earlier bands remain visible"
    );
  }

  function showHeightsLegend() {
    setLegend(
      "heights",
      "Building height",
      HEIGHT_RAMP,
      [
        "0–3 m\n≈1 storey",
        "3–9 m\n≈2–3 storeys",
        "9–15 m\n≈4–5 storeys",
        "15–21 m\n≈6–7 storeys",
        "21+ m\n≈7+ storeys"
      ],
      "Urban Atlas 2012 · 10 m cells · height above ground"
    );
  }

  function showGreenLegend() {
    setLegend(
      "green",
      "Green urban areas",
      ["#7A9367"],
      ["Class 14100"],
      "Urban Atlas 2018 · areas under 0.25 ha are not mapped"
    );
  }

  function showFootprintsLegend() {
    setLegend(
      "footprints",
      "Building footprints",
      ["#6E6862"],
      ["Present day"],
      "OpenStreetMap · no individual construction date"
    );
  }

  function updateLegend() {
    if (activeMapLayer === "census") {
      showCensusLegend();
    } else if (activeMapLayer === "heights") {
      showHeightsLegend();
    } else if (activeMapLayer === "satellite") {
      showGhslLegend();
    } else if (activeMapLayer === "green") {
      showGreenLegend();
    } else if (activeMapLayer === "footprints" && currentChapter === "10") {
      showFootprintsLegend();
    } else {
      legend.hidden = true;
    }
  }

  function syncEpochAvailability() {
    var available = activeMapLayer === "census";
    epochSelect.disabled = !available;
    epochSelect.setAttribute("aria-disabled", available ? "false" : "true");
  }

  function setActiveLayer(layer) {
    var alreadyRendered =
      activeMapLayer === layer && renderedLayer === layer && dataReady;
    activeMapLayer = layer;
    syncEpochAvailability();
    if (alreadyRendered) {
      if (layer === "footprints") updateLegend();
      return;
    }
    updateLegend();
    renderDataLayer();
  }

  function setCensusEpoch(property) {
    if (!EPOCHS[property]) return;
    if (activeEpoch === property) return;
    activeEpoch = property;
    if (activeMapLayer === "census") showCensusLegend();
    renderDataLayer();
  }

  function setGhslStop(year) {
    if (activeGhslStop === year) return;
    activeGhslStop = year;
    if (activeMapLayer === "satellite") showGhslLegend();
    renderDataLayer();
  }

  function sweepIndex(progress) {
    return Math.min(2, Math.max(0, Math.floor(progress * 3)));
  }

  function applySweep(chapter) {
    var index = sweepIndex(chapterProgress[chapter] || 0);
    if (chapter === "5") {
      var epoch = CENSUS_SWEEP[index];
      setCensusEpoch(epoch);
      var censusChip = "05 / 10 · " + EPOCHS[epoch].label;
      if (chip.textContent !== censusChip) chip.textContent = censusChip;
    } else if (chapter === "8") {
      var year = GHSL_SWEEP[index];
      setGhslStop(year);
      var ghslChip = "08 / 10 · Built up by " + year;
      if (chip.textContent !== ghslChip) chip.textContent = ghslChip;
    } else if (chapter === "9") {
      if ((chapterProgress[chapter] || 0) < 0.5) {
        setCensusEpoch("p_1946_80");
        setActiveLayer("census");
        chip.textContent = "09 / 10 · 1946–1980";
      } else {
        setActiveLayer("heights");
        chip.textContent = "09 / 10 · Building height · 2012";
      }
    }
  }

  function setMapInteraction(enabled) {
    if (!map) return;
    [
      "scrollZoom",
      "boxZoom",
      "dragRotate",
      "dragPan",
      "keyboard",
      "doubleClickZoom",
      "touchZoomRotate",
      "touchPitch"
    ].forEach(function (handlerName) {
      var handler = map[handlerName];
      if (!handler) return;
      if (enabled && typeof handler.enable === "function") handler.enable();
      if (!enabled && typeof handler.disable === "function") handler.disable();
    });
    map.getContainer().setAttribute("aria-disabled", enabled ? "false" : "true");
  }

  function moveCamera(state, settle) {
    if (!mapStyleReady || !map) return;
    var options = {
      center: state.center,
      zoom: state.zoom,
      bearing: 0,
      pitch: 0,
      padding: cameraPadding()
    };
    map.stop();

    if (settle) {
      if (prefersReducedMotion) {
        options.zoom = 11.2;
        map.jumpTo(options);
      } else {
        map.jumpTo(options);
        map.easeTo({
          center: state.center,
          zoom: 11.2,
          bearing: 0,
          pitch: 0,
          padding: cameraPadding(),
          duration: 1400,
          easing: function (t) {
            return t * (2 - t);
          }
        });
      }
      return;
    }

    if (prefersReducedMotion) {
      map.jumpTo(options);
    } else {
      options.duration = 1400;
      options.essential = false;
      map.flyTo(options);
    }
  }

  function resetExploreControls() {
    epochSelect.value = "p_1946_80";
    var censusRadio = controls.querySelector(
      'input[name="layer"][value="census"]'
    );
    if (censusRadio) censusRadio.checked = true;
    activeEpoch = "p_1946_80";
    activeGhslStop = 2020;
  }

  function applyChapterMapState(chapter, move) {
    var state = CHAPTERS[chapter];
    if (!state) return;

    setGround(!!state.historic);
    setRefugeeHighlight(!!state.refugees);
    if (chapter === "5") {
      setActiveLayer(state.layer);
      applySweep("5");
    } else if (chapter === "8") {
      setActiveLayer(state.layer);
      applySweep("8");
    } else if (chapter === "9") {
      setCensusEpoch(state.epoch);
      applySweep("9");
    } else if (chapter === "10") {
      setCensusEpoch(epochSelect.value);
      var selectedLayer = controls.querySelector(
        'input[name="layer"]:checked'
      );
      setActiveLayer(selectedLayer ? selectedLayer.value : "census");
    } else {
      setActiveLayer(state.layer);
    }

    if (map) {
      if (chapter === "10") {
        map.setMaxBounds(MAX_BOUNDS);
        setMapInteraction(true);
      } else {
        map.setMaxBounds(null);
        setMapInteraction(false);
      }
    }
    if (move) moveCamera(state, chapter === "1");
  }

  function setChapterState(number, options) {
    var chapter = String(number);
    var state = CHAPTERS[chapter];
    if (!state) return;
    currentChapter = chapter;
    chip.textContent = state.chip;
    chip.hidden = chapter === "10";
    controls.hidden = chapter !== "10";
    if (chapter === "10" && options && options.resetExplore) {
      resetExploreControls();
    }

    applyChapterMapState(chapter, !options || options.moveCamera !== false);
  }

  function getEpochCount(properties, epoch) {
    if (epoch.count) return Number(properties[epoch.count]);
    if (epoch.counts) {
      return epoch.counts.reduce(function (total, property) {
        return total + (Number(properties[property]) || 0);
      }, 0);
    }
    return 0;
  }

  function showTooltip(feature, point) {
    if (!tooltip || !feature || !EPOCHS[activeEpoch]) return;
    var properties = feature.properties || {};
    var epoch = EPOCHS[activeEpoch];
    var share = Number(properties[activeEpoch]);
    var count = getEpochCount(properties, epoch);
    var total = Number(properties.total);

    var name = document.createElement("strong");
    name.textContent = properties.name_el || "Community";
    if (String(properties.code || "").indexOf("3514501") === 0) {
      name.textContent +=
        " — municipality total; no finer census geography is published";
    }
    var value = document.createElement("span");
    value.textContent =
      epoch.label + ": " + (Number.isFinite(share) ? share.toFixed(1) : "—") + "%";
    var countLine = document.createElement("span");
    countLine.textContent =
      (Number.isFinite(count) ? count.toLocaleString("en-US") : "—") +
      " buildings of " +
      (Number.isFinite(total) ? total.toLocaleString("en-US") : "—") +
      " total";
    var denominator = document.createElement("span");
    denominator.textContent = "Share of buildings standing at the 2021 census";
    tooltip.replaceChildren(name, value, countLine, denominator);

    var width = 288;
    var left = Math.min(point.x + 16, window.innerWidth - width - 16);
    var top = Math.min(point.y + 16, window.innerHeight - 150);
    tooltip.style.left = Math.max(16, left) + "px";
    tooltip.style.top = Math.max(16, top) + "px";
    tooltip.hidden = false;
  }

  function hideTooltip() {
    if (!tooltip) return;
    tooltip.hidden = true;
    tooltipPinned = false;
    if (map) map.getCanvas().style.cursor = "";
  }

  function censusFeatureAt(point) {
    if (!map || !dataReady || activeMapLayer !== "census") return null;
    var features = map.queryRenderedFeatures(point, { layers: ["census-fill"] });
    return features.length ? features[0] : null;
  }

  function bindTooltipEvents(localMap) {
    localMap.on("mousemove", function (event) {
      var feature = censusFeatureAt(event.point);
      if (feature) {
        tooltipPinned = false;
        localMap.getCanvas().style.cursor = "pointer";
        showTooltip(feature, event.point);
      } else if (!tooltipPinned) {
        hideTooltip();
      }
    });
    localMap.on("mouseleave", function () {
      if (!tooltipPinned) hideTooltip();
    });
    localMap.on("click", function (event) {
      var feature = censusFeatureAt(event.point);
      if (!feature) {
        hideTooltip();
        return;
      }
      tooltipPinned = true;
      showTooltip(feature, event.point);
    });
  }

  function resetRenderedState() {
    mapStyleReady = false;
    dataReady = false;
    renderedLayer = null;
    renderedEpoch = null;
    renderedGhslStop = null;
    renderedGround = null;
    renderedRefugees = null;
  }

  function initMap() {
    if (map || mobileQuery.matches) return;
    if (!window.maplibregl || !webglAvailable()) return;

    resetRenderedState();
    try {
      var localMap = new maplibregl.Map({
        container: "map",
        style: "map/style.json",
        center: CHAPTERS[currentChapter].center,
        zoom: CHAPTERS[currentChapter].zoom,
        bearing: 0,
        pitch: 0,
        padding: cameraPadding(),
        interactive: false,
        attributionControl: false,
        fadeDuration: prefersReducedMotion ? 0 : 300,
        maxBounds: currentChapter === "10" ? MAX_BOUNDS : undefined
      });
      map = localMap;
      bindTooltipEvents(localMap);

      localMap.on("load", function () {
        if (map !== localMap) return;
        mapStyleReady = true;
        setBaseTransitions(localMap);
        setChapterState(currentChapter, {
          moveCamera: true,
          resetExplore: false
        });

        loadMapData()
          .then(function (data) {
            if (map !== localMap) return;
            window.AthensDataLayers.add(
              localMap,
              data[0],
              data[1],
              data[2],
              data[3],
              data[4],
              data[5],
              data[6],
              {
                activeEpoch: activeEpoch,
                clayExpression: clayExpression,
                overlayTransition: overlayTransition,
                ghslYears: GHSL_YEARS,
                ghslRamp: GHSL_RAMP,
                refugeeMunicipalities: REFUGEE_MUNICIPALITIES,
                mapGround: MAP_GROUND
              }
            );
            dataReady = true;
            renderedLayer = null;
            renderedEpoch = null;
            renderedGhslStop = null;
            renderedRefugees = null;
            setChapterState(currentChapter, {
              moveCamera: false,
              resetExplore: false
            });
          })
          .catch(function (error) {
            console.warn("Map data failed to load", error);
          });
      });
    } catch (error) {
      map = null;
      console.warn("Map init failed; continuing without the live map", error);
    }
  }

  function destroyMap() {
    if (!map) return;
    hideTooltip();
    map.remove();
    map = null;
    resetRenderedState();
  }

  function syncToCurrentStep() {
    var trigger = window.innerHeight * 0.5;
    var steps = document.querySelectorAll(".step");
    for (var i = 0; i < steps.length; i += 1) {
      var rect = steps[i].getBoundingClientRect();
      if (rect.top <= trigger && rect.bottom >= trigger) {
        var chapter = steps[i].getAttribute("data-chapter");
        if (chapter === "5" || chapter === "8" || chapter === "9") {
          chapterProgress[chapter] = Math.min(
            1,
            Math.max(0, (trigger - rect.top) / rect.height)
          );
        }
        setChapterState(chapter, { moveCamera: true, resetExplore: true });
        return;
      }
    }
  }

  function initScrollama() {
    if (!window.scrollama) {
      console.warn("Scrollama not loaded");
      return;
    }
    var scroller = scrollama();
    scroller
      .setup({ step: ".step", offset: 0.5, progress: true })
      .onStepEnter(function (response) {
        setChapterState(response.element.getAttribute("data-chapter"), {
          moveCamera: true,
          resetExplore: true
        });
      })
      .onStepProgress(function (response) {
        var chapter = response.element.getAttribute("data-chapter");
        if (
          (chapter === "5" || chapter === "8" || chapter === "9") &&
          currentChapter === chapter
        ) {
          chapterProgress[chapter] = response.progress;
          applySweep(chapter);
        }
      })
      .onStepExit(function (response) {
        if (
          response.element.getAttribute("data-chapter") === "10" &&
          response.direction === "up"
        ) {
          setMapInteraction(false);
        }
      });
    window.addEventListener("resize", scroller.resize);
    syncToCurrentStep();
  }

  function onLayoutModeChange() {
    var section = document.getElementById("chapter-" + currentChapter);
    if (mobileQuery.matches) {
      destroyMap();
    } else {
      initMap();
    }
    if (section) section.scrollIntoView({ block: "center" });
  }

  controls.addEventListener("change", function (event) {
    if (currentChapter !== "10") return;
    if (event.target === epochSelect) {
      setCensusEpoch(epochSelect.value);
      return;
    }
    if (event.target.name === "layer") {
      setActiveLayer(event.target.value);
    }
  });

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", onLayoutModeChange);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(onLayoutModeChange);
  }

  initScrollama();
  initMap();
})();
