import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { validateDataset, METHODS, MODES } from "../assets/js/lyapunov-memory-model.mjs";

function dataset() {
  const path = new URL("../assets/data/lyapunov-memory.json", import.meta.url);
  assert.ok(existsSync(path), "The numerical Lyapunov-search dataset has not been generated");
  return validateDataset(JSON.parse(readFileSync(path, "utf8")));
}

test("the gradient-method curves recover its known optimal squared contraction factor", () => {
  const data = dataset();
  for (const mode of MODES) {
    data.axes.ratio.forEach((ratio, index) => {
      const actual = data.metrics.distance[mode].gradient[index];
      const expected = ((1 - ratio) / (1 + ratio)) ** 2;
      assert.notEqual(actual, null, `Missing gradient-method result at ${ratio}`);
      assert.ok(Math.abs(actual - expected) < 0.0005, `${mode}, μ/L=${ratio}: ${actual} versus ${expected}`);
    });
  }
});

test("restricting Q and q cannot improve the optimized factor", () => {
  const data = dataset();
  for (const { key: method } of METHODS) {
    data.metrics.distance.positive[method].forEach((positive, index) => {
      if (positive === null) return;
      const free = data.metrics.distance.free[method][index];
      assert.notEqual(free, null, `${method}: a restricted certificate must also be unrestricted-feasible`);
      assert.ok(free <= positive + 0.0005, `${method}, μ/L=${data.axes.ratio[index]}: free=${free}, restricted=${positive}`);
    });
  }
});

test("the dataset records the requested bisection tolerance and achieved numerical bracket widths", () => {
  const data = dataset();
  assert.equal(data.metadata.tolerance, 1e-10);
  assert.ok(Number.isFinite(data.metadata.validation.maxBracketWidth));
  assert.ok(data.metadata.validation.maxBracketWidth >= 0);
  assert.ok(Number.isInteger(data.metadata.validation.bracketsWiderThanTarget));
});

test("the triple-momentum comparison shows a gain from unrestricted coefficients", () => {
  const data = dataset();
  const free = data.metrics.distance.free.triple_momentum;
  const positive = data.metrics.distance.positive.triple_momentum;
  assert.ok(free.some((value, index) => value !== null && positive[index] !== null && positive[index] - value > 0.002));
});

test("the distance guarantees respect the scalar-quadratic spectral lower bound", () => {
  const data = dataset();
  for (const mode of MODES) {
    for (const { key: method } of METHODS) {
      data.axes.ratio.forEach((ratio, index) => {
        const factor = data.metrics.distance[mode][method][index];
        if (factor === null) return;
        const root = Math.sqrt(ratio);
        const momentum = (1 - root) / (1 + root);
        const [gamma, beta, alpha] = {
          gradient: [2 / (1 + ratio), 0, 0],
          heavy_ball: [4 / (1 + root) ** 2, momentum ** 2, 0],
          nesterov: [1, momentum, momentum],
          triple_momentum: [2 - root, (1 - root) ** 2 / (1 + root), (1 - root) ** 2 / ((2 - root) * (1 + root))],
        }[method];
        for (let sample = 0; sample <= 30; sample += 1) {
          const curvature = ratio + ((1 - ratio) * sample) / 30;
          const a = 1 + beta - gamma * curvature * (1 + alpha);
          const b = -beta + gamma * curvature * alpha;
          const discriminant = a * a + 4 * b;
          const spectral = discriminant < 0 ? -b : Math.max(Math.abs(a + Math.sqrt(discriminant)), Math.abs(a - Math.sqrt(discriminant))) ** 2 / 4;
          assert.ok(factor + 0.0005 >= spectral, `${method}/${mode}, μ/L=${ratio}, curvature=${curvature}: ${factor} below ${spectral}`);
        }
      });
    }
  }
});
