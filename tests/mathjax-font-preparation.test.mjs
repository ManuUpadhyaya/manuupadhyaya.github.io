import assert from "node:assert/strict";
import test from "node:test";
import { prepareExactNewcmFonts } from "../assets/js/mathjax-cooperative.mjs";

const fontRoot = "https://cdn.jsdelivr.net/npm/@mathjax/mathjax-newcm-font@4.1.3/chtml/woff2";
const expectedFiles = ["zero", "n", "ds", "c", "s7", "s6", "m", "em", "s3", "lo", "so", "v"].map((name) => `mjx-ncm-${name}.woff2`);

function globals(t, values) {
  const originals = Object.fromEntries(Object.keys(values).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  t.after(() => {
    for (const key of Object.keys(values)) {
      if (originals[key]) Object.defineProperty(globalThis, key, originals[key]);
      else delete globalThis[key];
    }
  });
}

function fixture(t, { existing = [], appendError = false, taskError = false } = {}) {
  const links = [...existing];
  const frames = [];
  const tasks = [];
  const document = {
    head: {
      appendChild(link) {
        if (appendError) throw new Error("DOM unavailable");
        links.push(link);
      },
    },
    createElement(tag) {
      assert.equal(tag, "link");
      return {};
    },
    querySelectorAll() {
      return links.filter((link) => link.rel === "preload" && link.as === "font");
    },
  };
  const mathJax = {
    version: "4.1.3",
    startup: { document: { outputJax: { options: { font: "mathjax-newcm" }, font: { options: { fontURL: fontRoot } } } } },
  };
  globals(t, {
    document,
    requestAnimationFrame: (callback) => frames.push(callback),
    scheduler: { yield: () => (taskError ? Promise.reject(new Error("scheduler unavailable")) : new Promise((resolve) => tasks.push(resolve))) },
  });
  return { links, frames, tasks, document, mathJax };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

// The speculative work must remain independent of native startup completion.
test("font preparation returns immediately and waits for both frame and task boundaries", async (t) => {
  const f = fixture(t);
  let finishNative;
  const nativePromise = new Promise((resolve) => {
    finishNative = resolve;
  });
  f.mathJax.startup.promise = nativePromise;
  const before = structuredClone(f.mathJax.startup.document);
  assert.equal(prepareExactNewcmFonts(f.mathJax), true);
  assert.equal(f.frames.length, 1);
  assert.equal(f.links.length, 0);
  finishNative("native completion");
  assert.equal(await nativePromise, "native completion");
  assert.equal(f.links.length, 0);
  f.frames.shift()();
  assert.equal(f.tasks.length, 1);
  await flushMicrotasks();
  assert.equal(f.links.length, 0);
  f.tasks.shift()();
  await flushMicrotasks();
  assert.equal(f.links.length, 12);
  assert.deepEqual(f.mathJax.startup.document, before);
  assert.equal(f.mathJax.startup.promise, nativePromise);
});

test("only exact currently used pinned font URLs are requested with low priority and native CORS mode", async (t) => {
  const f = fixture(t);
  assert.equal(prepareExactNewcmFonts(f.mathJax), true);
  f.frames.shift()();
  f.tasks.shift()();
  await flushMicrotasks();
  assert.deepEqual(
    f.links.map((link) => link.href),
    expectedFiles.map((name) => `${fontRoot}/${name}`)
  );
  for (const link of f.links) {
    assert.equal(link.rel, "preload");
    assert.equal(link.as, "font");
    assert.equal(link.type, "font/woff2");
    assert.equal(link.crossOrigin, "anonymous");
    assert.equal(link.fetchPriority, "low");
  }
});

test("unknown versions, fonts, paths, and incomplete APIs preserve native behavior without scheduling work", (t) => {
  const f = fixture(t);
  for (const version of [undefined, "4.1.2", "4.1.4", "5.0.0"]) assert.equal(prepareExactNewcmFonts({ ...f.mathJax, version }), false);
  const out = f.mathJax.startup.document.outputJax;
  for (const font of [undefined, "tex", "mathjax-modern", {}]) {
    out.options.font = font;
    assert.equal(prepareExactNewcmFonts(f.mathJax), false);
  }
  out.options.font = "mathjax-newcm";
  for (const fontURL of [undefined, null, 1, {}, "", "/assets/fonts/newcm", fontRoot.replace("4.1.3", "4.1.4")]) {
    out.font.options.fontURL = fontURL;
    assert.equal(prepareExactNewcmFonts(f.mathJax), false);
  }
  assert.equal(prepareExactNewcmFonts({ version: "4.1.3" }), false);
  assert.equal(prepareExactNewcmFonts(undefined), false);
  assert.equal(f.frames.length, 0);
  assert.equal(f.links.length, 0);
});

test("repeat calls and existing matching preloads never produce duplicate requests", async (t) => {
  const existing = { rel: "preload", as: "font", href: `${fontRoot}/mjx-ncm-n.woff2` };
  const f = fixture(t, { existing: [existing] });
  assert.equal(prepareExactNewcmFonts(f.mathJax), true);
  assert.equal(prepareExactNewcmFonts(f.mathJax), true);
  assert.equal(f.frames.length, 1);
  f.frames.shift()();
  f.tasks.shift()();
  await flushMicrotasks();
  assert.equal(f.links.length, 12);
  assert.equal(f.links.filter((link) => link.href === existing.href).length, 1);
  assert.equal(prepareExactNewcmFonts(f.mathJax), true);
  assert.equal(f.frames.length, 0);
});

test("the configured bracketed NewCM alias and trailing slash resolve to the same binaries", async (t) => {
  const f = fixture(t);
  f.mathJax.startup.document.outputJax.options.font = "[mathjax-newcm]";
  f.mathJax.startup.document.outputJax.font.options.fontURL += "/";
  assert.equal(prepareExactNewcmFonts(f.mathJax), true);
  f.frames.shift()();
  f.tasks.shift()();
  await flushMicrotasks();
  assert.equal(f.links.length, 12);
});

test("unavailable browser APIs skip preparation without touching native MathJax", (t) => {
  const f = fixture(t);
  const before = structuredClone(f.mathJax);
  globalThis.requestAnimationFrame = undefined;
  assert.equal(prepareExactNewcmFonts(f.mathJax), false);
  assert.deepEqual(f.mathJax, before);
  assert.equal(f.frames.length, 0);
});

test("failed speculative DOM preparation cannot reject native completion", async (t) => {
  const f = fixture(t, { appendError: true });
  assert.equal(prepareExactNewcmFonts(f.mathJax), true);
  f.frames.shift()();
  f.tasks.shift()();
  await flushMicrotasks();
  assert.equal(f.links.length, 0);
});

test("a failed speculative scheduling task is handled independently", async (t) => {
  const f = fixture(t, { taskError: true });
  assert.equal(prepareExactNewcmFonts(f.mathJax), true);
  f.frames.shift()();
  await flushMicrotasks();
  assert.equal(f.links.length, 0);
});

test("a scheduler that throws cannot escape the deferred preparation callback", (t) => {
  const f = fixture(t);
  globalThis.scheduler.yield = () => {
    throw new Error("scheduler unavailable");
  };
  assert.equal(prepareExactNewcmFonts(f.mathJax), true);
  assert.doesNotThrow(() => f.frames.shift()());
  assert.equal(f.links.length, 0);
});
