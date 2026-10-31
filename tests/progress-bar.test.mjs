import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function loadProgressBar({ resizeObserver = true, navbarHeight = 59 } = {}) {
  const windowEvents = new EventTarget();
  const documentEvents = new EventTarget();
  const observations = new Map();
  const attributes = new Map();
  const progress = { style: {}, setAttribute: (name, value) => attributes.set(name, String(value)) };
  const navbar = { offsetHeight: navbarHeight };
  const document = {
    body: { scrollHeight: 2000, style: {} },
    documentElement: { scrollHeight: 2000 },
    getElementById: (id) => (id === "progress" ? progress : id === "navbar" ? navbar : null),
    createElement: () => ({ max: 1 }),
    querySelectorAll: () => [],
    addEventListener: documentEvents.addEventListener.bind(documentEvents),
  };
  const window = {
    scrollY: 0,
    innerHeight: 1000,
    getComputedStyle: () => ({ marginTop: "0px", marginBottom: "0px" }),
    addEventListener: windowEvents.addEventListener.bind(windowEvents),
  };
  const context = {
    document,
    window,
    setTimeout: (callback) => callback(),
  };
  if (resizeObserver) {
    context.ResizeObserver = window.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
      }
      observe(element) {
        observations.set(element, this.callback);
      }
    };
  }
  vm.runInNewContext(readFileSync(new URL("../assets/js/progress-bar.js", import.meta.url), "utf8"), context);
  windowEvents.dispatchEvent(new Event("load"));
  return {
    attributes,
    document,
    progress,
    resizeNavbar(height) {
      navbar.offsetHeight = height;
      observations.get(navbar)?.([{ target: navbar }]);
    },
    resizeWindow(height) {
      navbar.offsetHeight = height;
      windowEvents.dispatchEvent(new Event("resize"));
    },
    resizeContent(height) {
      document.body.scrollHeight = document.documentElement.scrollHeight = height;
      observations.get(document.body)?.([{ target: document.body }]);
    },
    scroll(height, position) {
      document.body.scrollHeight = document.documentElement.scrollHeight = height;
      window.scrollY = position;
      documentEvents.dispatchEvent(new Event("scroll"));
    },
  };
}

test("reading progress uses the expanded document height on the next scroll", () => {
  const { attributes, scroll } = loadProgressBar();
  scroll(6000, 1500);
  assert.equal(attributes.get("max"), "5000");
  assert.equal(attributes.get("value"), "1500");
});

test("reading progress reaches the new bottom after content collapses", () => {
  const { attributes, scroll } = loadProgressBar();
  scroll(1500, 500);
  assert.equal(attributes.get("max"), "500");
  assert.equal(attributes.get("value"), "500");
});

test("scroll updates preserve the page padding", () => {
  const { document, scroll } = loadProgressBar();
  document.body.style.paddingTop = "71px";
  scroll(6000, 1500);
  assert.equal(document.body.style.paddingTop, "71px");
});

test("opening and closing content updates stationary reading progress", () => {
  const { attributes, scroll, resizeContent } = loadProgressBar();
  scroll(2000, 500);
  resizeContent(6000);
  assert.equal(attributes.get("max"), "5000");
  assert.equal(attributes.get("value"), "500");
  resizeContent(1500);
  assert.equal(attributes.get("max"), "500");
  assert.equal(attributes.get("value"), "500");
});

test("delayed content sizing updates progress without scrolling", async () => {
  const { attributes, resizeContent } = loadProgressBar();
  await Promise.resolve();
  resizeContent(4000);
  assert.equal(attributes.get("max"), "3000");
  assert.equal(attributes.get("value"), "0");
});

test("repeated content-size notifications preserve page padding", () => {
  const { document, resizeContent } = loadProgressBar();
  document.body.style.paddingTop = "71px";
  resizeContent(6000);
  resizeContent(6000);
  assert.equal(document.body.style.paddingTop, "71px");
});

test("browsers without ResizeObserver refresh progress when scrolling", () => {
  const { attributes, scroll } = loadProgressBar({ resizeObserver: false });
  scroll(6000, 1500);
  assert.equal(attributes.get("max"), "5000");
  assert.equal(attributes.get("value"), "1500");
});

test("reading progress setup leaves the reserved content clearance to CSS", () => {
  const { document, progress } = loadProgressBar();
  assert.equal(document.body.style.paddingTop, undefined);
  assert.equal(progress.style.top, "59px");
});

test("an expanded navbar moves the progress indicator without moving the page", () => {
  const { document, progress, resizeNavbar } = loadProgressBar();
  document.body.style.paddingTop = "59px";
  resizeNavbar(300);
  assert.equal(progress.style.top, "300px");
  assert.equal(document.body.style.paddingTop, "59px");
  resizeNavbar(59);
  assert.equal(progress.style.top, "59px");
  assert.equal(document.body.style.paddingTop, "59px");
});

test("window resizing repositions reading progress without overwriting content clearance", () => {
  const { document, progress, resizeWindow } = loadProgressBar({ resizeObserver: false });
  document.body.style.paddingTop = "45px";
  resizeWindow(300);
  assert.equal(progress.style.top, "300px");
  assert.equal(document.body.style.paddingTop, "45px");
});
