/** Persistent, JSON-lines MathJax worker used by Jekyll's post-render hook. */
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import { parse as parseHTML, serialize as serializeHTML, serializeOuter as serializeOuterHTML } from "parse5";
import { mathjax } from "@mathjax/src/js/mathjax.js";
import { TeX } from "@mathjax/src/js/input/tex.js";
import { CHTML } from "@mathjax/src/js/output/chtml.js";
import { liteAdaptor } from "@mathjax/src/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "@mathjax/src/js/handlers/html.js";
import { AssistiveMmlHandler } from "@mathjax/src/js/a11y/assistive-mml.js";
import { STATE } from "@mathjax/src/js/core/MathItem.js";
import { MathJaxNewcmFont } from "@mathjax/mathjax-newcm-font/js/chtml.js";
import "@mathjax/src/js/input/tex/ams/AmsConfiguration.js";
import "@mathjax/src/js/input/tex/newcommand/NewcommandConfiguration.js";
import "@mathjax/src/js/input/tex/textmacros/TextMacrosConfiguration.js";
import "@mathjax/src/js/input/tex/configmacros/ConfigMacrosConfiguration.js";
import "@mathjax/src/js/input/tex/mathtools/MathtoolsConfiguration.js";
import "@mathjax/src/js/input/tex/boldsymbol/BoldsymbolConfiguration.js";
import { measureRobotoText, robotoXHeight } from "./math-font-metrics.mjs";

const setupPath = new URL("../assets/js/mathjax-setup.js", import.meta.url);
const setupSource = readFileSync(setupPath, "utf8");
const adaptor = liteAdaptor({ fontFamily: '"Roboto", sans-serif' });
const htmlNamespace = "http://www.w3.org/1999/xhtml";

// Use an HTML5 parser and serializer for the full page. LiteParser's limited
// raw-text and nesting rules can otherwise discard valid prose or math.
function fromHtmlNode(source) {
  if (source.nodeName === "#text") return adaptor.text(source.value);
  if (source.nodeName === "#comment") return adaptor.comment(source.data);
  if (source.nodeName === "#documentType") return { kind: "#documentType", name: source.name, publicId: source.publicId, systemId: source.systemId };
  const attributes = Object.fromEntries((source.attrs || []).map(({ name, prefix, value }) => [prefix ? `${prefix}:${name}` : name, value]));
  const node = adaptor.node(source.tagName || source.nodeName, attributes);
  node.namespaceURI = source.namespaceURI;
  for (const child of source.childNodes || []) adaptor.append(node, fromHtmlNode(child));
  if (source.content) node.templateContent = fromHtmlNode(source.content);
  return node;
}

adaptor.parse = (html) => {
  const source = parseHTML(html);
  const document = adaptor.createDocument();
  document.children = [];
  for (const child of source.childNodes) adaptor.append(document, fromHtmlNode(child));
  document.root = document.children.find((node) => node.kind === "html");
  document.head = document.root.children.find((node) => node.kind === "head");
  document.body = document.root.children.find((node) => node.kind === "body");
  const doctype = source.childNodes.find((node) => node.nodeName === "#documentType");
  document.type = doctype ? serializeOuterHTML(doctype) : "";
  return document;
};

const htmlTreeAdapter = {
  getChildNodes: (node) => node.children || [],
  getParentNode: (node) => node.parent || null,
  getTagName: (node) => node.kind,
  getAttrList: (node) => adaptor.allAttributes(node),
  getNamespaceURI(node) {
    for (; node; node = node.parent) if (node.namespaceURI) return node.namespaceURI;
    return htmlNamespace;
  },
  getTemplateContent: (node) => node.templateContent || { children: [] },
  getTextNodeContent: (node) => node.value,
  getCommentNodeContent: (node) => node.value,
  getDocumentTypeNodeName: (node) => node.name,
  getDocumentTypeNodePublicId: (node) => node.publicId,
  getDocumentTypeNodeSystemId: (node) => node.systemId,
  isTextNode: (node) => node.kind === "#text",
  isCommentNode: (node) => node.kind === "#comment",
  isDocumentTypeNode: (node) => node.kind === "#documentType",
  isElementNode: (node) => !!node.kind && !node.kind.startsWith("#"),
};
adaptor.innerHTML = (node) => serializeHTML(node, { treeAdapter: htmlTreeAdapter });
adaptor.outerHTML = (node) => serializeOuterHTML(node, { treeAdapter: htmlTreeAdapter });
AssistiveMmlHandler(RegisterHTMLHandler(adaptor));
// Font extensions are local ES modules; no network or browser loader is needed.
mathjax.asyncLoad = (name) => import(name);

function closestClass(node, name) {
  for (; node; node = adaptor.parent(node)) {
    if ((node.attributes?.class || "").split(/\s+/).includes(name)) return node;
  }
  return null;
}

/** The site's inherited typography, together with per-element overrides. */
function typography(node) {
  const chain = [];
  for (; node; node = adaptor.parent(node)) chain.unshift(node);
  const result = { fontFamily: '"Roboto", sans-serif', fontWeight: "400", fontStyle: "normal", fontSize: "16px", letterSpacing: "-0.004em" };
  for (const element of chain) {
    const kind = adaptor.kind(element);
    const classes = (element.attributes?.class || "").split(/\s+/);
    if (/^h[1-6]$/.test(kind)) Object.assign(result, { fontWeight: "600", letterSpacing: "-0.012em" });
    if (["b", "strong", "th"].includes(kind) || classes.includes("font-weight-bold")) result.fontWeight = "700";
    if (classes.includes("font-weight-normal")) result.fontWeight = "400";
    if (classes.includes("font-weight-light")) result.fontWeight = "300";
    if (kind === "em" || kind === "i" || classes.includes("font-italic")) result.fontStyle = "italic";
    if (/^h[2-5]$/.test(kind) && closestClass(element, "blog-post")) result.fontWeight = "500";
    if (classes.includes("post-title")) result.fontWeight = "500";
    if (element.attributes?.style) {
      for (const property of ["font-family", "font-weight", "font-style", "font-size", "letter-spacing"]) {
        const value = adaptor.getStyle(element, property);
        if (!value || value === "inherit") continue;
        const key = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        result[key] = value.replace(/\s*!important\s*$/, "");
      }
    }
  }
  if (result.fontWeight === "bold" || result.fontWeight === "bolder") result.fontWeight = "700";
  if (result.fontWeight === "normal") result.fontWeight = "400";
  return result;
}

function browserConfiguration(document) {
  // Execute the existing browser configuration so its macros, bold contexts and
  // inherited-text compensation have exactly one source of truth.
  const window = { getComputedStyle: typography };
  const context = vm.createContext({ window, document: { body: adaptor.body(document) } });
  vm.runInContext(setupSource, context, { filename: fileURLToPath(setupPath) });
  // Lite nodes intentionally have a small DOM API. The shared configuration
  // uses only these two browser conveniences in its pre-filters.
  function visit(node) {
    if (!Object.hasOwn(node, "parentElement")) Object.defineProperty(node, "parentElement", { get: () => adaptor.parent(node), configurable: true });
    node.closest = (selector) => (selector.startsWith(".") ? closestClass(node, selector.slice(1)) : null);
    for (const child of node.children || []) visit(child);
  }
  visit(adaptor.body(document));
  return window.MathJax;
}

function installMetrics(output) {
  output.getMetrics = function (document) {
    this.setDocument(document);
    for (const math of document.math) {
      const parent = adaptor.parent(math.start.node);
      if (math.state() >= STATE.METRICS || !parent) continue;
      const style = typography(parent);
      const em = Number.parseFloat(style.fontSize) || 16;
      const ex = em * robotoXHeight(Number(style.fontWeight));
      const scale = this.options.matchFontHeight ? ex / this.font.params.x_height / em : 1;
      math.setMetrics(em, ex, 1000000, Math.max(this.options.minScale, scale));
      math.outputData.mtextFamily = style.fontFamily;
      math.outputData.merrorFamily = style.fontFamily;
      math.state(STATE.METRICS);
    }
  };
  output.measureTextNode = function (node) {
    const weight = adaptor.getStyle(node, "font-weight") === "bold" ? 700 : 400;
    const style = adaptor.getStyle(node, "font-style") || "normal";
    const family = adaptor.getStyle(node, "font-family");
    if (family && !/Roboto/.test(family)) throw new Error(`Cannot measure inherited mathematical text in unsupported font ${family}`);
    return { w: measureRobotoText(adaptor.textContent(node), { weight, style, letterSpacing: -0.004 }), h: 0.75, d: 0.2 };
  };
}

function removeSourceAttributes(root) {
  const pending = [root];
  while (pending.length) {
    const node = pending.pop();
    if (node.attributes) adaptor.removeAttribute(node, "data-latex");
    for (const child of node.children || []) pending.push(child);
  }
}

function exposeStandaloneReference(math, assistive, mml) {
  if (!/^\s*\\(?:eqref|ref)\s*\{[^{}]+\}\s*$/.test(math.inputData.originalTeX ?? math.math)) return;
  const chtml = adaptor.tags(math.typesetRoot, "mjx-math")[0];
  const links = chtml && adaptor.tags(chtml, "a");
  if (links?.length !== 1) return;
  const href = adaptor.getAttribute(links[0], "href");
  if (!href) return;
  const reference = adaptor.tags(mml, "mrow").find((node) => adaptor.getAttribute(node, "href") === href);
  const number = reference && adaptor.textContent(reference).trim().replace(/\s+/g, " ");
  if (!number) return;
  // Keep the existing native link keyboard-accessible. Read its number from
  // MathML, since CHTML glyphs need not contain ordinary text nodes.
  adaptor.setAttribute(links[0], "aria-label", `Equation ${number}`);
  adaptor.removeAttribute(chtml, "aria-hidden");
  adaptor.setAttribute(assistive, "aria-hidden", "true");
}

function addSourceAnnotations(document) {
  for (const math of document.math) {
    if (math.isEscaped) continue;
    const assistive = adaptor.tags(math.typesetRoot, "mjx-assistive-mml")[0];
    const mml = assistive && adaptor.firstChild(assistive);
    if (!mml) continue;
    const children = [...adaptor.childNodes(mml)];
    const annotation = adaptor.node("annotation", { encoding: "application/x-tex" }, [adaptor.text(math.inputData.originalTeX ?? math.math)]);
    const presentation = children.length === 1 ? children[0] : adaptor.node("mrow", {}, children);
    const semantics = adaptor.node("semantics", {}, [presentation, annotation]);
    adaptor.append(mml, semantics);
    // MathJax 4.1.3 emits an invalid height on the last labeled table row.
    // Browsers discard it; omit it from static output with the same effect.
    for (const row of adaptor.tags(math.typesetRoot, "mjx-mlabeledtr")) {
      if (adaptor.getStyle(row, "height") === "NaNem") adaptor.setStyle(row, "height", "");
    }
    exposeStandaloneReference(math, assistive, mml);
    // Original TeX remains available once per formula in its annotation. The
    // repeated per-node source copies are unused by this static output.
    removeSourceAttributes(math.typesetRoot);
  }
}

export async function renderMath({ html, options = {} } = {}) {
  if (typeof html !== "string") throw new TypeError("Math rendering requires an HTML string");
  if (options.font !== undefined && !["mathjax-newcm", "[mathjax-newcm]"].includes(options.font)) {
    throw new Error(`Unsupported mathematical font ${JSON.stringify(options.font)}; this renderer supports only mathjax-newcm`);
  }
  const parsed = adaptor.parse(html, "text/html");
  const config = browserConfiguration(parsed);
  const packages = ["base", "ams", "newcommand", "textmacros", "configmacros", ...config.tex.packages["[+]"]];
  const tex = new TeX({
    ...config.tex,
    packages,
    formatError: (_jax, error) => {
      throw error;
    },
  });
  tex.preFilters.add(({ math }) => {
    math.inputData.originalTeX ??= math.math;
  }, -100);
  const fontURL = options.fontURL || `${(options.baseurl || "").replace(/\/$/, "")}/assets/fonts/mathjax-newcm-4.1.3`;
  const output = new CHTML({
    ...config.output,
    ...config.chtml,
    fontData: MathJaxNewcmFont,
    fontURL,
    ...(options.scale === undefined ? {} : { scale: options.scale }),
    ...(options.matchFontHeight === undefined ? {} : { matchFontHeight: options.matchFontHeight }),
  });
  installMetrics(output);
  config.startup.defaultReady = () => {};
  config.startup.document = { outputJax: output };
  config.startup.ready();
  const document = mathjax.document(parsed, {
    InputJax: tex,
    OutputJax: output,
    enableAssistiveMml: true,
    compileError: (_document, _math, error) => {
      throw error;
    },
    typesetError: (_document, _math, error) => {
      throw error;
    },
  });
  await mathjax.handleRetriesFor(() => document.render());
  addSourceAnnotations(document);
  const sheet = output.styleSheet(document);
  const css = `${adaptor.textContent(sheet)}\n.mjx-container { color: inherit; }\n`;
  if (adaptor.parent(sheet)) adaptor.remove(sheet);
  const fonts = [...new Set([...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((match) => match[1]))];
  return { html: adaptor.innerHTML(parsed), css, fonts };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  for await (const line of createInterface({ input: process.stdin, crlfDelay: Infinity })) {
    if (!line.trim()) continue;
    let response;
    try {
      response = await renderMath(JSON.parse(line));
    } catch (error) {
      response = { error: { message: error?.message || String(error) } };
    }
    process.stdout.write(`${JSON.stringify(response)}\n`);
  }
}
