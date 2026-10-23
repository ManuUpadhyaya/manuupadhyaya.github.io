import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

test("production CSS purging keeps MathJax's runtime prose typography while removing unused styles", async () => {
  const source = await readFile(new URL("../../_sass/_base.scss", import.meta.url), "utf8");
  const typography = source.match(/^mjx-mtext\b[^{}]*\{[^{}]*\}/m)?.[0];
  assert.ok(typography, "The MathJax prose typography rule must be present in the source stylesheet");
  const directory = await mkdtemp(join(tmpdir(), "purgecss-mathjax-"));
  try {
    const css = join(directory, "typography.css");
    const html = join(directory, "index.html");
    const config = join(directory, "purgecss.config.cjs");
    const output = join(directory, "output");
    await writeFile(css, `${typography}\n.unused-proof { color: red; }\nmjx-unrelated-runtime-tag { color: blue; }\n`);
    // MathJax creates its text nodes after loading; the static site contains none.
    await writeFile(html, "<!doctype html><html><body><main><p>Ordinary prose</p></main></body></html>");
    await writeFile(
      config,
      `module.exports = { ...require(${JSON.stringify(resolve("purgecss.config.js"))}), content: [${JSON.stringify(html)}], css: [${JSON.stringify(
        css
      )}], output: ${JSON.stringify(output)} };\n`
    );
    const purge = spawnSync("npx", ["--yes", "purgecss@8.0.0", "--config", config], { encoding: "utf8", timeout: 120_000 });
    assert.equal(purge.status, 0, purge.error?.message || purge.stderr);
    const result = await readFile(join(output, "typography.css"), "utf8");
    assert.ok(result.includes(typography), "PurgeCSS must preserve both runtime text selectors and all their typography declarations");
    assert.ok(!result.includes("unused-proof"), "Unrelated unused classes should still be removed");
    assert.ok(!result.includes("mjx-unrelated-runtime-tag"), "The safelist should not retain every MathJax tag");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
