(function () {
  "use strict";

  function addDataLayers(
    localMap,
    communities,
    municipalities,
    attica,
    ghsl,
    green,
    heightBounds,
    streetTrees,
    extent1894,
    config
  ) {
    var activeEpoch = config.activeEpoch;
    var clayExpression = config.clayExpression;
    var overlayTransition = config.overlayTransition;
    var ghslYears = config.ghslYears;
    var ghslRamp = config.ghslRamp;
    var refugeeMunicipalities = config.refugeeMunicipalities;
    var mapGround = config.mapGround;
    localMap.addSource("community-epochs", {
      type: "geojson",
      data: communities
    });
    localMap.addSource("municipal-outlines", {
      type: "geojson",
      data: municipalities
    });
    localMap.addSource("attica-outline", { type: "geojson", data: attica });
    localMap.addSource("ghsl-bands", { type: "geojson", data: ghsl });
    localMap.addSource("green-areas", { type: "geojson", data: green });
    localMap.addSource("street-trees", { type: "geojson", data: streetTrees });
    localMap.addSource("extent-1894", { type: "geojson", data: extent1894 });
    localMap.addSource("height-carpet", {
      type: "image",
      url: "data/heights_10m.png",
      coordinates: heightBounds.coordinates
    });

    var beforeRoads = "road-secondary";
    localMap.addLayer(
      {
        id: "street-tree-texture",
        type: "circle",
        source: "street-trees",
        minzoom: 8.5,
        maxzoom: 15,
        paint: {
          "circle-color": "#4F7A3D",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 0.45, 14, 1.15],
          "circle-opacity": 0,
          "circle-opacity-transition": overlayTransition()
        }
      },
      beforeRoads
    );
    localMap.addLayer(
      {
        id: "green-fill",
        type: "fill",
        source: "green-areas",
        minzoom: 8.5,
        maxzoom: 15,
        paint: {
          "fill-color": "#7A9367",
          "fill-opacity": 0,
          "fill-opacity-transition": overlayTransition()
        }
      },
      beforeRoads
    );
    localMap.addLayer(
      {
        id: "green-line",
        type: "line",
        source: "green-areas",
        minzoom: 8.5,
        maxzoom: 15,
        paint: {
          "line-color": "#4F7A3D",
          "line-width": 0.5,
          "line-opacity": 0,
          "line-opacity-transition": overlayTransition()
        }
      },
      beforeRoads
    );
    localMap.addLayer(
      {
        id: "height-carpet",
        type: "raster",
        source: "height-carpet",
        minzoom: 8.5,
        maxzoom: 15,
        layout: { visibility: "none" },
        paint: {
          "raster-opacity": 1,
          "raster-resampling": "nearest"
        }
      },
      beforeRoads
    );
    localMap.addLayer(
      {
        id: "census-fill",
        type: "fill",
        source: "community-epochs",
        minzoom: 8.5,
        maxzoom: 15,
        paint: {
          "fill-color": clayExpression(activeEpoch),
          "fill-opacity": 0,
          "fill-color-transition": overlayTransition(),
          "fill-opacity-transition": overlayTransition()
        }
      },
      beforeRoads
    );

    // The source geometries are nested and cumulative. Newer extents sit
    // below older ones so first-built land retains its lighter epoch color.
    ghslYears.slice()
      .reverse()
      .forEach(function (year) {
        var index = ghslYears.indexOf(year);
        localMap.addLayer(
          {
            id: "ghsl-" + year,
            type: "fill",
            source: "ghsl-bands",
            minzoom: 8.5,
            maxzoom: 15,
            filter: ["==", ["get", "by_year"], year],
            paint: {
              "fill-color": ghslRamp[index],
              "fill-opacity": 0,
              "fill-opacity-transition": overlayTransition()
            }
          },
          beforeRoads
        );
      });

    localMap.addLayer(
      {
        id: "extent-1894-fill",
        type: "fill",
        source: "extent-1894",
        paint: {
          "fill-color": "#B9B4AA",
          "fill-opacity": 0,
          "fill-opacity-transition": overlayTransition()
        }
      },
      beforeRoads
    );
    localMap.addLayer(
      {
        id: "extent-1894-line",
        type: "line",
        source: "extent-1894",
        paint: {
          "line-color": "#57534A",
          "line-width": 1,
          "line-opacity": 0,
          "line-opacity-transition": overlayTransition()
        }
      },
      beforeRoads
    );

    localMap.addLayer(
      {
        id: "community-boundaries",
        type: "line",
        source: "community-epochs",
        minzoom: 8.5,
        maxzoom: 15,
        paint: {
          "line-color": "#8F8A83",
          "line-width": 0.6,
          "line-opacity": 1,
          "line-color-transition": overlayTransition(),
          "line-width-transition": overlayTransition()
        }
      },
      beforeRoads
    );

    localMap.addLayer(
      {
        id: "municipal-boundaries",
        type: "line",
        source: "municipal-outlines",
        minzoom: 8.5,
        maxzoom: 15,
        paint: {
          "line-color": "#8F8A83",
          "line-width": 0.9,
          "line-opacity": 1,
          "line-color-transition": overlayTransition(),
          "line-width-transition": overlayTransition()
        }
      },
      beforeRoads
    );

    localMap.addLayer(
      {
        id: "attica-outline",
        type: "line",
        source: "attica-outline",
        paint: {
          "line-color": "#8F8A83",
          "line-width": 1,
          "line-opacity": 1
        }
      },
      beforeRoads
    );

    var refugeeFilter = [
      "in",
      ["get", "name_el"],
      ["literal", refugeeMunicipalities]
    ];
    localMap.addLayer({
      id: "refugee-fill",
      type: "fill",
      source: "municipal-outlines",
      filter: refugeeFilter,
      paint: {
        "fill-color": "#9C552B",
        "fill-opacity": 0,
        "fill-opacity-transition": overlayTransition()
      }
    });
    localMap.addLayer({
      id: "refugee-line",
      type: "line",
      source: "municipal-outlines",
      filter: refugeeFilter,
      paint: {
        "line-color": "#9C552B",
        "line-width": 2,
        "line-opacity": 0,
        "line-opacity-transition": overlayTransition()
      }
    });
    localMap.addLayer({
      id: "refugee-labels",
      type: "symbol",
      source: "municipal-outlines",
      filter: refugeeFilter,
      layout: {
        visibility: "none",
        "text-field": ["get", "name_el"],
        "text-font": ["Commissioner SemiBold"],
        "text-size": 11,
        "text-max-width": 11,
        "text-padding": 8
      },
      paint: {
        "text-color": "#9C552B",
        "text-halo-color": mapGround,
        "text-halo-width": 1
      }
    });
  }

  window.AthensDataLayers = { add: addDataLayers };
})();
