import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { generatedFallbacks, multiplierFallbacks, memoryFallbacks, contractionFallback } from "../scripts/generate_lyapunov_print_fallbacks.mjs";
import * as contraction from "../assets/js/lyapunov-contraction-model.mjs";
import * as multipliers from "../assets/js/lyapunov-multipliers-model.mjs";
import * as memory from "../assets/js/lyapunov-memory-model.mjs";

const readDataset = async (name) => JSON.parse(await readFile(new URL(`../assets/data/lyapunov-${name}.json`, import.meta.url), "utf8"));
const curvePaths = (markup) => [...markup.matchAll(/<path class="([^"]*lc-curve[^"]*)" d="([^"]*)"/g)].map((match) => match[2]);

test("committed inline print plots are reproducible from the current datasets and models", async () => {
  for (const [name, expected] of Object.entries(await generatedFallbacks())) {
    assert.equal(await readFile(new URL(`../_includes/generated/${name}`, import.meta.url), "utf8"), expected, `Regenerate ${name}`);
    assert.doesNotMatch(expected, /NaN|Infinity|<script|<image|<use/);
  }
});

test("all seven printed multipliers retain the raw default solver curves, including gaps", async () => {
  const data = multipliers.validateDataset(await readDataset("multipliers"));
  const parameters = multipliers.createParameters();
  const points = multipliers.curvePoints(data, parameters);
  const panels = multiplierFallbacks(data);
  const bounds = { left: 56, right: 314, top: 80, bottom: 242 };
  for (const [index, components] of [[0], [1, 2], [3, 4], [5, 6]].entries()) {
    const geometry = multipliers.plotGeometry(
      parameters.gammaMax,
      bounds,
      points.filter((point) => point.values !== null).flatMap((point) => components.map((component) => point.values[component]))
    );
    assert.deepEqual(
      curvePaths(panels[index]),
      components.map((component) => multipliers.curvePath(points, component, geometry))
    );
  }
});

test("each printed memory panel preserves missing-certificate gaps and the two original curves", async () => {
  const data = memory.validateDataset(await readDataset("memory"));
  const panels = memoryFallbacks(data);
  const geometry = memory.plotGeometry({ left: 54, right: 440, top: 24, bottom: 264 });
  for (const [index, panel] of memory.methodCurves(data).entries()) {
    assert.deepEqual(
      curvePaths(panels[index]),
      panel.curves.map((curve) => memory.curvePath(curve.segments, geometry.x, geometry.y))
    );
  }
});

test("printed contraction curves use the default parameters and the original sampling and marker styles", async () => {
  const data = contraction.validateDataset(await readDataset("contraction"));
  const points = contraction.curvePoints(data, contraction.createParameters());
  const markup = contractionFallback(data);
  const paths = curvePaths(markup);
  assert.equal(paths.length, 3);
  for (const path of paths) {
    assert.equal([...path.matchAll(/[ML]/g)].length, points.length);
  }
  assert.equal([...markup.matchAll(/class="lc-marker lc-function-marker"/g)].length, 5);
  assert.equal([...markup.matchAll(/class="lc-marker lc-distance-marker"/g)].length, 5);
  assert.match(markup, /clip-path="url\(#\{\{ lyapunov_figure_id \}\}-print-clip\)"/);
});
