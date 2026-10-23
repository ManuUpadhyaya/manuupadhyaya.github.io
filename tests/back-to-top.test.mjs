import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

class Element extends EventTarget {
  attributes = new Map();
  children = [];
  className = "";
  style = {};
  scrollTop = 0;
  classList = { contains: (name) => this.className.split(/\s+/).includes(name) };

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  insertAdjacentElement(_position, child) {
    this.children.unshift(child);
  }
  set innerHTML(value) {
    if (value.includes("<svg")) this.svg = new Element();
  }
  querySelector(selector) {
    return selector === "svg" ? this.svg ?? null : null;
  }
  click() {
    this.dispatchEvent(new Event("click", { cancelable: true }));
  }
}

function loadControl() {
  const body = new Element();
  const document = {
    body,
    documentElement: new Element(),
    head: new Element(),
    createElement: () => new Element(),
    createTextNode: (text) => text,
    getElementById: (id) => body.children.find((element) => element.id === id),
    querySelector: () => null,
  };
  const events = new EventTarget();
  const context = vm.createContext({
    document,
    addEventListener: events.addEventListener.bind(events),
  });
  context.window = context;
  vm.runInContext(readFileSync(new URL("../assets/js/vanilla-back-to-top.min.js", import.meta.url), "utf8"), context);
  const setup = new URL("../assets/js/back-to-top.js", import.meta.url);
  // The vendor alone is the current behavior until the accessibility setup exists.
  try {
    vm.runInContext(readFileSync(setup, "utf8"), context);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    context.addBackToTop();
  }
  const control = document.getElementById("back-to-top");
  return {
    control,
    document,
    scrollTo(top) {
      body.scrollTop = top;
      document.documentElement.scrollTop = top;
      events.dispatchEvent(new Event("scroll"));
    },
  };
}

function press(control, key) {
  const event = new Event("keydown", { cancelable: true });
  Object.defineProperty(event, "key", { value: key });
  control.dispatchEvent(event);
  return event;
}

test("the back-to-top control has an accessible button name and hides its decorative arrow", () => {
  const { control } = loadControl();
  assert.equal(control.getAttribute("role"), "button");
  assert.equal(control.getAttribute("aria-label"), "Back to top");
  assert.equal(control.querySelector("svg").getAttribute("aria-hidden"), "true");
});

test("the back-to-top control joins the tab order only while it is shown", () => {
  const { control, scrollTo } = loadControl();
  assert.equal(control.getAttribute("tabindex"), "-1");
  assert.equal(control.getAttribute("aria-hidden"), "true");
  scrollTo(600);
  assert.equal(control.getAttribute("tabindex"), "0");
  assert.equal(control.getAttribute("aria-hidden"), "false");
  scrollTo(0);
  assert.equal(control.getAttribute("tabindex"), "-1");
  assert.equal(control.getAttribute("aria-hidden"), "true");
});

for (const key of ["Enter", " "]) {
  test(`${JSON.stringify(key)} activates the existing scroll-to-top behavior without scrolling the page by the key's default action`, () => {
    const { control, document, scrollTo } = loadControl();
    scrollTo(600);
    const event = press(control, key);
    assert.equal(event.defaultPrevented, true);
    assert.equal(document.body.scrollTop, 0);
    assert.equal(document.documentElement.scrollTop, 0);
  });
}

test("unrelated keys preserve scroll position and their default action", () => {
  const { control, document, scrollTo } = loadControl();
  scrollTo(600);
  assert.equal(press(control, "ArrowDown").defaultPrevented, false);
  assert.equal(document.body.scrollTop, 600);
});
