import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const script = resolve("scripts/optimize-style-delivery.mjs");
const config = resolve("purgecss.config.js");

async function fixture(run) {
  const source = await mkdtemp(join(tmpdir(), "style-delivery-"));
  const dest = join(source, "different output");
  await mkdir(join(dest, "assets/css/mathjax"), { recursive: true });
  await mkdir(join(dest, "assets/js"), { recursive: true });
  await mkdir(join(dest, "blog/post"), { recursive: true });
  await writeFile(join(source, "purgecss.config.js"), `module.exports = require(${JSON.stringify(config)});\n`);
  try {
    await run({ source, dest });
  } finally {
    await rm(source, { recursive: true, force: true });
  }
}

function optimize({ source, dest }, baseurl = "/project") {
  return spawnSync(process.execPath, [script, "--source", source, "--dest", dest, "--baseurl", baseurl], {
    encoding: "utf8",
    timeout: 30_000,
  });
}

test("inlines the existing purge result in place, preserving HTML, runtime selectors, CSS order, and optional links", async () => {
  await fixture(async (site) => {
    const { dest } = site;
    const bootstrap = ".used { color: red; }\n.unused { color: blue; }\n.runtime-active { display: block; }\n";
    const main = "mjx-mtext[style] { font: inherit; }\n.used { background: url(../fonts/a.woff2?v=1#face); }\n";
    const math = 'mjx-container { src: url("../../fonts/math.woff2"); }\n';
    await writeFile(join(dest, "assets/css/bootstrap.min.css"), bootstrap);
    await writeFile(join(dest, "assets/css/main.css"), main);
    await writeFile(join(dest, "assets/css/mathjax/a1b2.css"), math);
    await writeFile(join(dest, "assets/js/runtime.mjs"), 'element.classList.add("runtime-active");');
    const links = [
      '<link rel="stylesheet" href="/project/assets/css/bootstrap.min.css?v=abc">',
      "<link REL='stylesheet' href='/project/assets/css/main.css?xyz' media='screen' id='theme'>",
      '<link rel="stylesheet" href="/project/assets/css/mathjax/a1b2.css" data-mathjax-prerender>',
    ];
    const optional =
      '<link rel="stylesheet" href="/project/assets/css/main.css" media="print" onload="this.media=\'all\'">\n<link defer rel="stylesheet" href="/project/assets/css/bootstrap.min.css">\n<link rel="stylesheet" href="https://example.com/assets/css/main.css">';
    const html = `<!DOCTYPE html>\n<HTML><head><!-- exact spacing -->${links[0]}\n<meta data-value='&amp;'>${links[1]}\n${optional}\n${links[2]}</head><body class="used">  prose &amp; punctuation<script>const literal = '<link rel="stylesheet" href="/project/assets/css/main.css">';</script></body></HTML>\n`;
    const page = join(dest, "blog/post/index.html");
    await writeFile(page, html);
    const result = optimize(site);
    assert.equal(result.status, 0, result.stderr);
    const output = await readFile(page, "utf8");
    const expectedStyles = [
      "<style>.used { color: red; }\n.runtime-active { display: block; }\n</style>",
      '<style media="screen" id="theme">mjx-mtext[style] { font: inherit; }\n.used { background: url(/project/assets/fonts/a.woff2?v=1#face); }\n</style>',
      '<style data-mathjax-prerender>mjx-container { src: url("/project/assets/fonts/math.woff2"); }\n</style>',
    ];
    let expected = html;
    links.forEach((link, index) => {
      expected = expected.replace(link, expectedStyles[index]);
    });
    assert.equal(output, expected, "Only the three source link ranges and relative CSS URLs may change");
    assert.equal(
      await readFile(join(dest, "assets/css/bootstrap.min.css"), "utf8"),
      bootstrap,
      "Watch rebuilds must retain the original CSS asset for the next purge"
    );
    const again = optimize(site);
    assert.equal(again.status, 0, again.stderr);
    assert.equal(await readFile(page, "utf8"), output, "Repeated optimization must be idempotent");

    await writeFile(join(dest, "assets/css/bootstrap.min.css"), bootstrap.replace("color: red", "color: green"));
    await writeFile(page, html);
    const rebuilt = optimize(site);
    assert.equal(rebuilt.status, 0, rebuilt.stderr);
    assert.match(await readFile(page, "utf8"), /color: green/, "A watch rebuild must use newly generated CSS");
  });
});

test("rebases relative CSS URLs for a root site and leaves absolute, data, fragment, escaped, and commented URLs intact", async () => {
  await fixture(async (site) => {
    const css = String.raw`body { a: url(../fonts/a.woff2); b: url('/fonts/b.woff2'); c: url(https://fonts.example/c); d: url(//fonts.example/d); e: url(data:image/svg+xml;base64,abc); f: url(#shape); g: "url(../not-a-url)"; h: url("../fonts/space\20 name.woff2"); i: url('../fonts/quote\'font.woff2'); j: url(../fonts/close\)font.woff2); } /* url(../comment) */`;
    await writeFile(join(site.dest, "assets/css/main.css"), css);
    const page = join(site.dest, "index.html");
    await writeFile(page, '<html><head><link rel="stylesheet" href="assets/css/main.css"></head><body></body></html>');
    const result = optimize(site, "");
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      await readFile(page, "utf8"),
      `<html><head><style>${css
        .replace("url(../fonts/a.woff2)", "url(/assets/fonts/a.woff2)")
        .replace('url("../fonts/space\\20 name.woff2")', 'url("/assets/fonts/space%20name.woff2")')
        .replace("url('../fonts/quote\\'font.woff2')", "url('/assets/fonts/quote%27font.woff2')")
        .replace("url(../fonts/close\\)font.woff2)", "url(/assets/fonts/close%29font.woff2)")}</style></head><body></body></html>`
    );
  });
});

test("strips the external stylesheet's initial UTF-8 BOM so root selectors and CSS variables survive inlining", async () => {
  await fixture(async (site) => {
    const css = ':root { --text-color: #345678; }\nbody { color: var(--text-color); }\nbody::before { content: "é\uFEFF"; }\n';
    const external = `\uFEFF${css}`;
    const main = join(site.dest, "assets/css/main.css");
    const math = join(site.dest, "assets/css/mathjax/a1b2.css");
    await writeFile(main, external);
    await writeFile(math, external);
    const page = join(site.dest, "index.html");
    await writeFile(
      page,
      '<html><head><link rel="stylesheet" href="/project/assets/css/main.css"><link rel="stylesheet" href="/project/assets/css/mathjax/a1b2.css" data-mathjax-prerender></head><body></body></html>'
    );
    const result = optimize(site);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      await readFile(page, "utf8"),
      `<html><head><style>${css}</style><style data-mathjax-prerender>${css}</style></head><body></body></html>`,
      "The style text must begin with :root, preserve non-ASCII text, and retain a BOM inside a CSS string"
    );
    assert.equal(await readFile(main, "utf8"), external, "The external asset and its encoding signature must remain unchanged");
    assert.equal(await readFile(math, "utf8"), external);
  });
});

test("fails without publishing partial HTML when a referenced stylesheet is absent or unsafe to inline", async () => {
  await fixture(async (site) => {
    const page = join(site.dest, "index.html");
    const html =
      '<html><head><link rel="stylesheet" href="/project/assets/css/main.css"><link rel="stylesheet" href="/project/assets/css/mathjax/missing.css"></head><body></body></html>';
    await writeFile(page, html);
    await writeFile(join(site.dest, "assets/css/main.css"), "body { color: red; }");
    const missing = optimize(site);
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /missing\.css/);
    assert.equal(await readFile(page, "utf8"), html);
    await writeFile(join(site.dest, "assets/css/mathjax/missing.css"), 'body { content: "</StYlE>"; }');
    const unsafe = optimize(site);
    assert.notEqual(unsafe.status, 0);
    assert.match(unsafe.stderr, /unsafe|style/i);
    assert.equal(await readFile(page, "utf8"), html);
  });
});
