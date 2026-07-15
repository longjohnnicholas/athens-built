(function () {
  "use strict";

  var risePlayed = false;
  var orbitPaused = false;

  function create(options) {
    var map = options.map;
    var riseFrame = null;
    var orbitFrame = null;
    var orbitLastTime = null;
    var waitingForMove = false;
    var destroyed = false;

    function chapterAtTrigger() {
      var rect = options.chapterElement.getBoundingClientRect();
      var trigger = window.innerHeight * 0.5;
      return rect.top <= trigger && rect.bottom >= trigger;
    }

    function openingIsActive() {
      return !destroyed && options.openingIsActive() && chapterAtTrigger();
    }

    function setHandler(handler, enabled) {
      if (!handler) return;
      var method = enabled ? "enable" : "disable";
      if (typeof handler[method] === "function") handler[method]();
    }

    function setInteraction(mode) {
      var explore = mode === "explore";
      var opening = mode === "opening" && !options.reducedMotion;
      var allowKeyboard = explore || opening;
      var allow3d = allowKeyboard && options.is3d();

      ["scrollZoom", "boxZoom", "dragPan", "doubleClickZoom"].forEach(
        function (handlerName) {
          setHandler(map[handlerName], explore);
        }
      );
      setHandler(map.keyboard, allowKeyboard);
      if (map.keyboard) {
        if (allow3d && typeof map.keyboard.enableRotation === "function") {
          map.keyboard.enableRotation();
        } else if (typeof map.keyboard.disableRotation === "function") {
          map.keyboard.disableRotation();
        }
      }
      ["dragRotate", "touchPitch"].forEach(function (handlerName) {
        setHandler(map[handlerName], allow3d);
      });
      if (map.touchZoomRotate) {
        setHandler(map.touchZoomRotate, allowKeyboard);
        if (
          allow3d &&
          typeof map.touchZoomRotate.enableRotation === "function"
        ) {
          map.touchZoomRotate.enableRotation();
        } else if (
          typeof map.touchZoomRotate.disableRotation === "function"
        ) {
          map.touchZoomRotate.disableRotation();
        }
      }
      map.getContainer().setAttribute(
        "aria-disabled",
        allowKeyboard ? "false" : "true"
      );
    }

    function setHeightMultiplier(multiplier) {
      if (!map.getLayer(options.layerId)) return;
      map.setPaintProperty(options.layerId, "fill-extrusion-height", [
        "*",
        ["get", "h"],
        options.exaggeration * multiplier
      ]);
    }

    function finishRise() {
      if (riseFrame !== null) cancelAnimationFrame(riseFrame);
      riseFrame = null;
      setHeightMultiplier(1);
    }

    function startRise() {
      if (options.reducedMotion || risePlayed) return;
      risePlayed = true;
      setHeightMultiplier(0);
      var startedAt = null;

      function rise(timestamp) {
        if (!openingIsActive()) {
          finishRise();
          return;
        }
        if (startedAt === null) startedAt = timestamp;
        var progress = Math.min(
          1,
          (timestamp - startedAt) / options.riseDuration
        );
        var eased = 1 - Math.pow(1 - progress, 2);
        setHeightMultiplier(eased);
        if (progress < 1) {
          riseFrame = requestAnimationFrame(rise);
        } else {
          riseFrame = null;
        }
      }

      riseFrame = requestAnimationFrame(rise);
    }

    function stopOrbit() {
      if (orbitFrame !== null) cancelAnimationFrame(orbitFrame);
      orbitFrame = null;
      orbitLastTime = null;
    }

    function startOrbit() {
      if (options.reducedMotion || orbitPaused || orbitFrame !== null) return;

      function orbit(timestamp) {
        if (orbitPaused || !openingIsActive()) {
          stopOrbit();
          return;
        }
        if (orbitLastTime !== null) {
          var elapsed = Math.min(64, timestamp - orbitLastTime);
          map.setBearing(
            map.getBearing() + options.orbitDegreesPerSecond * elapsed / 1000
          );
        }
        orbitLastTime = timestamp;
        orbitFrame = requestAnimationFrame(orbit);
      }

      orbitFrame = requestAnimationFrame(orbit);
    }

    function onMoveEnd() {
      waitingForMove = false;
      start();
    }

    function start() {
      if (
        options.reducedMotion || !openingIsActive() ||
        !map.getLayer(options.layerId)
      ) return;
      if (map.isMoving()) {
        if (waitingForMove) return;
        waitingForMove = true;
        map.once("moveend", onMoveEnd);
        return;
      }
      startRise();
      startOrbit();
    }

    function leave() {
      if (waitingForMove) map.off("moveend", onMoveEnd);
      waitingForMove = false;
      stopOrbit();
      if (risePlayed) finishRise();
    }

    function pauseOrbit() {
      if (orbitPaused || !openingIsActive()) return;
      orbitPaused = true;
      stopOrbit();
    }

    function destroy() {
      leave();
      destroyed = true;
      window.removeEventListener("pointerdown", pauseOrbit);
      window.removeEventListener("touchstart", pauseOrbit);
      window.removeEventListener("wheel", pauseOrbit);
      window.removeEventListener("keydown", pauseOrbit);
    }

    window.addEventListener("pointerdown", pauseOrbit, { passive: true });
    window.addEventListener("touchstart", pauseOrbit, { passive: true });
    window.addEventListener("wheel", pauseOrbit, { passive: true });
    window.addEventListener("keydown", pauseOrbit);

    return {
      destroy: destroy,
      leave: leave,
      setInteraction: setInteraction,
      start: start
    };
  }

  window.AthensHeightView = { create: create };
})();
