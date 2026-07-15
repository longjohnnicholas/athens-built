(function () {
  "use strict";

  function create(options) {
    var map = options.map;
    var container = map.getContainer();
    var riseFrame = null;
    var orbitFrame = null;
    var orbitLastTime = null;
    var risePlayed = false;
    var orbitPaused = false;
    var interactionMode = "none";
    var dragState = null;
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
      var opening = mode === "opening" || mode === "opening-explore";
      var openingExplore = mode === "opening-explore";
      var allowKeyboard = explore || opening;
      var allow3d = allowKeyboard && options.is3d();
      var allowPan = explore || (openingExplore && !allow3d);
      interactionMode = mode;
      if (!opening) dragState = null;

      setHandler(map.scrollZoom, explore);
      setHandler(map.boxZoom, allowPan);
      setHandler(map.dragPan, allowPan);
      setHandler(map.doubleClickZoom, explore || openingExplore);
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
      container.style.cursor = opening && allow3d ? "grab" : "";
      container.setAttribute(
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
      if (options.reducedMotion || riseFrame !== null) return;
      if (risePlayed) {
        startOrbit();
        return;
      }
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
        var eased = progress * progress * (3 - 2 * progress);
        setHeightMultiplier(eased);
        if (progress < 1) {
          riseFrame = requestAnimationFrame(rise);
        } else {
          riseFrame = null;
          startOrbit();
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
    }

    function leave() {
      if (waitingForMove) map.off("moveend", onMoveEnd);
      waitingForMove = false;
      stopOrbit();
      if (risePlayed) finishRise();
      orbitPaused = false;
      dragState = null;
      container.style.cursor = "";
    }

    function pauseOrbit() {
      if (orbitPaused || !openingIsActive()) return;
      orbitPaused = true;
      stopOrbit();
    }

    function beginPrimaryDrag(event) {
      if (
        (interactionMode !== "opening" &&
          interactionMode !== "opening-explore") ||
        !openingIsActive() ||
        !options.is3d() || event.button !== 0 || event.pointerType === "touch"
      ) return;
      pauseOrbit();
      dragState = {
        bearing: map.getBearing(),
        pitch: map.getPitch(),
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY
      };
      container.style.cursor = "grabbing";
      if (typeof container.setPointerCapture === "function") {
        container.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
    }

    function movePrimaryDrag(event) {
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      var deltaX = event.clientX - dragState.x;
      var deltaY = event.clientY - dragState.y;
      map.setBearing(dragState.bearing + deltaX * 0.22);
      map.setPitch(Math.max(20, Math.min(75, dragState.pitch - deltaY * 0.18)));
      event.preventDefault();
    }

    function endPrimaryDrag(event) {
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      dragState = null;
      container.style.cursor =
        interactionMode === "opening" || interactionMode === "opening-explore" ?
          "grab" : "";
    }

    function onMapKeydown() {
      if (
        interactionMode === "opening" ||
        interactionMode === "opening-explore"
      ) pauseOrbit();
    }

    function destroy() {
      leave();
      destroyed = true;
      container.removeEventListener("pointerdown", beginPrimaryDrag);
      container.removeEventListener("pointermove", movePrimaryDrag);
      container.removeEventListener("pointerup", endPrimaryDrag);
      container.removeEventListener("pointercancel", endPrimaryDrag);
      container.removeEventListener("keydown", onMapKeydown);
    }

    container.addEventListener("pointerdown", beginPrimaryDrag);
    container.addEventListener("pointermove", movePrimaryDrag);
    container.addEventListener("pointerup", endPrimaryDrag);
    container.addEventListener("pointercancel", endPrimaryDrag);
    container.addEventListener("keydown", onMapKeydown);

    return {
      destroy: destroy,
      leave: leave,
      setInteraction: setInteraction,
      start: start
    };
  }

  window.AthensHeightView = { create: create };
})();
