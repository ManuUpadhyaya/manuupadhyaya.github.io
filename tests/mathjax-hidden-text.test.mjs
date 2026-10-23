import assert from "node:assert/strict";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { installHiddenMathTextMeasurement } from "../assets/js/mathjax-cooperative.mjs";

class Element {
  constructor(tag = "span") {
    this.tag = tag;
    this.style = {};
    this.children = [];
    this.parentNode = null;
    this.textContent = "";
  }
  appendChild(node) {
    this.children.push(node);
    node.parentNode = this;
    return node;
  }
  remove() {
    if (this.parentNode) this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1);
    this.parentNode = null;
  }
  cloneNode(deep = true) {
    const clone = new Element(this.tag);
    clone.style = { ...this.style };
    clone.textContent = this.textContent;
    if (deep) for (const child of this.children) clone.appendChild(child.cloneNode());
    return clone;
  }
  getClientRects() {
    for (let parent = this; parent; parent = parent.parentNode) if (parent.hidden) return [];
    return [{}];
  }
}

function fixture(t, { hidden = true, measureError = false } = {}) {
  const originalGlobals = Object.fromEntries(["document", "getComputedStyle"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const body = new Element("body");
  const parent = body.appendChild(new Element());
  parent.hidden = hidden;
  const start = parent.appendChild(new Element("text"));
  const text = new Element("mjx-utext");
  text.textContent = "max";
  text.style.fontFamily = "MJXZERO, Roboto";
  const computed = {
    fontWeight: "300",
    fontStyle: "italic",
    fontFamily: "Roboto",
    letterSpacing: "0.032px",
    wordSpacing: "0px",
    textTransform: "none",
    fontVariant: "normal",
  };
  const created = [];
  const document = {
    body,
    createElement(tag) {
      const node = new Element(tag);
      created.push(node);
      return node;
    },
  };
  Object.defineProperty(globalThis, "document", { configurable: true, value: document });
  Object.defineProperty(globalThis, "getComputedStyle", { configurable: true, value: () => computed });
  t.after(() => {
    for (const [key, descriptor] of Object.entries(originalGlobals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const calls = [];
  const adaptor = {
    parent: (node) => node.parentNode,
    clone: (node) => node.cloneNode(),
    getStyle: (node, name) => node.style[name] || node.style.fontFamily || "",
    setStyle: (node, name, value) => {
      node.style[name] = value;
    },
    append: (parent, child) => parent.appendChild(child),
    nodeSize(node, em) {
      if (measureError) throw new Error("measurement failed");
      assert.ok(node.getClientRects().length, "measurement must have a layout box");
      return [(node.textContent.length * 8) / em, 1];
    },
  };
  const output = {
    name: "CHTML",
    adaptor,
    unknownCache: new Map(),
    math: { start: { node: start }, metrics: { em: 16 } },
    container: new Element("mjx-container"),
    fixed: (value) => String(value),
    html(tag, attributes, children) {
      const node = new Element(tag);
      Object.assign(node, attributes);
      for (const child of children) node.appendChild(child);
      return node;
    },
    measureTextNode(...args) {
      calls.push({ receiver: this, args });
      return { w: parent.getClientRects().length ? 1.5 : 0, h: 0.75, d: 0.2 };
    },
  };
  output.container.appendChild(new Element("existing-math"));
  const mathJax = { version: "4.1.3", startup: { document: { outputJax: output } } };
  return { body, parent, start, text, computed, created, output, mathJax, calls };
}

test("visible text delegates to the exact native method without adding DOM", (t) => {
  const f = fixture(t, { hidden: false });
  const native = f.output.measureTextNode;
  assert.equal(installHiddenMathTextMeasurement(f.mathJax), true);
  const result = f.output.measureTextNode(f.text, "unchanged argument");
  assert.deepEqual(result, { w: 1.5, h: 0.75, d: 0.2 });
  assert.deepEqual(f.calls, [{ receiver: f.output, args: [f.text, "unchanged argument"] }]);
  assert.equal(f.created.length, 0);
  assert.notEqual(f.output.measureTextNode, native);
});

test("hidden text preserves inherited styles and native metrics without moving original math", (t) => {
  const f = fixture(t);
  assert.equal(installHiddenMathTextMeasurement(f.mathJax), true);
  assert.deepEqual(f.output.measureTextNode(f.text), { w: 1.5, h: 0.75, d: 0.2 });
  assert.equal(f.calls.length, 0);
  assert.equal(f.body.children.length, 1);
  assert.equal(f.output.math.start.node, f.start);
  assert.equal(f.start.parentNode, f.parent);
  assert.equal(f.output.container.children.length, 1);
  assert.equal(f.text.style.fontFamily, "MJXZERO, Roboto");
  const host = f.created[0];
  assert.equal(host.style.visibility, "hidden");
  assert.equal(host.style.position, "absolute");
  assert.equal(host.style.left, "-100000px");
  for (const [key, value] of Object.entries(f.computed)) assert.equal(host.style[key], value);
  const measurement = host.children[0].children[0];
  assert.equal(measurement.style["font-size"], "16px");
  assert.equal(measurement.children[0].style["font-family"], "Roboto");
});

test("measurement failures remove the offscreen host without changing the original container", (t) => {
  const f = fixture(t, { measureError: true });
  installHiddenMathTextMeasurement(f.mathJax);
  assert.throws(() => f.output.measureTextNode(f.text), /measurement failed/);
  assert.equal(f.body.children.length, 1);
  assert.equal(f.created[0].parentNode, null);
  assert.equal(f.output.container.children.length, 1);
});

test("repeat installation is idempotent", (t) => {
  const f = fixture(t);
  assert.equal(installHiddenMathTextMeasurement(f.mathJax), true);
  const installed = f.output.measureTextNode;
  assert.equal(installHiddenMathTextMeasurement(f.mathJax), true);
  assert.equal(f.output.measureTextNode, installed);
});

test("unsupported versions, renderers, and browser APIs leave native measurement untouched", (t) => {
  const f = fixture(t);
  const native = f.output.measureTextNode;
  assert.equal(installHiddenMathTextMeasurement({ ...f.mathJax, version: "4.1.4" }), false);
  f.output.name = "SVG";
  assert.equal(installHiddenMathTextMeasurement(f.mathJax), false);
  f.output.name = "CHTML";
  Object.defineProperty(globalThis, "getComputedStyle", { configurable: true, value: undefined });
  assert.equal(installHiddenMathTextMeasurement(f.mathJax), false);
  assert.equal(f.output.measureTextNode, native);
});

test("hidden-first text stays positive when reused by MathJax's actual text cache", { skip: !process.env.MATHJAX_SOURCE_DIR }, async (t) => {
  const { CommonOutputJax } = await import(pathToFileURL(`${process.env.MATHJAX_SOURCE_DIR}/mjs/output/common.js`).href);
  const f = fixture(t);
  const measure = () => CommonOutputJax.prototype.measureTextNodeWithCache.call(f.output, f.text, "max", "-explicitFont", ["Roboto", false, false]);
  assert.equal(measure().w, 0, "the native hidden-first measurement reproduces the cached zero");
  f.output.unknownCache.clear();
  f.calls.length = 0;
  installHiddenMathTextMeasurement(f.mathJax);
  const hidden = measure();
  assert.equal(hidden.w, 1.5);
  f.parent.hidden = false;
  assert.equal(measure(), hidden, "visible text reuses the correct native cache entry");
  assert.equal(f.calls.length, 0);
});
