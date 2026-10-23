import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { installCooperativeMathJax } from "../assets/js/mathjax-cooperative.mjs";

// Optional integration suite, without adding a site build dependency:
// npm install --prefix /tmp/mathjax-check @mathjax/src@4.1.3
// MATHJAX_SOURCE_DIR=/tmp/mathjax-check/node_modules/@mathjax/src node --test tests/mathjax-cooperative.test.mjs
const sourceDir = process.env.MATHJAX_SOURCE_DIR;

function equalMarkup(actual, expected) {
  const index = [...actual].findIndex((character, position) => character !== expected[position]);
  assert.ok(
    actual === expected,
    `Markup differs at ${index}: ${JSON.stringify(actual.slice(index - 70, index + 100))} versus ${JSON.stringify(
      expected.slice(index - 70, index + 100)
    )}`
  );
}

async function sourceModules() {
  const load = (name) => import(pathToFileURL(`${sourceDir}/mjs/${name}.js`).href);
  const [{ mathjax }, { TeX }, { MathML }, { CHTML }, { HTMLHandler }, { liteAdaptor }, mathItem, retries, { EnrichHandler }] = await Promise.all([
    load("mathjax"),
    load("input/tex"),
    load("input/mathml"),
    load("output/chtml"),
    load("handlers/html/HTMLHandler"),
    load("adaptors/liteAdaptor"),
    load("core/MathItem"),
    load("util/Retries"),
    load("a11y/semantic-enrich"),
    load("input/tex/ams/AmsConfiguration"),
    load("input/tex/newcommand/NewcommandConfiguration"),
    load("input/tex/configmacros/ConfigMacrosConfiguration"),
    load("util/asyncLoad/esm"),
  ]);
  return {
    mathjax,
    TeX,
    MathML,
    CHTML,
    HTMLHandler,
    liteAdaptor,
    mathItem,
    retries,
    EnrichHandler,
  };
}

const input = String.raw`<article>
  <p>See \(\eqref{later}\), \(\ref{last}\), and \(\ref{later}\).</p>
  <p>Inline \(a+b=c\) and \(x^2+y^2=z^2\) share a text node.</p>
  \[\begin{equation}\label{later} x=\tfrac{1}{2}\end{equation}\]
  <details><summary>A proof</summary>
    <p>Previous \(\eqref{later}\); next \(\ref{last}\).</p>
    \[\begin{equation}\label{last} A=\begin{bmatrix}1&-2\\0&3\end{bmatrix}\end{equation}\]
  </details>
  <p>Final reference \(\eqref{last}\).</p>
</article>`;

async function fixture({ enriched = false } = {}) {
  const modules = await sourceModules();
  const adaptor = modules.liteAdaptor();
  const handler = new modules.HTMLHandler(adaptor);
  if (enriched) modules.EnrichHandler(handler, new modules.MathML());
  const tex = new modules.TeX({
    packages: ["base", "ams", "newcommand", "configmacros"],
    tags: "ams",
    macros: { eqref: ["(\\ref{#1})", 1] },
  });
  const output = new modules.CHTML({
    scale: 0.92,
    matchFontHeight: false,
    mtextInheritFont: true,
  });
  const errors = [];
  const document = handler.create(input, {
    InputJax: tex,
    OutputJax: output,
    ...(enriched ? { enrichError: (_doc, _math, error) => errors.push(error) } : {}),
  });
  const component = {
    version: modules.mathjax.version,
    startup: { document },
    _: {
      core: { MathItem: modules.mathItem },
      util: { Retries: modules.retries },
    },
  };
  return {
    ...modules,
    adaptor,
    document,
    tex,
    output,
    component,
    errors,
    html: () => adaptor.outerHTML(adaptor.body(document.document)),
    // Retries call styleSheet() again, appending empty CSS blocks in liteDOM.
    // Compare every nonempty rule, ignoring only blank lines between blocks.
    css: () => adaptor.outerHTML(output.styleSheet(document)).replace(/\n{2,}/g, "\n\n"),
    labels: () => Object.fromEntries(Object.entries(tex.parseOptions.tags.allLabels).map(([key, value]) => [key, { ...value }])),
  };
}

function simulatedWork(t, context) {
  let elapsed = 0;
  let yields = 0;
  const previousScheduler = globalThis.scheduler;
  t.mock.method(performance, "now", () => elapsed);
  globalThis.scheduler = {
    yield: () =>
      new Promise((resolve) =>
        setImmediate(() => {
          yields++;
          resolve();
        })
      ),
  };
  t.after(() => {
    if (previousScheduler === undefined) delete globalThis.scheduler;
    else globalThis.scheduler = previousScheduler;
  });
  context.tex.postFilters.add(() => {
    elapsed += 11;
  });
  context.output.postFilters.add(() => {
    elapsed += 11;
  });
  return { yields: () => yields };
}

// A small upstream-interface double keeps the scheduling contract testable
// without requiring MathJax in the Jekyll repository's development dependencies.
function itemInterface(onWork) {
  const STATE = {
    COMPILED: 20,
    ENRICHED: 30,
    TYPESET: 150,
    INSERTED: 200,
    ATTACHSPEECH: 210,
    EXPLORER: 230,
    LAST: 10000,
  };
  class NativeMathItem {
    constructor(name) {
      this.name = name;
      this.start = { node: {} };
      this.inputData = {};
      this.outputData = {};
      this.currentState = 0;
    }
    state() {
      return this.currentState;
    }
    compile() {
      if (this.state() < STATE.COMPILED) {
        this.currentState = STATE.COMPILED;
        onWork(this.name);
      }
    }
    typeset() {
      if (this.state() < STATE.TYPESET) this.currentState = STATE.TYPESET;
    }
    updateDocument() {
      if (this.state() < STATE.INSERTED) this.currentState = STATE.INSERTED;
    }
  }
  let finish;
  const document = {
    options: { MathItem: NativeMathItem },
    processed: { isSet: () => false },
    renderPromise() {
      return Promise.resolve(this);
    },
    actionPromises: [],
    savePromise(promise) {
      this.actionPromises.push(promise);
    },
    clearPromises() {
      this.actionPromises = [];
    },
    addRenderAction: (_name, _priority, action) => {
      finish = action;
    },
  };
  const component = {
    version: "4.1.3",
    startup: { document },
    _: {
      core: { MathItem: { STATE } },
      util: {
        Retries: {
          retryAfter(promise) {
            throw Object.assign(new Error("Retry"), { retry: promise });
          },
        },
      },
    },
  };
  return { document, component, NativeMathItem, STATE, finish: () => finish() };
}

async function withRetries(action) {
  for (let attempts = 0; attempts < 20; attempts++) {
    try {
      return action();
    } catch (error) {
      if (!error.retry) throw error;
      await error.retry;
    }
  }
  assert.fail("cooperative rendering made no progress after twenty retries");
}

test("the browser receives an initial task and another only after the work budget is used", async (t) => {
  let elapsed = 0;
  const events = [];
  const previousScheduler = globalThis.scheduler;
  t.mock.method(performance, "now", () => elapsed);
  globalThis.scheduler = {
    yield: async () => {
      events.push("yield");
    },
  };
  t.after(() => {
    if (previousScheduler === undefined) delete globalThis.scheduler;
    else globalThis.scheduler = previousScheduler;
  });
  const context = itemInterface((name) => {
    events.push(name);
    elapsed += 11;
  });
  assert.equal(installCooperativeMathJax(context.component), true);
  const items = ["a", "b", "c"].map((name) => new context.document.options.MathItem(name));
  for (const item of items) await withRetries(() => item.compile(context.document));
  assert.deepEqual(events, ["yield", "a", "b", "yield", "c"]);
  context.finish();
  assert.equal(context.document.options.MathItem, context.NativeMathItem);
  elapsed += 100;
  await withRetries(() => new context.document.options.MathItem("later").compile(context.document));
  assert.deepEqual(events, ["yield", "a", "b", "yield", "c", "later"]);
});

test("a browser without scheduler.yield still receives an asynchronous task before compilation", async (t) => {
  const previousScheduler = globalThis.scheduler;
  globalThis.scheduler = undefined;
  t.after(() => {
    if (previousScheduler === undefined) delete globalThis.scheduler;
    else globalThis.scheduler = previousScheduler;
  });
  let compiled = false;
  const context = itemInterface(() => {
    compiled = true;
  });
  assert.equal(installCooperativeMathJax(context.component), true);
  const item = new context.document.options.MathItem("first");
  let retry;
  try {
    item.compile(context.document);
  } catch (error) {
    retry = error.retry;
  }
  assert.ok(retry instanceof Promise);
  assert.equal(compiled, false);
  await retry;
  item.compile(context.document);
  assert.equal(compiled, true);
});

test("enrichment slices preserve the native uninterrupted speech and explorer stages", async (t) => {
  let elapsed = 0;
  let stage = "";
  const yieldedStages = new Set();
  const previousScheduler = globalThis.scheduler;
  t.mock.method(performance, "now", () => elapsed);
  globalThis.scheduler = {
    yield: async () => {
      yieldedStages.add(stage);
    },
  };
  t.after(() => {
    if (previousScheduler === undefined) delete globalThis.scheduler;
    else globalThis.scheduler = previousScheduler;
  });
  const context = itemInterface(() => {
    elapsed += 11;
  });
  const releaseSpeech = [];
  class AccessibleItem extends context.NativeMathItem {
    enrich() {
      if (this.state() >= context.STATE.ENRICHED) return;
      elapsed += 11;
      this.currentState = context.STATE.ENRICHED;
    }
    attachSpeech(document) {
      // Match the pinned upstream method's reset-before-state-check behavior.
      this.outputData.speechPromise = null;
      if (this.state() >= context.STATE.ATTACHSPEECH) return;
      this.currentState = context.STATE.ATTACHSPEECH;
      elapsed += 11;
      this.outputData.speechPromise = new Promise((resolve) => releaseSpeech.push(resolve));
      document.savePromise(this.outputData.speechPromise);
    }
    explorable() {
      if (this.state() >= context.STATE.EXPLORER) return;
      assert.ok(this.outputData.speechPromise, "the explorer keeps the item's pending speech promise");
      this.currentState = context.STATE.EXPLORER;
      elapsed += 11;
    }
  }
  context.document.options.MathItem = AccessibleItem;
  const originalSavePromise = context.document.savePromise;
  assert.equal(installCooperativeMathJax(context.component), true);
  const items = ["a", "b", "c", "d", "e"].map((name) => new context.document.options.MathItem(name));
  let initialRenderFinished = false;
  let resolved = false;
  const rendering = withRetries(() => {
    context.document.actionPromises = [];
    for (const method of ["compile", "enrich", "typeset", "updateDocument", "attachSpeech", "explorable"]) {
      stage = method;
      for (const item of items) item[method](context.document);
    }
    context.finish();
    initialRenderFinished = true;
    return Promise.all(context.document.actionPromises);
  }).then(() => {
    resolved = true;
  });
  for (let count = 0; !initialRenderFinished && count < 100; count++) await new Promise((resolve) => setImmediate(resolve));
  assert.equal(initialRenderFinished, true);
  assert.ok(yieldedStages.has("enrich"), "semantic enrichment returns control between items");
  assert.equal(yieldedStages.has("attachSpeech"), false, "speech setup keeps native synchronous ordering");
  assert.equal(yieldedStages.has("explorable"), false, "explorer setup keeps native synchronous ordering");
  assert.equal(releaseSpeech.length, 5, "each item requests speech exactly once");
  assert.equal(resolved, false, "rendering still awaits earlier speech work after later retries");
  assert.equal(context.document.savePromise, originalSavePromise);
  assert.equal(context.document.options.MathItem, AccessibleItem);
  for (const item of items) assert.ok(context.document.actionPromises.includes(item.outputData.speechPromise));
  for (const release of releaseSpeech) release();
  await rendering;
  assert.equal(resolved, true);
  let releaseLaterSpeech;
  const laterSpeech = new Promise((resolve) => {
    releaseLaterSpeech = resolve;
  });
  context.document.clearPromises();
  context.document.savePromise(laterSpeech);
  context.finish();
  let laterResolved = false;
  const laterRendering = Promise.all(context.document.actionPromises).then(() => {
    laterResolved = true;
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(laterResolved, false, "later native renders retain their newly registered speech promises");
  assert.deepEqual(context.document.actionPromises, [laterSpeech]);
  releaseLaterSpeech();
  await laterRendering;
});

test("unknown MathJax versions and missing retry APIs retain the original renderer", () => {
  class OriginalMathItem {}
  const document = { options: { MathItem: OriginalMathItem } };
  assert.equal(installCooperativeMathJax({ version: "5.0.0", startup: { document } }), false);
  assert.equal(installCooperativeMathJax({ version: "4.1.3", startup: { document } }), false);
  assert.equal(document.options.MathItem, OriginalMathItem);
  assert.equal(installCooperativeMathJax(undefined), false);
  const missingState = itemInterface(() => {});
  missingState.NativeMathItem.prototype.state = undefined;
  assert.equal(installCooperativeMathJax(missingState.component), false);
  assert.equal(missingState.document.options.MathItem, missingState.NativeMathItem);
});

test("already-ready speech callbacks run only after the native explorer objects exist", async (t) => {
  let elapsed = 0;
  const previousScheduler = globalThis.scheduler;
  t.mock.method(performance, "now", () => elapsed);
  globalThis.scheduler = { yield: async () => {} };
  t.after(() => {
    if (previousScheduler === undefined) delete globalThis.scheduler;
    else globalThis.scheduler = previousScheduler;
  });
  const context = itemInterface(() => {
    elapsed += 11;
  });
  const callbacks = [];
  const attached = [];
  class FastSpeechItem extends context.NativeMathItem {
    enrich() {
      if (this.state() >= context.STATE.ENRICHED) return;
      this.currentState = context.STATE.ENRICHED;
      elapsed += 11;
    }
    attachSpeech(document) {
      this.outputData.speechPromise = null;
      if (this.state() >= context.STATE.ATTACHSPEECH) return;
      this.currentState = context.STATE.ATTACHSPEECH;
      this.outputData.speechPromise = Promise.resolve();
      document.savePromise(this.outputData.speechPromise);
      // The pinned ExplorerMathItem chains this callback before creating its
      // explorer objects in the later document.explorable() action.
      const callback = this.outputData.speechPromise.then(() => this.explorers.speech.attachSpeech());
      callback.catch(() => {});
      callbacks.push(callback);
      elapsed += 11;
    }
    explorable() {
      if (this.state() >= context.STATE.EXPLORER) return;
      this.explorers = {
        speech: { attachSpeech: () => attached.push(this.name) },
      };
      this.currentState = context.STATE.EXPLORER;
      elapsed += 11;
    }
  }
  context.document.options.MathItem = FastSpeechItem;
  assert.equal(installCooperativeMathJax(context.component), true);
  const items = ["a", "b", "c", "d", "e"].map((name) => new context.document.options.MathItem(name));
  await withRetries(() => {
    context.document.clearPromises();
    for (const method of ["compile", "enrich", "typeset", "updateDocument", "attachSpeech", "explorable"]) {
      for (const item of items) item[method](context.document);
    }
    context.finish();
    return Promise.all(context.document.actionPromises);
  });
  await Promise.all(callbacks);
  assert.deepEqual(attached, ["a", "b", "c", "d", "e"]);
});

test("complete DOM, CSS, equation labels and forward references match native rendering", { skip: !sourceDir }, async (t) => {
  const normal = await fixture();
  await normal.document.renderPromise();
  assert.deepEqual(normal.labels(), {
    later: { tag: "1", id: "mjx-eqn:later" },
    last: { tag: "2", id: "mjx-eqn:last" },
  });
  assert.doesNotMatch(normal.html(), /\?\?\?/);
  const cooperative = await fixture();
  const work = simulatedWork(t, cooperative);
  assert.equal(installCooperativeMathJax(cooperative.component), true);
  await cooperative.document.renderPromise();
  assert.ok(work.yields() >= 5, "a busy document should return control repeatedly");
  assert.equal(cooperative.html(), normal.html());
  equalMarkup(cooperative.css(), normal.css());
  assert.deepEqual(cooperative.labels(), normal.labels());
});

test("temporary enrichment compilation remains synchronous and produces identical semantic output", { skip: !sourceDir }, async (t) => {
  const normal = await fixture({ enriched: true });
  await normal.document.renderPromise();
  assert.deepEqual(normal.errors, []);
  assert.match(normal.html(), /data-semantic-type/);
  const cooperative = await fixture({ enriched: true });
  const work = simulatedWork(t, cooperative);
  assert.equal(installCooperativeMathJax(cooperative.component), true);
  await cooperative.document.renderPromise();
  assert.ok(work.yields() >= 5);
  assert.deepEqual(cooperative.errors, []);
  assert.equal(cooperative.html(), normal.html());
  equalMarkup(cooperative.css(), normal.css());
});

test("native asynchronous font retries and subsequent rerendering remain intact", { skip: !sourceDir }, async (t) => {
  const normal = await fixture();
  await normal.document.renderPromise();
  const cooperative = await fixture();
  const work = simulatedWork(t, cooperative);
  let fontLoaded = false;
  cooperative.output.preFilters.add(() => {
    if (!fontLoaded)
      cooperative.retries.retryAfter(
        new Promise((resolve) =>
          setImmediate(() => {
            fontLoaded = true;
            resolve();
          })
        )
      );
  });
  assert.equal(installCooperativeMathJax(cooperative.component), true);
  await cooperative.document.renderPromise();
  assert.equal(fontLoaded, true);
  assert.ok(work.yields() >= 5);
  assert.equal(cooperative.html(), normal.html());
  const yieldsAfterInitialRender = work.yields();
  await cooperative.document.rerenderPromise();
  await normal.document.rerenderPromise();
  assert.equal(cooperative.html(), normal.html());
  assert.deepEqual(cooperative.labels(), normal.labels());
  assert.equal(work.yields(), yieldsAfterInitialRender, "subsequent menu rerenders use native item methods");
});

test("installation yields before the first expression and refuses already discovered items", { skip: !sourceDir }, async (t) => {
  const context = await fixture();
  const work = simulatedWork(t, context);
  context.tex.preFilters.add(() => {
    assert.ok(work.yields() > 0, "the browser receives an initial task before compilation");
  });
  assert.equal(installCooperativeMathJax(context.component), true);
  assert.equal(installCooperativeMathJax(context.component), true, "installation is idempotent");
  await context.document.renderPromise();
  const alreadyDiscovered = await fixture();
  alreadyDiscovered.document.findMath();
  const original = alreadyDiscovered.document.options.MathItem;
  assert.equal(installCooperativeMathJax(alreadyDiscovered.component), false);
  assert.equal(alreadyDiscovered.document.options.MathItem, original);
});

test("a rejected initial font retry restores native rendering and preserves recovery", { skip: !sourceDir }, async (t) => {
  const normal = await fixture();
  const failure = new Error("font download failed");
  let normalFirstTypeset = true;
  normal.output.preFilters.add(() => {
    if (!normalFirstTypeset) return;
    normalFirstTypeset = false;
    normal.retries.retryAfter(Promise.reject(failure));
  });
  await assert.rejects(normal.document.renderPromise(), (error) => error === failure);
  await normal.document.rerenderPromise();
  const context = await fixture();
  const work = simulatedWork(t, context);
  const originalItem = context.document.options.MathItem;
  const originalRenderPromise = context.document.renderPromise;
  let firstTypeset = true;
  context.output.preFilters.add(() => {
    if (!firstTypeset) return;
    firstTypeset = false;
    context.retries.retryAfter(Promise.reject(failure));
  });
  assert.equal(installCooperativeMathJax(context.component), true);
  await assert.rejects(context.document.renderPromise(), (error) => error === failure);
  assert.equal(context.document.options.MathItem, originalItem);
  assert.equal(context.document.renderPromise, originalRenderPromise);
  const yieldsAtFailure = work.yields();
  await context.document.rerenderPromise();
  assert.equal(work.yields(), yieldsAtFailure, "recovery uses native methods without cooperative retries");
  assert.equal(context.html(), normal.html());
});

test("the native document insertion stage remains synchronous and uninterrupted", (t) => {
  const context = itemInterface(() => {});
  const inserted = [];
  class DocumentWriteItem extends context.NativeMathItem {
    updateDocument() {
      inserted.push(this.name);
      this.currentState = context.STATE.INSERTED;
    }
  }
  context.document.options.MathItem = DocumentWriteItem;
  assert.equal(installCooperativeMathJax(context.component, { budgetMs: 8 }), true);
  const items = ["a", "b", "c"].map((name) => {
    const item = new context.document.options.MathItem(name);
    item.currentState = context.STATE.TYPESET;
    return item;
  });
  assert.doesNotThrow(() => {
    for (const item of items) item.updateDocument(context.document);
  });
  assert.deepEqual(inserted, ["a", "b", "c"]);
});
