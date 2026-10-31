import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { parse, serialize } from "parse5";

const root = fileURLToPath(new URL("../", import.meta.url));
function render(...requests) {
  const result = spawnSync(process.execPath, ["scripts/render-math.mjs"], {
    cwd: root,
    input: requests.map((request) => JSON.stringify(typeof request === "string" ? { html: request } : request)).join("\n") + "\n",
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr || "renderer must finish successfully");
  return result.stdout
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
}

function elements(node, tagName) {
  return [...(node.tagName === tagName ? [node] : []), ...(node.childNodes || []).flatMap((child) => elements(child, tagName))];
}

function attribute(node, name) {
  return node.attrs.find((item) => item.name === name)?.value;
}

function textContent(node) {
  return node.value ?? (node.childNodes || []).map(textContent).join("");
}

test("source metadata compaction preserves the complete rendered DOM and stylesheet", () => {
  const html = String.raw`<!DOCTYPE html><html lang="en"><head><title>Math metadata baseline</title></head><body><p id="prose" data-latex="retain &amp; preserve">See $\eqref{matrix}$ and $\ref{matrix}$, then $x^2+\tfrac{1}{2}$.</p><strong>$x+\text{and}$</strong><details><summary>Proof</summary>\begin{equation}\label{matrix}\tag{A.2}\begin{aligned}M&=\begin{pmatrix}-a&\phantom{-}0\\\phantom{-}b&-1\end{pmatrix}\\v&=\begin{pmatrix}\text{maximum}\\\tfrac{1}{2}\end{pmatrix}\end{aligned}\end{equation}</details><p>$\eqref{matrix}+x$</p></body></html>`;
  const [result] = render(html);
  assert.equal(result.error, undefined);
  const document = parse(result.html);
  const math = elements(document, "mjx-container");
  assert.equal(math.length, 6);
  assert.ok(
    math.every((node) => !serialize(node).includes(" data-latex=")),
    "generated source copies must be removed"
  );
  assert.equal(attribute(elements(document, "p")[0], "data-latex"), "retain & preserve");
  assert.deepEqual(elements(document, "annotation").map(textContent), [
    String.raw`\eqref{matrix}`,
    String.raw`\ref{matrix}`,
    String.raw`x^2+\tfrac{1}{2}`,
    String.raw`x+\text{and}`,
    String.raw`\begin{equation}\label{matrix}\tag{A.2}\begin{aligned}M&=\begin{pmatrix}-a&\phantom{-}0\\\phantom{-}b&-1\end{pmatrix}\\v&=\begin{pmatrix}\text{maximum}\\\tfrac{1}{2}\end{pmatrix}\end{aligned}\end{equation}`,
    String.raw`\eqref{matrix}+x`,
  ]);
  // Captured from MathJax 4.1.3 before compaction, permitting only removal of
  // generated data-latex and the separately tested standalone-reference ARIA fix.
  const digest = (value) => createHash("sha256").update(value).digest("hex");
  assert.equal(digest(serialize(document)), "3948ff91171b733c5715f35cd132fcf5b81e82b5f63cf455b15c7b869d914632");
  assert.equal(digest(result.css), "8665fed3c63c39bbd539b28facb996e63d119da6164243a200643a260b270e63");
  assert.equal(digest(JSON.stringify(result.fonts)), "75778d715975002a339c27df36d844f339164e085a4449634297f31919965624");
});

test("standalone equation references expose one named native keyboard link", () => {
  const [result] = render(
    String.raw`<p>$ \eqref {later} $ and $\ref{later}$.</p><p>$\boldsymbol{\eqref{later}}$</p>\begin{equation}x=1\label{later}\tag{A.2}\end{equation}<p>$\eqref{later}+x$</p>`
  );
  assert.equal(result.error, undefined);
  const math = elements(parse(result.html), "mjx-container");
  for (const node of math.slice(0, 2)) {
    const chtml = elements(node, "mjx-math")[0];
    const links = elements(chtml, "a");
    assert.equal(links.length, 1);
    assert.equal(attribute(chtml, "aria-hidden"), undefined, "the native link must be exposed to assistive technology");
    assert.equal(attribute(links[0], "href"), "#mjx-eqn%3Alater");
    assert.equal(attribute(links[0], "tabindex"), undefined, "native keyboard order must be preserved");
    assert.equal(attribute(links[0], "aria-label"), "Equation A.2");
    assert.equal(attribute(elements(node, "mjx-assistive-mml")[0], "aria-hidden"), "true", "the duplicate MathML must not be spoken");
    assert.equal(elements(node, "annotation").length, 1);
  }
  for (const node of math.slice(2)) {
    assert.equal(attribute(elements(node, "mjx-math")[0], "aria-hidden"), "true", "other mathematics must retain its assistive MathML");
    assert.equal(attribute(elements(node, "mjx-assistive-mml")[0], "aria-hidden"), undefined);
    assert.ok(elements(node, "a").every((link) => attribute(link, "aria-label") === undefined));
  }
});

test("initial HTML contains CHTML and accessible MathML with local NewCM CSS", () => {
  const [result] = render(
    '<!DOCTYPE html><html lang="en"><head><title>Untouched</title></head><body><p id="intro" data-test="preserved">Before $x^2$ after.</p></body></html>'
  );
  assert.equal(result.error, undefined);
  assert.match(result.html, /<html lang="en">/);
  assert.match(result.html, /<p id="intro" data-test="preserved">Before <mjx-container/);
  assert.match(result.html, /<mjx-assistive-mml[^>]*>.*<math /s);
  assert.match(result.html, /<annotation encoding="application\/x-tex">x\^2<\/annotation>/);
  assert.match(result.html, /font-size: 92%/);
  assert.doesNotMatch(result.html, /\$x\^2\$/);
  assert.match(result.css, /\/assets\/fonts\/mathjax-newcm-4\.1\.3\//);
  assert.doesNotMatch(result.css, /https?:\/\//);
  assert.ok(result.fonts.length > 0);
});

test("forward equation references resolve and numbering resets for every document", () => {
  const html = String.raw`<body><p>See $\eqref{later}$.</p>\begin{equation}x=1\label{later}\end{equation}</body>`;
  const results = render(html, html);
  for (const result of results) {
    assert.equal(result.error, undefined);
    assert.match(result.html, /href="#mjx-eqn%3Alater"/);
    assert.match(result.html, /id="mjx-eqn:later"/);
    assert.doesNotMatch(result.html, /\?\?\?/);
    assert.match(result.css, /@font-face/);
    assert.doesNotMatch(result.html, /NaN|Infinity/);
  }
  assert.equal(results[0].html, results[1].html);
  assert.equal(results[0].css, results[1].css);
});

test("site macros, mathtools and boldsymbol are available", () => {
  const [result] = render(String.raw`<p>$\norm{x}+\inner{x}{y}+\Bignorm{x}+\Biginner{x}{y}+\coloneqq+\boldsymbol{z}$</p>`);
  assert.equal(result.error, undefined);
  assert.match(result.html, /<mjx-container/);
  assert.doesNotMatch(result.html, /mjx-merror/);
});

test("bold contexts use the shared configuration while publications stay regular", () => {
  const [result] = render(
    String.raw`<body><strong id="bold">$x+\text{and}$</strong><div class="publications"><strong id="publication">$x+\text{and}$</strong></div></body>`
  );
  assert.equal(result.error, undefined);
  const bold = result.html.split('id="bold"')[1].split("</strong>")[0];
  const publication = result.html.split('id="publication"')[1].split("</strong>")[0];
  assert.match(bold, /font-weight: bold/);
  assert.doesNotMatch(publication, /font-weight: bold/);
  assert.match(bold, /mathvariant="bold"/);
});

test("hidden responsive copies receive the same nonzero inherited prose metrics", () => {
  const [result] = render(
    String.raw`<body><div id="visible">$\begin{matrix}\text{maximum}\\x\end{matrix}$</div><div id="hidden" style="display:none">$\begin{matrix}\text{maximum}\\x\end{matrix}$</div></body>`
  );
  assert.equal(result.error, undefined);
  const widths = [...result.html.matchAll(/<mjx-utext[^>]*style="[^"]*width: ([0-9.]+)em/g)].map((match) => Number(match[1]));
  assert.equal(widths.length, 2);
  assert.ok(widths[0] > 3);
  assert.equal(widths[0], widths[1]);
  assert.match(result.html, /id="hidden" style="display:none"/);
});

test("top-level inherited prose receives the existing size compensation", () => {
  const [result] = render(String.raw`<p>$\text{and}+x_{\text{as}}$</p>`);
  assert.equal(result.error, undefined);
  assert.match(result.html, /font-size: 108\.7%/);
  assert.match(result.html, /<mjx-utext[^>]*>and<\/mjx-utext>/);
  assert.match(result.html, /<mjx-utext[^>]*>as<\/mjx-utext>/);
});

test("code and document attributes survive rendering", () => {
  const [result] = render(
    String.raw`<html data-theme="dark"><head><script>const comparison = 2 < 3;</script></head><body><pre><code>$untouched$ &lt;em&gt;</code></pre><p data-value="a&amp;b">$x$</p></body></html>`
  );
  assert.equal(result.error, undefined);
  assert.match(result.html, /<code>\$untouched\$ &lt;em&gt;<\/code>/);
  assert.match(result.html, /const comparison = 2 < 3;/);
  assert.match(result.html, /data-value="a&amp;b"/);
});

test("browser-ignored void end tags in the generated site do not break the document", () => {
  const [result] = render('<html><body><picture><source srcset="figure.webp"></source><img src="figure.png"></picture><p>$x$</p></body></html>');
  assert.equal(result.error, undefined);
  assert.match(result.html, /<source srcset="figure.webp">/);
  assert.match(result.html, /<img src="figure.png">/);
  assert.match(result.html, /<p><mjx-container/);
});

test("inline SVG casing and embedded script data survive the HTML parser", () => {
  const [result] = render(
    '<html><head><script type="application/ld+json">{"less":"<","literal":"$x$","escaped":"\\u003c"}</script></head><body><svg viewBox="0 0 10 10" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="ink"><stop offset="0%"/></linearGradient></defs><foreignObject width="10" height="10"><div xmlns="http://www.w3.org/1999/xhtml">$x$</div></foreignObject></svg></body></html>'
  );
  assert.equal(result.error, undefined);
  assert.match(result.html, /viewBox="0 0 10 10" preserveAspectRatio="xMidYMid meet"/);
  assert.match(result.html, /<linearGradient id="ink">/);
  assert.match(result.html, /<foreignObject width="10" height="10">/);
  assert.match(result.html, /<script type="application\/ld\+json">\{"less":"<","literal":"\$x\$","escaped":"\\u003c"\}<\/script>/);
});

test("valid unquoted HTML attributes remain attributes", () => {
  const [result] = render("<html><body><p id=lead data-value=a>$x$</p></body></html>");
  assert.equal(result.error, undefined);
  assert.match(result.html, /<p id="lead" data-value="a"><mjx-container/);
});

test("fieldset content and mathematics survive HTML parsing and serialization", () => {
  const [result] = render(
    "<html><body><fieldset><legend>Parameters</legend><p>Before $x$ after.</p></fieldset><p>Following prose.</p></body></html>"
  );
  assert.equal(result.error, undefined);
  assert.match(result.html, /<fieldset><legend>Parameters<\/legend><p>Before <mjx-container/);
  assert.match(result.html, /after\.<\/p><\/fieldset><p>Following prose\.<\/p>/);
});

test("uppercase raw-text and title closing tags preserve the following document", () => {
  const [result] = render(
    '<HTML><HEAD><TITLE>Title &amp; context</TITLE><SCRIPT>const value = "<p>$untouched$</p>";</SCRIPT></HEAD><BODY><p>Before $x$ after.</p></BODY></HTML>'
  );
  assert.equal(result.error, undefined);
  assert.match(result.html, /<title>Title &amp; context<\/title>/);
  assert.match(result.html, /<script>const value = "<p>\$untouched\$<\/p>";<\/script>/);
  assert.match(result.html, /<body><p>Before <mjx-container/);
  assert.match(result.html, /after\.<\/p><\/body><\/html>/);
});

test("HTML5 paragraph and table handling retains prose and mathematics", () => {
  const [result] = render(
    "<!DOCTYPE html><html><body><p>Opening prose<div>Block $x$</div>Following prose<p>Next paragraph<table>Before table<tr><td>Cell $y$</td></tr></table>After table</body></html>"
  );
  assert.equal(result.error, undefined);
  assert.match(result.html, /<p>Opening prose<\/p><div>Block <mjx-container/);
  assert.match(result.html, /Following prose<p>Next paragraph<\/p>Before table<table><tbody><tr><td>Cell <mjx-container/);
  assert.match(result.html, /<\/td><\/tr><\/tbody><\/table>After table/);
});

test("unsupported math fonts fail explicitly while NewCM aliases remain supported", () => {
  const [unsupported, normal, alias] = render(
    { html: "<p>$x$</p>", options: { font: "tex" } },
    { html: "<p>$x$</p>", options: { font: "mathjax-newcm" } },
    { html: "<p>$x$</p>", options: { font: "[mathjax-newcm]" } }
  );
  assert.match(unsupported.error.message, /Unsupported.*font.*tex.*mathjax-newcm/i);
  assert.equal(normal.error, undefined);
  assert.equal(alias.error, undefined);
  assert.equal(normal.html, alias.html);
});

test("font URLs respect baseurl and a caller-provided font location", () => {
  const [result] = render({ html: "<p>$x$</p>", options: { fontURL: "/preview/assets/fonts/mathjax-newcm-4.1.3" } });
  assert.match(result.css, /\/preview\/assets\/fonts\/mathjax-newcm-4\.1\.3\//);
});

test("invalid TeX reports an actionable error and the worker accepts the next page", () => {
  const [invalid, valid] = render(String.raw`<p>$\definitelyUndefinedCommand{x}$</p>`, "<p>$y$</p>");
  assert.match(invalid.error.message, /Undefined control sequence/);
  assert.equal(valid.error, undefined);
  assert.match(valid.html, /<mjx-container/);
});
