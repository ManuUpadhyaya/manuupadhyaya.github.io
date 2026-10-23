import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const kinds = [
  { name: "contraction", prefix: "lc" },
  { name: "multipliers", prefix: "lm" },
  { name: "memory", prefix: "memory" },
];

async function loadRenderer(name) {
  const file = new URL(`../assets/js/lyapunov-${name}.js`, import.meta.url);
  const source = (await readFile(file, "utf8")).replace(/from "(\.\/[^\"]+)"/g, (_, dependency) => `from "${new URL(dependency, file)}"`);
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

function figureFor(prefix) {
  const nodes = new Map();
  const controls = [0.5, 3, 1].map((value, index) => ({
    dataset: { [`${prefix}Control`]: ["epsilon", "L", "mu"][index] },
    defaultValue: String(value),
    value: String(value),
    disabled: true,
    setAttribute() {},
    removeAttribute() {},
  }));
  return {
    dataset: { lcUrl: "data.json", lmUrl: "data.json", memoryUrl: "data.json" },
    controls,
    querySelector(selector) {
      if (!nodes.has(selector)) nodes.set(selector, { hidden: false, textContent: "", setAttribute() {}, removeAttribute() {} });
      return nodes.get(selector);
    },
    querySelectorAll(selector) {
      if (selector.includes("-control]")) return controls;
      return [];
    },
  };
}

for (const { name, prefix } of kinds) {
  test(`${name}: lazy bootstrap preserves loading until activation, then module failure exposes the fallback`, async () => {
    const template = await readFile(new URL(`../_includes/lyapunov-${name}-figure.liquid`, import.meta.url), "utf8");
    const source = [...template.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1];
    const figure = figureFor(prefix);
    let onIntersection;
    const context = vm.createContext({
      document: { getElementById: () => figure },
      window: { IntersectionObserver: true },
      IntersectionObserver: class {
        constructor(callback) {
          onIntersection = callback;
        }
        observe() {}
        disconnect() {}
      },
    });
    const script = new vm.Script(source, {
      importModuleDynamically() {
        throw new Error("Module blocked");
      },
    });
    script.runInContext(context);
    assert.equal(figure.dataset.lcState, "pending");
    onIntersection([{ isIntersecting: false }]);
    assert.equal(figure.dataset.lcState, "pending");
    onIntersection([{ isIntersecting: true }]);
    await new Promise(setImmediate);
    assert.equal(figure.dataset.lcState, "unavailable");
    assert.ok(figure.controls.every((control) => control.disabled));
  });

  for (const failure of ["network", "invalid data"]) {
    test(`${name}: ${failure} failure after pending activates static mode with disabled default controls`, async (t) => {
      const { enhanceFigure } = await loadRenderer(name);
      const figure = figureFor(prefix);
      figure.dataset.lcState = "pending";
      t.mock.method(globalThis, "fetch", async () => {
        if (failure === "network") throw new Error("Offline");
        return { ok: true, json: async () => ({}) };
      });
      t.mock.method(console, "warn", () => {});
      await enhanceFigure(figure);
      assert.equal(figure.dataset.lcState, "unavailable");
      assert.ok(figure.controls.every((control) => control.disabled));
      assert.deepEqual(
        figure.controls.map((control) => control.value),
        ["0.5", "3", "1"]
      );
    });
  }

  test(`${name}: an already ready figure is not reinitialized`, async (t) => {
    const { enhanceFigure } = await loadRenderer(name);
    const figure = figureFor(prefix);
    figure.dataset.lcState = "ready";
    figure.dataset.memoryState = "ready";
    const fetch = t.mock.method(globalThis, "fetch", async () => {
      throw new Error("Unexpected reload");
    });
    await enhanceFigure(figure);
    assert.equal(fetch.mock.calls.length, 0);
    assert.equal(figure.dataset.lcState, "ready");
  });
}
