"use strict";

var assert = require("node:assert/strict");
var fs = require("node:fs");
var path = require("node:path");

var html = fs.readFileSync(
  path.join(__dirname, "..", "index.html"),
  "utf8"
);
var chapters = fs.readFileSync(
  path.join(__dirname, "..", "content", "chapters.md"),
  "utf8"
);
var main = fs.readFileSync(
  path.join(__dirname, "..", "js", "main.js"),
  "utf8"
);
var css = fs.readFileSync(
  path.join(__dirname, "..", "css", "site.css"),
  "utf8"
);

var requiredHeightCopy =
  "The height is the law and the arithmetic. The sameness of the look is " +
  "something else, and here the ordinary hunch is right: it was taste, and " +
  "the trade. No rule said the balconies must run flat across the front, or " +
  "the top floor must step back, or the frame must be left as bare concrete. " +
  "That was simply the language of the age, built with the one cheap " +
  "technology everyone shared and repeated by thousands of small contractors " +
  "with barely an architect among them. The law made the buildings the same " +
  "height; taste and the concrete made them look like siblings.";
var requiredStreetCopy =
  "The rule never measured every street and handed each one its own height. " +
  "It sorted streets into a few broad bands, set a ceiling for each, and in " +
  "the crowded core set one ceiling for almost everyone — so the same height " +
  "never needed the same street, only a street wide enough to reach the same " +
  "rung. And because antiparochi paid the landowner and the builder alike in " +
  "finished flats, both wanted every centimetre the ceiling allowed. A limit " +
  "that comes in a few coarse steps, and a reason for everyone to touch it, " +
  "is enough to level a whole basin to one height.";

var sections = Array.from(
  html.matchAll(
    /<section class="step prose[^>]*id="chapter-(\d+)" data-chapter="(\d+)"/g
  )
);

assert.equal(sections.length, 10);
sections.forEach(function (section, index) {
  var expected = String(index + 1);
  assert.equal(section[1], expected);
  assert.equal(section[2], expected);
});

assert.match(html, /01 \/ 10<\/span><span>Athens today<\/span>/);
assert.match(html, /10 \/ 10<\/span><span>Explore<\/span>/);
assert.match(html, /id="map-interaction-hint"/);
assert.match(html, /value="heights3d" checked/);
assert.doesNotMatch(html, /value="census" checked/);
assert.match(html, /fact-panel--range/);
assert.match(html, /diagram--map-overlay/);
assert.match(html, /From an owner’s plot to a finished block/);
assert.match(css, /\.fact-panel--range \.fact-panel__figure/);
assert.match(css, /\.step\.is-active \.diagram--map-overlay/);
assert.match(
  main,
  /controls\.hidden = chapter !== "1" && chapter !== "10"/
);
assert.match(
  main,
  /currentChapter !== "1" && currentChapter !== "10"/
);

[html, chapters].forEach(function (text) {
  assert.ok(text.includes(requiredHeightCopy));
  assert.ok(text.includes(requiredStreetCopy));
});

console.log("chapter order and required copy tests passed");
