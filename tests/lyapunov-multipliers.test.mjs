import test from "node:test";
import assert from "node:assert/strict";
import {
  validateDataset,
  interpolateMultipliers,
  curvePoints,
  curvePath,
  plotGeometry,
  createParameters,
  updateParameters,
  controlTrack,
} from "../assets/js/lyapunov-multipliers-model.mjs";

function fixture() {
  const data = {
    version: 1,
    solver: "MOSEK Fusion",
    axes: { epsilon: [0.01, 0.99], ratio: [0.001, 0.99], step: [0, 0.7, 2] },
    order: ["tau", "k,star", "star,k", "k+1,star", "star,k+1", "k,k+1", "k+1,k"],
    values: [],
  };
  for (let e = 0; e < 2; e += 1) {
    for (let r = 0; r < 2; r += 1) {
      for (let s = 0; s < 3; s += 1) {
        for (let c = 0; c < 7; c += 1) data.values.push(100 * e + 20 * r + 4 * s + c);
      }
    }
  }
  return data;
}

function near(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} differs from ${expected}`);
}

test("raw multiplier interpolation follows point-major epsilon, ratio, step, component storage", () => {
  const data = validateDataset(fixture());
  assert.deepEqual(interpolateMultipliers(data, 0.01, 0.001, 0), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(interpolateMultipliers(data, 0.99, 0.99, 2), [128, 129, 130, 131, 132, 133, 134]);
  interpolateMultipliers(data, 0.5, 0.4955, 0.35).forEach((value, index) => near(value, 62 + index));
  interpolateMultipliers(data, 0.5, 0.4955, 1.35).forEach((value, index) => near(value, 66 + index));
});

test("missing records create gaps while exact valid knots ignore zero-weight missing neighbors", () => {
  const data = fixture();
  data.values.splice(7, 7, ...Array(7).fill(null));
  validateDataset(data);
  assert.deepEqual(interpolateMultipliers(data, 0.01, 0.001, 0), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(interpolateMultipliers(data, 0.01, 0.001, 0.35), null);
  assert.equal(interpolateMultipliers(data, 0.01, 0.001, 0.7), null);
  assert.equal(interpolateMultipliers(data, 0.5, 0.001, 0.7), null);
  assert.deepEqual(interpolateMultipliers(data, 0.01, 0.001, 2), [8, 9, 10, 11, 12, 13, 14]);
  assert.deepEqual(interpolateMultipliers(data, 0.99, 0.001, 0.7), [104, 105, 106, 107, 108, 109, 110]);
});

test("epsilon zero stays unavailable rather than borrowing a positive-error certificate", () => {
  const data = validateDataset(fixture());
  for (const step of [0, 0.4, 2]) assert.equal(interpolateMultipliers(data, 0, 0.5, step), null);
  const points = curvePoints(data, createParameters({ epsilon: 0 }));
  assert.ok(points.every((point) => point.values === null));
  assert.equal(curvePath(points, 0, { x: (value) => value, y: (value) => value }), "");
});

test("an optional exact-gradient face is accepted without blending its unavailable records into positive errors", () => {
  const data = fixture();
  data.axes.epsilon.unshift(0);
  data.values.unshift(...Array(2 * 3 * 7).fill(null));
  validateDataset(data);
  assert.equal(interpolateMultipliers(data, 0, 0.001, 0.7), null);
  assert.deepEqual(interpolateMultipliers(data, 0.01, 0.001, 0.7), [4, 5, 6, 7, 8, 9, 10]);
});

test("only tau rescales by actual L while lambda values and normalized raw knots stay unchanged", () => {
  const data = validateDataset(fixture());
  const parameters = createParameters({ epsilon: 0.99, L: 2, mu: 1.98 });
  const points = curvePoints(data, parameters);
  assert.deepEqual(
    points.map((point) => point.step),
    [0.000002, 0.7, 1.999998]
  );
  assert.deepEqual(points[1].values, [62, 125, 126, 127, 128, 129, 130]);
  assert.ok(points.at(-1).gamma < 2 / (2 * 1.99));
  assert.ok(points[0].gamma > 0);
  const doubled = curvePoints(data, createParameters({ epsilon: 0.99, L: 4, mu: 3.96 }));
  assert.deepEqual(doubled[1].values, [31, 125, 126, 127, 128, 129, 130]);
  near(doubled.at(-1).gamma, points.at(-1).gamma / 2);
});

test("display samples stay strictly inside the contraction interval while approaching both edges", () => {
  const data = validateDataset(fixture());
  const points = curvePoints(data, { epsilon: 0.01, ratio: 0.001, L: 1 });
  assert.ok(points.every((point) => point.step > 0 && point.step < 2));
  assert.ok(points[0].step < 0.00002);
  assert.ok(points.at(-1).step > 1.99998);
  assert.ok(points.some((point) => point.step === 0.7));
  near(points[0].values[0], 0.00001142857142857143);
  assert.deepEqual(interpolateMultipliers(data, 0.01, 0.001, 0), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(interpolateMultipliers(data, 0.01, 0.001, 2), [8, 9, 10, 11, 12, 13, 14]);
});

test("the rendered polyline preserves raw jumps, negative solver residuals, and gaps", () => {
  const points = [
    { gamma: 0, values: [-0.000001] },
    { gamma: 1, values: [100] },
    { gamma: 2, values: null },
    { gamma: 3, values: [1] },
    { gamma: 4, values: [0] },
  ];
  assert.equal(curvePath(points, 0, { x: (value) => value, y: (value) => value }), "M0,-0.000001 L1,100 M3,1 L4,0");
  const data = fixture();
  data.values[0] = -1e-9;
  validateDataset(data);
  assert.equal(interpolateMultipliers(data, 0.01, 0.001, 0)[0], -1e-9);
});

test("multiplier axes adapt independently to raw values and retain the shared gamma domain", () => {
  const bounds = { left: 10, right: 110, top: 5, bottom: 105 };
  const geometry = plotGeometry(0.5333333333333333, bounds, [0, 23, 0.001]);
  assert.deepEqual(geometry.xTicks, [0, 0.1, 0.2, 0.3, 0.4, 0.5]);
  assert.ok(geometry.yMinimum <= 0 && geometry.yMaximum > 23);
  assert.ok(geometry.yTicks.length >= 3 && geometry.yTicks.length <= 7);
  near(geometry.x(0.5333333333333333), 110);
  assert.ok(geometry.y(23) >= 5 && geometry.y(23) < 105);
  const small = plotGeometry(0.5333333333333333, bounds, [-0.0001, 0.002]);
  assert.ok(small.yMinimum < -0.0001 && small.yMaximum < 0.01);
  const empty = plotGeometry(1, bounds, []);
  assert.ok(Number.isFinite(empty.y(0)));
  assert.ok(empty.yMaximum > empty.yMinimum);
});

test("zero multiplier curves have visible clearance above the horizontal axis", () => {
  const bounds = { left: 10, right: 110, top: 5, bottom: 105 };
  for (const values of [
    [0, 0.6],
    [0, 0],
    [-1e-13, 0.6],
    [0, 1e6],
  ]) {
    const geometry = plotGeometry(1, bounds, values);
    assert.ok(geometry.y(0) > bounds.top + 3, "Zero must remain inside the plot");
    assert.ok(geometry.y(0) < bounds.bottom - 3, "Zero must clear the clipped lower edge and axis");
    assert.ok(geometry.yTicks.includes(0), "The zero level must remain labeled");
    assert.ok(
      geometry.yTicks.every((value) => value >= 0),
      "Padding must not introduce negative ticks"
    );
  }
});

test("axis scaling keeps raw solver noise visible without adding negative ticks", () => {
  const bounds = { left: 10, right: 110, top: 5, bottom: 105 };
  const noise = plotGeometry(1, bounds, [-1e-13, 0.6]);
  assert.ok(noise.yMinimum < 0);
  assert.ok(noise.y(-1e-13) < bounds.bottom, "The raw negative value must remain visible within the lower padding");
  assert.ok(noise.yTicks.every((value) => value >= 0));
  assert.equal(curvePath([{ gamma: 0, values: [-1e-13] }], 0, { x: (value) => value, y: (value) => value }), "M0,-1e-13");
  const material = plotGeometry(1, bounds, [-0.02, 0.6]);
  assert.ok(material.yMinimum < -0.02);
  const largeScaleNoise = plotGeometry(1, bounds, [-0.00005, 1e6]);
  assert.ok(largeScaleNoise.yMinimum < -0.00005);
  assert.ok(largeScaleNoise.yTicks.every((value) => value >= 0));
  const largeScaleNegative = plotGeometry(1, bounds, [-0.2, 1e6]);
  assert.ok(largeScaleNegative.yMinimum < -0.2);
});

test("the controls retain physical hundredth steps and prevent either curvature crossing", () => {
  const initial = createParameters();
  assert.deepEqual(controlTrack("L"), { minimum: 0, maximum: 10, step: 0.01 });
  const lowerL = updateParameters(initial, "L", 0);
  assert.equal(lowerL.L, 1.02);
  assert.equal(lowerL.mu, 1);
  const raiseMu = updateParameters(initial, "mu", 10);
  assert.equal(raiseMu.L, 3);
  assert.equal(raiseMu.mu, 2.97);
  assert.equal(updateParameters(initial, "epsilon", 0.01).epsilon, 0.01);
});

test("malformed raw datasets and out-of-range interpolation are rejected", () => {
  for (const mutate of [
    (data) => {
      data.version = 2;
    },
    (data) => {
      data.solver = "analytic";
    },
    (data) => {
      data.order.reverse();
    },
    (data) => {
      data.axes.epsilon[0] = 0.02;
    },
    (data) => {
      data.axes.epsilon[1] = 1;
    },
    (data) => {
      data.axes.step[2] = 2.4;
    },
    (data) => {
      data.axes.ratio[0] = 0;
    },
    (data) => {
      data.axes.step = [0, 2, 0.7];
    },
    (data) => {
      data.values.pop();
    },
    (data) => {
      data.values[0] = null;
    },
    (data) => {
      data.values[0] = Infinity;
    },
  ]) {
    const data = fixture();
    mutate(data);
    assert.throws(() => validateDataset(data));
  }
  const data = validateDataset(fixture());
  for (const [epsilon, ratio, step] of [
    [-0.01, 0.5, 0],
    [1, 0.5, 0],
    [0.5, 0, 0],
    [0.5, 1, 0],
    [0.5, 0.5, 3],
  ]) {
    assert.throws(() => interpolateMultipliers(data, epsilon, ratio, step));
  }
});
