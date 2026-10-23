import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function loadPrintProofs({ mediaSupport = "modern", initiallyPrinting = false } = {}) {
  const windowEvents = new EventTarget();
  const mediaEvents = new EventTarget();
  const closedProof = { open: false };
  const openProof = { open: true };
  const nestedClosedProof = { open: false, parentElement: closedProof };
  const nestedOpenProof = { open: true, parentElement: closedProof };
  const coefficientDisclosure = { open: false };
  const articleDetails = [closedProof, openProof, nestedClosedProof, nestedOpenProof, coefficientDisclosure];
  const outsideArticle = { open: false };
  const printMedia = { matches: initiallyPrinting };
  if (mediaSupport === "modern") {
    printMedia.addEventListener = mediaEvents.addEventListener.bind(mediaEvents);
  } else if (mediaSupport === "legacy") {
    printMedia.addListener = (listener) => mediaEvents.addEventListener("change", listener);
  }
  const window = { addEventListener: windowEvents.addEventListener.bind(windowEvents) };
  if (mediaSupport !== "none") {
    window.matchMedia = (query) => {
      assert.equal(query, "print");
      return printMedia;
    };
  }
  const document = {
    querySelectorAll(selector) {
      if (selector === ".post .post-content details") return articleDetails;
      if (selector === "details") return [...articleDetails, outsideArticle];
      throw new Error(`Unsupported test selector: ${selector}`);
    },
  };
  vm.runInNewContext(readFileSync(new URL("../assets/js/print-proofs.js", import.meta.url), "utf8"), { window, document });
  return {
    articleDetails,
    outsideArticle,
    states: () => articleDetails.map((detail) => detail.open),
    dispatch: (name) => windowEvents.dispatchEvent(new Event(name)),
    mediaChange(matches) {
      printMedia.matches = matches;
      const event = new Event("change");
      event.matches = matches;
      mediaEvents.dispatchEvent(event);
    },
  };
}

test("normal screen loading preserves each disclosure's state", () => {
  const page = loadPrintProofs();
  assert.deepEqual(page.states(), [false, true, false, true, false]);
});

test("printing includes closed and nested article disclosures without opening unrelated details", () => {
  const page = loadPrintProofs();
  page.dispatch("beforeprint");
  assert.deepEqual(page.states(), [true, true, true, true, true]);
  assert.equal(page.outsideArticle.open, false);
});

test("afterprint restores the exact state after printing or cancellation", () => {
  const page = loadPrintProofs();
  page.dispatch("beforeprint");
  page.articleDetails[1].open = false;
  page.dispatch("afterprint");
  assert.deepEqual(page.states(), [false, true, false, true, false]);
});

test("repeated and overlapping print-entry events keep the original snapshot", () => {
  for (const mediaFirst of [false, true]) {
    const page = loadPrintProofs();
    if (mediaFirst) page.mediaChange(true);
    page.dispatch("beforeprint");
    page.dispatch("beforeprint");
    page.mediaChange(true);
    assert.deepEqual(page.states(), [true, true, true, true, true]);
    page.dispatch("afterprint");
    assert.deepEqual(page.states(), [false, true, false, true, false]);
  }
});

test("duplicate print-exit events do not overwrite subsequent screen changes", () => {
  const page = loadPrintProofs();
  page.dispatch("afterprint");
  page.mediaChange(false);
  page.dispatch("beforeprint");
  page.dispatch("afterprint");
  page.articleDetails[0].open = true;
  page.dispatch("afterprint");
  page.mediaChange(false);
  assert.deepEqual(page.states(), [true, true, false, true, false]);
});

test("each print cycle restores the user's latest choices", () => {
  const page = loadPrintProofs();
  page.dispatch("beforeprint");
  page.dispatch("afterprint");
  page.articleDetails[0].open = true;
  page.articleDetails[1].open = false;
  page.articleDetails[3].open = false;
  page.dispatch("beforeprint");
  assert.deepEqual(page.states(), [true, true, true, true, true]);
  page.dispatch("afterprint");
  assert.deepEqual(page.states(), [true, false, false, false, false]);
});

test("print media changes alone expand and restore disclosures", () => {
  for (const mediaSupport of ["modern", "legacy"]) {
    const page = loadPrintProofs({ mediaSupport });
    page.mediaChange(true);
    assert.deepEqual(page.states(), [true, true, true, true, true]);
    page.mediaChange(false);
    assert.deepEqual(page.states(), [false, true, false, true, false]);
  }
});

test("native print events still work without matchMedia", () => {
  const page = loadPrintProofs({ mediaSupport: "none" });
  page.dispatch("beforeprint");
  assert.deepEqual(page.states(), [true, true, true, true, true]);
  page.dispatch("afterprint");
  assert.deepEqual(page.states(), [false, true, false, true, false]);
});

test("a script loaded in print media expands disclosures and restores them on exit", () => {
  const page = loadPrintProofs({ initiallyPrinting: true });
  assert.deepEqual(page.states(), [true, true, true, true, true]);
  page.mediaChange(false);
  assert.deepEqual(page.states(), [false, true, false, true, false]);
});
