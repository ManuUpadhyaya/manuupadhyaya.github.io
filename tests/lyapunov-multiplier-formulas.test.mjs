import test from "node:test";
import assert from "node:assert/strict";
import { createParameters } from "../assets/js/lyapunov-contraction-model.mjs";
import { formulaCurvePoints } from "../assets/js/lyapunov-multiplier-formulas.mjs";

const data = { axes: { step: [0, 0.5, 1, 1.5, 2] } };
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} differs from ${expected}`);

test("analytic multiplier curves include the exact branch crossover and satisfy the certificate balances", () => {
  const parameters = createParameters();
  const points = formulaCurvePoints(data, parameters);
  const crossover = points.find((point) => Math.abs(point.gamma - 0.4) < 1e-12);
  assert.ok(crossover);
  [0.32, 0, 0.16, 0, 0.2, 0.8, 0].forEach((value, index) => near(crossover.values[index], value));
  for (const point of points) {
    const [tau, a, b, c, d, u, v] = point.values;
    const rho = Math.max(
      (1 - point.gamma * parameters.mu * (1 - parameters.epsilon)) ** 2,
      (1 - point.gamma * parameters.L * (1 + parameters.epsilon)) ** 2
    );
    near(-a + b - u + v, -rho);
    near(-c + d + u - v, 1);
    near(tau, (point.gamma * Math.sqrt(rho)) / (2 * parameters.epsilon));
    assert.equal(a, 0);
    assert.equal(c, 0);
    assert.equal(v, 0);
    assert.ok(point.values.every(Number.isFinite));
    assert.ok(point.gamma > 0 && point.gamma < parameters.gammaMax);
  }
});

test("analytic lambda values are curvature-scale invariant while tau scales inversely", () => {
  const initial = formulaCurvePoints(data, createParameters());
  const rescaled = formulaCurvePoints(data, createParameters({ L: 6, mu: 2 }));
  assert.equal(initial.length, rescaled.length);
  initial.forEach((point, index) => {
    near(rescaled[index].gamma, point.gamma / 2);
    near(rescaled[index].values[0], point.values[0] / 2);
    point.values.slice(1).forEach((value, component) => near(rescaled[index].values[component + 1], value));
  });
});

test("analytic overlays are unavailable at epsilon zero and stay inside the open domain near epsilon one", () => {
  assert.deepEqual(formulaCurvePoints(data, createParameters({ epsilon: 0 })), []);
  const parameters = createParameters({ epsilon: 0.99 });
  const points = formulaCurvePoints(data, parameters);
  assert.ok(points.length > data.axes.step.length);
  assert.ok(points.every((point) => point.step > 0 && point.step < 2 && point.values.every(Number.isFinite)));
});
