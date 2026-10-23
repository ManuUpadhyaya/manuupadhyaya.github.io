const installedDocuments = new WeakSet();
const hiddenMeasurementOutputs = new WeakSet();

/**
 * Keep hidden responsive copies and closed proofs from caching zero text widths.
 * The pinned native CHTML measurement inserts its probe beside the source math,
 * where display:none suppresses layout. Only those probes need a visible host.
 */
export function installHiddenMathTextMeasurement(mathJax) {
  const output = mathJax?.startup?.document?.outputJax;
  if (output && hiddenMeasurementOutputs.has(output)) return true;
  const document = globalThis.document;
  const adaptor = output?.adaptor;
  if (
    mathJax?.version !== "4.1.3" ||
    output?.name !== "CHTML" ||
    typeof output.measureTextNode !== "function" ||
    typeof output.html !== "function" ||
    typeof output.fixed !== "function" ||
    !["parent", "clone", "getStyle", "setStyle", "append", "nodeSize"].every((name) => typeof adaptor?.[name] === "function") ||
    typeof document?.body?.appendChild !== "function" ||
    typeof document.createElement !== "function" ||
    typeof globalThis.getComputedStyle !== "function"
  )
    return false;

  const nativeMeasure = output.measureTextNode;
  output.measureTextNode = function (textNode) {
    const parent = this.adaptor.parent(this.math?.start?.node);
    if (typeof parent?.getClientRects !== "function" || parent.getClientRects().length || typeof this.container?.cloneNode !== "function") {
      return nativeMeasure.apply(this, arguments);
    }
    const host = document.createElement("span");
    const inherited = globalThis.getComputedStyle(parent);
    for (const property of ["fontWeight", "fontStyle", "fontFamily", "letterSpacing", "wordSpacing", "textTransform", "fontVariant"]) {
      host.style[property] = inherited[property];
    }
    Object.assign(host.style, { position: "absolute", visibility: "hidden", left: "-100000px", top: "0" });
    try {
      const container = this.container.cloneNode(false);
      const text = this.adaptor.clone(textNode);
      this.adaptor.setStyle(text, "font-family", this.adaptor.getStyle(text, "font-family").replace(/MJXZERO, /g, ""));
      const em = this.math.metrics.em;
      const node = this.html(
        "mjx-measure-text",
        {
          style: { position: "absolute", top: 0, left: 0, "white-space": "nowrap", "font-size": this.fixed(em, 3) + "px" },
        },
        [text]
      );
      host.appendChild(container);
      document.body.appendChild(host);
      this.adaptor.append(container, node);
      return { w: this.adaptor.nodeSize(text, em)[0], h: 0.75, d: 0.2 };
    } finally {
      host.remove();
    }
  };
  hiddenMeasurementOutputs.add(output);
  return true;
}

function nextTask() {
  if (typeof globalThis.scheduler?.yield === "function") return globalThis.scheduler.yield();
  if (typeof globalThis.MessageChannel === "function") {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        channel.port1.close();
        channel.port2.close();
        resolve();
      };
      channel.port2.postMessage(null);
    });
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Let the browser service input and paint between complete MathJax items.
 * Install after startup.defaultReady(), before defaultPageReady()/findMath().
 *
 * This preserves MathJax's own render actions, expression order, retries and
 * completion promise. In particular, all TeX is compiled before any output is
 * inserted, so references to later equations keep their normal meaning.
 * Speech and explorer setup remain one uninterrupted native pipeline: their
 * promise callbacks rely on explorer creation before the browser runs microtasks.
 * Document insertion is also native and uninterrupted, avoiding partial math
 * commits and repeated page layouts between batches.
 *
 * The internal API is deliberately pinned to the site's MathJax version;
 * unsupported runtimes simply retain the ordinary synchronous item methods.
 */
export function installCooperativeMathJax(mathJax, { budgetMs = 20 } = {}) {
  const document = mathJax?.startup?.document;
  if (document && installedDocuments.has(document)) return true;
  const BaseMathItem = document?.options?.MathItem;
  const states = mathJax?._?.core?.MathItem?.STATE;
  const retryAfter = mathJax?._?.util?.Retries?.retryAfter;
  if (
    mathJax?.version !== "4.1.3" ||
    typeof BaseMathItem !== "function" ||
    typeof BaseMathItem.prototype.state !== "function" ||
    typeof retryAfter !== "function" ||
    typeof document?.addRenderAction !== "function" ||
    typeof document?.renderPromise !== "function" ||
    typeof document?.processed?.isSet !== "function" ||
    document.processed.isSet("findMath") ||
    !Number.isFinite(budgetMs) ||
    budgetMs <= 0 ||
    !Number.isFinite(states?.LAST)
  ) {
    return false;
  }

  const methods = [
    ["compile", states?.COMPILED],
    ["typeset", states?.TYPESET],
  ];
  if (methods.some(([name, state]) => typeof BaseMathItem.prototype[name] !== "function" || !Number.isFinite(state))) return false;

  if (typeof BaseMathItem.prototype.enrich === "function") {
    if (!Number.isFinite(states.ENRICHED)) return false;
    methods.push(["enrich", states.ENRICHED]);
  }

  const now = () => globalThis.performance?.now?.() ?? Date.now();
  let sliceStart = now();
  let firstItem = true;
  let completedItem = false;
  let active = true;
  const nativeRenderPromise = document.renderPromise;
  const hadOwnRenderPromise = Object.prototype.hasOwnProperty.call(document, "renderPromise");

  function disable() {
    if (!active) return;
    active = false;
    document.options.MathItem = BaseMathItem;
    if (hadOwnRenderPromise) document.renderPromise = nativeRenderPromise;
    else delete document.renderPromise;
  }

  function checkpoint() {
    if (!firstItem && (!completedItem || now() - sliceStart < budgetMs)) return;
    firstItem = false;
    completedItem = false;
    retryAfter(
      nextTask().then(() => {
        sliceStart = now();
      })
    );
  }

  class CooperativeMathItem extends BaseMathItem {}
  for (const [name, state] of methods) {
    const original = BaseMathItem.prototype[name];
    Object.defineProperty(CooperativeMathItem.prototype, name, {
      configurable: true,
      writable: true,
      value: function (mathDocument, ...args) {
        // Enrichment compiles temporary MathML items without document locations
        // inside a catch-all handler. A retry there would become an a11y error.
        const pending = active && mathDocument === document && this.start.node != null && this.state() < state;
        // Native compile() restarts its forward-reference second pass on retry.
        // Keep that pass uninterrupted to avoid repeatedly resetting references.
        const recompile = name === "compile" && this.inputData.recompile !== undefined;
        if (pending && !recompile) checkpoint();
        const result = original.call(this, mathDocument, ...args);
        if (pending) completedItem = true;
        return result;
      },
    });
  }
  document.options.MathItem = CooperativeMathItem;
  document.renderPromise = function (...args) {
    try {
      return nativeRenderPromise.apply(this, args).catch((error) => {
        disable();
        throw error;
      });
    } catch (error) {
      disable();
      throw error;
    }
  };
  // Native rerenderPromise() rolls every item back on each retry. Cooperative
  // retries therefore apply only to the initial page render, not menu changes.
  document.addRenderAction("cooperativeComplete", states.LAST - 1, disable, () => {});
  installedDocuments.add(document);
  return true;
}

// Prepare the article's exact existing font resources after text paint.
// This does not install font faces, alter CSS, or await/modify MathJax work.
const preparedNewcmDocuments = new WeakSet();
const newcmFontRoot = "https://cdn.jsdelivr.net/npm/@mathjax/mathjax-newcm-font@4.1.3/chtml/woff2";
const newcmFontFiles = [
  "mjx-ncm-zero.woff2",
  "mjx-ncm-n.woff2",
  "mjx-ncm-ds.woff2",
  "mjx-ncm-c.woff2",
  "mjx-ncm-s7.woff2",
  "mjx-ncm-s6.woff2",
  "mjx-ncm-m.woff2",
  "mjx-ncm-em.woff2",
  "mjx-ncm-s3.woff2",
  "mjx-ncm-lo.woff2",
  "mjx-ncm-so.woff2",
  "mjx-ncm-v.woff2",
];

export function prepareExactNewcmFonts(mathJax) {
  const output = mathJax?.startup?.document?.outputJax;
  const document = globalThis.document;
  const fontName = output?.options?.font;
  const fontURL = output?.font?.options?.fontURL;
  if (
    mathJax?.version !== "4.1.3" ||
    !["mathjax-newcm", "[mathjax-newcm]"].includes(fontName) ||
    typeof fontURL !== "string" ||
    fontURL.replace(/\/$/, "") !== newcmFontRoot ||
    !document?.head ||
    typeof document.createElement !== "function" ||
    typeof globalThis.requestAnimationFrame !== "function"
  )
    return false;
  if (preparedNewcmDocuments.has(document)) return true;
  preparedNewcmDocuments.add(document);
  requestAnimationFrame(() => {
    try {
      nextTask()
        .then(() => {
          try {
            for (const filename of newcmFontFiles) {
              const href = `${newcmFontRoot}/${filename}`;
              const exists = [...document.querySelectorAll('link[rel="preload"][as="font"]')].some((link) => link.href === href);
              if (exists) continue;
              const link = document.createElement("link");
              link.rel = "preload";
              link.as = "font";
              link.type = "font/woff2";
              link.crossOrigin = "anonymous";
              link.fetchPriority = "low";
              link.href = href;
              document.head.appendChild(link);
            }
          } catch {
            // Speculative preparation must never affect native rendering.
          }
        })
        .catch(() => {});
    } catch {
      // A failed scheduling hint must not affect native rendering either.
    }
  });
  return true;
}
