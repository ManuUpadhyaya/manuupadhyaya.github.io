import { readFile, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { parse } from "parse5";
import { PurgeCSS } from "purgecss";
import valueParser from "postcss-value-parser";

const origin = "https://style-delivery.invalid";
const { values } = parseArgs({
  options: { source: { type: "string" }, dest: { type: "string" }, baseurl: { type: "string", default: "" } },
});
const source = resolve(values.source || ".");
const dest = resolve(values.dest || join(source, "_site"));
const baseurl = values.baseurl.replace(/\/$/, "");
if (baseurl && (!baseurl.startsWith("/") || baseurl.startsWith("//") || /[?#]/.test(baseurl))) {
  throw new Error(`Expected a root-relative site baseurl, received ${JSON.stringify(baseurl)}`);
}

// Use the production purge policy unchanged, rebased to Jekyll's actual output
// directory. Keep the original CSS assets for subsequent watch rebuilds.
const require = createRequire(import.meta.url);
const config = require(join(source, "purgecss.config.js"));
function outputGlob(pattern) {
  if (typeof pattern !== "string") return pattern;
  const absolute = resolve(source, pattern);
  const fromDefault = relative(join(source, "_site"), absolute);
  return fromDefault !== ".." && !fromDefault.startsWith(`..${sep}`) && !isAbsolute(fromDefault) ? join(dest, fromDefault) : absolute;
}
const purge = await new PurgeCSS().purge({
  ...config,
  content: config.content.map(outputGlob),
  css: config.css.map(outputGlob),
  skippedContentGlobs: (config.skippedContentGlobs || []).map(outputGlob),
});
const purged = new Map(purge.map(({ file, css }) => [resolve(file), css]));

function cssUnescape(value) {
  return value.replace(/\\(?:([\da-f]{1,6})\s?|\r\n|[\n\r\f]|(.))/gi, (_match, hex, character) => {
    if (!hex) return character || "";
    const codepoint = Number.parseInt(hex, 16);
    return codepoint && codepoint <= 0x10ffff && !(codepoint >= 0xd800 && codepoint <= 0xdfff) ? String.fromCodePoint(codepoint) : "\ufffd";
  });
}

function rebaseUrls(css, stylesheetUrl) {
  const replacements = [];
  valueParser(css).walk((node) => {
    if (node.type !== "function" || node.value.toLowerCase() !== "url") return;
    const value = node.nodes.find((child) => child.type === "word" || child.type === "string");
    if (!value) return false;
    const decoded = cssUnescape(value.value);
    if (!decoded || /^(?:\/|#|[a-z][\w+.-]*:)/i.test(decoded)) return false;
    const url = new URL(decoded, new URL(stylesheetUrl, origin));
    // URL serialization can retain quotes and parentheses that CSS originally
    // escaped. Encode them so the rebased URL remains one CSS token.
    let replacement = url.href.slice(origin.length).replace(/["'()]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
    if (value.type === "string") replacement = `${value.quote}${replacement}${value.quote}`;
    replacements.push({ start: value.sourceIndex, end: value.sourceEndIndex, replacement });
    return false;
  });
  return replaceRanges(css, replacements);
}

function replaceRanges(input, replacements) {
  for (const { start, end, replacement } of replacements.sort((a, b) => b.start - a.start)) {
    input = input.slice(0, start) + replacement + input.slice(end);
  }
  return input;
}

async function htmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await htmlFiles(path)));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

function attributesForStyle(attributes) {
  return attributes
    .filter(({ name }) => name !== "href" && name !== "rel")
    .map(({ name, value }) =>
      value === "" ? ` ${name}` : ` ${name}="${value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;")}"`
    )
    .join("");
}

const stylesheetCache = new Map();
async function inlinePage(path) {
  const html = await readFile(path, "utf8");
  const document = parse(html, { sourceCodeLocationInfo: true });
  const pageUrl = `${baseurl}/${relative(dest, path).split(sep).join("/")}`;
  const replacements = [];
  async function visit(node) {
    if (node.tagName === "link") {
      const attributes = new Map(node.attrs.map(({ name, value }) => [name, value]));
      const rel = (attributes.get("rel") || "").toLowerCase().trim();
      const media = (attributes.get("media") || "").toLowerCase().trim();
      if (rel !== "stylesheet" || /^(?:print|none)$/.test(media) || ["defer", "async", "onload", "disabled"].some((name) => attributes.has(name)))
        return;
      const href = attributes.get("href");
      if (!href || /^(?:\/\/|[a-z][\w+.-]*:)/i.test(href)) return;
      const url = new URL(href, new URL(pageUrl, origin));
      if (!url.pathname.startsWith(`${baseurl}/`)) return;
      const asset = decodeURIComponent(url.pathname.slice(baseurl.length + 1));
      if (!/^assets\/css\/(?:(?:bootstrap\.min|main)\.css|mathjax\/[\w-]+\.css)$/.test(asset)) return;
      const file = join(dest, asset);
      if (!stylesheetCache.has(file)) {
        // An external UTF-8 decoder consumes the initial BOM. Inside an HTML
        // style element it becomes CSS text and would corrupt the first selector.
        const css = (purged.get(file) ?? (await readFile(file, "utf8"))).replace(/^\uFEFF/, "");
        if (/<\/style[\s/>]/i.test(css)) throw new Error(`Unsafe </style> in ${file}`);
        stylesheetCache.set(file, rebaseUrls(css, url.pathname));
      }
      const location = node.sourceCodeLocation;
      replacements.push({
        start: location.startOffset,
        end: location.endOffset,
        replacement: `<style${attributesForStyle(node.attrs)}>${stylesheetCache.get(file)}</style>`,
      });
    }
    for (const child of node.childNodes || []) await visit(child);
  }
  await visit(document);
  return replacements.length ? { path, html: replaceRanges(html, replacements), count: replacements.length } : null;
}

// Validate every page and stylesheet before writing; malformed/missing assets
// must stop the build instead of publishing partially optimized pages.
const changes = [];
for (const file of await htmlFiles(dest)) {
  const change = await inlinePage(file);
  if (change) changes.push(change);
}
for (const { path, html } of changes) await writeFile(path, html);
console.log(`Inlined ${changes.reduce((sum, { count }) => sum + count, 0)} blocking stylesheets across ${changes.length} pages`);
