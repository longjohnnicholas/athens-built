"use strict";

var assert = require("node:assert/strict");
var fs = require("node:fs");
var path = require("node:path");
var vm = require("node:vm");

var source = fs.readFileSync(
  path.join(__dirname, "..", "js", "height-view.js"),
  "utf8"
);

function createHarness(reducedMotion) {
  var animationFrames = new Map();
  var cancelledFrames = [];
  var containerListeners = new Map();
  var windowListeners = new Map();
  var nextFrame = 0;

  function handler() {
    return {
      enabled: false,
      rotationEnabled: false,
      disable: function () { this.enabled = false; },
      disableRotation: function () { this.rotationEnabled = false; },
      enable: function () { this.enabled = true; },
      enableRotation: function () { this.rotationEnabled = true; }
    };
  }

  var container = {
    attributes: {},
    style: {},
    addEventListener: function (name, callback) {
      containerListeners.set(name, callback);
    },
    removeEventListener: function (name) {
      containerListeners.delete(name);
    },
    setAttribute: function (name, value) {
      this.attributes[name] = value;
    },
    setPointerCapture: function () {}
  };
  var map = {
    bearing: -17,
    pitch: 58,
    boxZoom: handler(),
    doubleClickZoom: handler(),
    dragPan: handler(),
    dragRotate: handler(),
    keyboard: handler(),
    scrollZoom: handler(),
    touchPitch: handler(),
    touchZoomRotate: handler(),
    getBearing: function () { return this.bearing; },
    getContainer: function () { return container; },
    getLayer: function () { return {}; },
    getPitch: function () { return this.pitch; },
    isMoving: function () { return false; },
    off: function () {},
    once: function () {},
    setBearing: function (bearing) { this.bearing = bearing; },
    setPaintProperty: function () {},
    setPitch: function (pitch) { this.pitch = pitch; }
  };
  var windowObject = {
    AthensHeightView: null,
    innerHeight: 800,
    addEventListener: function (name, callback) {
      windowListeners.set(name, callback);
    },
    removeEventListener: function (name) {
      windowListeners.delete(name);
    }
  };
  var context = {
    cancelAnimationFrame: function (id) {
      cancelledFrames.push(id);
      animationFrames.delete(id);
    },
    requestAnimationFrame: function (callback) {
      nextFrame += 1;
      animationFrames.set(nextFrame, callback);
      return nextFrame;
    },
    window: windowObject
  };

  vm.runInNewContext(source, context);
  var controller = windowObject.AthensHeightView.create({
    map: map,
    chapterElement: {
      getBoundingClientRect: function () { return { top: 0, bottom: 1000 }; }
    },
    layerId: "height-extrusion",
    exaggeration: 6,
    riseDuration: 2200,
    orbitDegreesPerSecond: 3,
    reducedMotion: reducedMotion,
    is3d: function () { return true; },
    openingIsActive: function () { return true; }
  });

  return {
    animationFrames: animationFrames,
    cancelledFrames: cancelledFrames,
    container: container,
    containerListeners: containerListeners,
    controller: controller,
    map: map,
    windowListeners: windowListeners
  };
}

function runNextFrame(harness, timestamp) {
  var entry = harness.animationFrames.entries().next().value;
  assert.ok(entry, "expected an animation frame");
  harness.animationFrames.delete(entry[0]);
  entry[1](timestamp);
}

(function ordinaryPageScrollDoesNotCancelOrbit() {
  var harness = createHarness(false);
  harness.controller.start();
  runNextFrame(harness, 0);
  runNextFrame(harness, 2200);

  assert.equal(harness.windowListeners.has("wheel"), false);
  assert.equal(harness.animationFrames.size, 1, "orbit should be running");
  assert.deepEqual(harness.cancelledFrames, []);
})();

(function primaryDragRotatesAndTiltsTheOpening() {
  var harness = createHarness(false);
  harness.controller.setInteraction("opening-explore");
  harness.controller.start();
  runNextFrame(harness, 0);
  runNextFrame(harness, 2200);

  harness.containerListeners.get("pointerdown")({
    button: 0,
    clientX: 900,
    clientY: 400,
    pointerId: 1,
    pointerType: "mouse",
    preventDefault: function () {}
  });
  harness.containerListeners.get("pointermove")({
    clientX: 800,
    clientY: 340,
    pointerId: 1,
    preventDefault: function () {}
  });

  assert.notEqual(harness.map.getBearing(), -17);
  assert.notEqual(harness.map.getPitch(), 58);
  assert.equal(
    harness.map.scrollZoom.enabled,
    false,
    "page scroll should remain available in the opening Explore chapter"
  );
  assert.equal(harness.map.dragPan.enabled, false);
  assert.equal(harness.animationFrames.size, 0, "manual drag should own the view");
})();

(function reducedMotionKeepsExplorationWithoutAutoplay() {
  var harness = createHarness(true);
  harness.controller.setInteraction("opening-explore");
  harness.controller.start();

  assert.equal(harness.map.dragRotate.enabled, true);
  assert.equal(harness.map.touchPitch.enabled, true);
  assert.equal(harness.map.keyboard.enabled, true);
  assert.equal(harness.container.attributes["aria-disabled"], "false");
  assert.equal(harness.animationFrames.size, 0);
})();

console.log("height-view tests passed");
