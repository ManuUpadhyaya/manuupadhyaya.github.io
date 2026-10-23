import assert from "node:assert/strict";
import test from "node:test";
import {
  validateDataset,
  interpolateMetric,
  createParameters,
  updateParameters,
  parameterBounds,
  controlTrack,
  curvePoints,
  plotGeometry,
  chooseLabelPosition,
  closedFormFunction,
  curveMaximumInRange,
} from "../assets/js/lyapunov-contraction-model.mjs";

function fixture() {
  return {
    version: 1,
    solver: "MOSEK Fusion",
    axes: { epsilon: [0, 0.99], ratio: [0.001, 0.99], step: [0, 0.7, 1.4, 2] },
    metrics: {
      distance: [0, 7, 20, 24, 4, 11, 24, 28, 2, 9, 22, 26, 6, 13, 26, 30],
      function: [100, 107, 120, 124, 140, 147, 160, 164, 120, 127, 140, 144, 160, 167, 180, 184],
    },
    metadata: {},
  };
}

function refinedFixture(endpoint) {
  const data = fixture();
  data.axes.epsilon = [0, 0.5, 0.99];
  data.axes.ratio = [0.001, 0.25, 0.75, 0.99];
  const sources = [
    [0.4, 0.1],
    [0.4, 0.1],
    [0.8, 0.2],
    [0.8, 0.2],
    [1.4, 0.3],
    [1.4, 0.3],
    [1.81, 0.4],
    [1.81, 0.4],
    [1.4, 0.3],
    [1.4, 0.3],
    [1.81, 0.4],
    [1.81, 0.4],
  ];
  data.metrics = { distance: [], function: [] };
  data.refinements = { function: [] };
  for (const [index, [interiorMinimum, minimumRho]] of sources.entries()) {
    const minimumStep = endpoint ?? interiorMinimum;
    const value = (step) => minimumRho + Math.abs(step - minimumStep);
    data.metrics.function.push(...data.axes.step.map(value));
    data.metrics.distance.push(...data.axes.step.map((step) => (index < 4 ? value(step) : 5)));
    const localSteps = minimumStep === 0.4 ? [0.2, 0.4] : [minimumStep];
    data.refinements.function.push({ step: localSteps, rho: localSteps.map(value), minimumStep, minimumRho });
  }
  return data;
}

function approximatelyEqual(actual, expected, tolerance = 1e-10) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance, `Expected ${actual} to be within ${tolerance} of ${expected}`);
}

test("grid interpolation follows epsilon-major, ratio-middle, step-fast storage", () => {
  const data = validateDataset(fixture());
  assert.equal(interpolateMetric(data, "distance", 0.99, 0.001, 0.7), 9);
  assert.equal(interpolateMetric(data, "function", 0.99, 0.99, 2), 184);
  assert.equal(interpolateMetric(data, "distance", 0, 0.001, 0), 0);
});

test("interpolation blends both parameters and the actual nonuniform step interval", () => {
  const data = validateDataset(fixture());
  approximatelyEqual(interpolateMetric(data, "distance", 0.495, 0.24825, 1.05), 15.5);
  approximatelyEqual(interpolateMetric(data, "function", 0.495, 0.24825, 1.05), 133.5);
});

test("piecewise linear interpolation preserves local bounds around a sharp corner", () => {
  const data = fixture();
  data.metrics.distance = [0, 10, 0, 0, 0, 10, 0, 0, 0, 10, 0, 0, 0, 10, 0, 0];
  validateDataset(data);
  approximatelyEqual(interpolateMetric(data, "distance", 0.3, 0.6, 0.35), 5);
  approximatelyEqual(interpolateMetric(data, "distance", 0.3, 0.6, 1.05), 5);
  assert.equal(interpolateMetric(data, "distance", 0.3, 0.6, 1.8), 0);
});

test("invalid or incomplete solver grids are rejected instead of producing a replacement curve", () => {
  const invalid = [
    (data) => {
      data.version = 2;
    },
    (data) => {
      data.axes.epsilon = [0, 0.5];
    },
    (data) => {
      data.axes.ratio = [0, 0.99];
    },
    (data) => {
      data.axes.ratio = [0.01, 1];
    },
    (data) => {
      data.axes.step = [0, 1.4, 0.7, 2];
    },
    (data) => {
      data.axes.step = [0, 0.7, 0.7, 2];
    },
    (data) => {
      data.axes.epsilon[1] = 1;
    },
    (data) => {
      data.axes.step[3] = 2.01;
    },
    (data) => {
      data.metrics.distance.pop();
    },
    (data) => {
      data.metrics.function[5] = null;
    },
    (data) => {
      data.metrics.distance[5] = Number.NaN;
    },
    (data) => {
      data.metrics.distance[5] = -0.1;
    },
  ];
  for (const mutate of invalid) {
    const data = fixture();
    mutate(data);
    assert.throws(() => validateDataset(data));
  }
});

test("interpolation refuses parameters outside the supplied data range", () => {
  const data = validateDataset(fixture());
  for (const [epsilon, ratio, step] of [
    [-0.01, 0.01, 0],
    [1, 0.01, 0],
    [0, 0, 0],
    [0, 1, 0],
    [0, 0.01, 2.01],
    [0, 0.01, Number.NaN],
  ]) {
    assert.throws(() => interpolateMetric(data, "distance", epsilon, ratio, step));
  }
});

test("changing L preserves mu exactly and rescales the gamma axis", () => {
  const initial = createParameters({ epsilon: 0.5, L: 3, mu: 1 });
  const changed = updateParameters(initial, "L", 6);
  approximatelyEqual(initial.mu, 1);
  approximatelyEqual(initial.gammaMax, 2 / 4.5);
  approximatelyEqual(initial.stableGamma, 2 / 4.5);
  assert.equal(changed.mu, 1);
  approximatelyEqual(changed.ratio, 1 / 6);
  approximatelyEqual(changed.gammaMax, 2 / 9);
});

test("sliders keep both curvatures strictly positive and enforce the requested endpoints", () => {
  const initial = createParameters({ epsilon: 0.5, L: 3, mu: 1 });
  assert.equal(updateParameters(initial, "mu", -1).mu, 0.01);
  approximatelyEqual(updateParameters(initial, "mu", 100).mu, 2.97);
  assert.equal(updateParameters(createParameters({ L: 3, mu: 0.01 }), "L", 0).L, 0.1);
  assert.equal(updateParameters(initial, "L", 100).L, 10);
  assert.equal(updateParameters(initial, "epsilon", 1).epsilon, 0.99);
  assert.equal(updateParameters(initial, "epsilon", 100).epsilon, 0.99);
  assert.equal(createParameters({ epsilon: 100 }).epsilon, 0.99);
  assert.ok(createParameters({ epsilon: 1 }).stableGamma > 0);
  assert.equal(updateParameters(initial, "epsilon", -1).epsilon, 0);
  assert.throws(() => updateParameters(initial, "L", Number.NaN));
});

test("trying to lower L through mu clamps only L without changing mu", () => {
  const initial = createParameters({ L: 3, mu: 1 });
  const changed = updateParameters(initial, "L", 0.1);
  assert.equal(changed.mu, 1);
  assert.equal(changed.L, 1.02);
  assert.ok(changed.ratio <= 0.99);
});

test("trying to raise mu through L clamps only mu without changing L", () => {
  const initial = createParameters({ L: 3, mu: 1 });
  const changed = updateParameters(initial, "mu", 10);
  assert.equal(changed.L, 3);
  approximatelyEqual(changed.mu, 2.97);
  approximatelyEqual(changed.ratio, 0.99);
});

test("fixed physical parameters do not drift across repeated boundary updates", () => {
  const initial = createParameters({ L: 3, mu: 0.07 });
  let changed = initial;
  for (let index = 0; index < 20; index += 1) {
    changed = updateParameters(changed, "L", 0);
    changed = updateParameters(changed, "epsilon", index / 20);
    changed = updateParameters(changed, "L", 10);
    assert.equal(changed.mu, 0.07);
  }
  const smallestRatio = updateParameters(createParameters({ L: 1, mu: 0.01 }), "L", 10);
  assert.equal(smallestRatio.mu, 0.01);
  assert.equal(smallestRatio.ratio, 0.001);
});

test("boundary clamping stays on the hundredth grid and preserves the fixed value", () => {
  const lowerL = updateParameters(createParameters({ L: 3, mu: 0.49 }), "L", 0);
  assert.equal(lowerL.mu, 0.49);
  assert.equal(lowerL.L, 0.5);
  assert.equal(parameterBounds(lowerL).L.minimum, 0.5);
  const raiseMu = updateParameters(createParameters({ L: 0.12, mu: 0.01 }), "mu", 1);
  assert.equal(raiseMu.L, 0.12);
  assert.equal(raiseMu.mu, 0.11);
  assert.equal(parameterBounds(raiseMu).mu.maximum, 0.11);
});

test("each slider advances by a physical hundredth and rounds off-grid input", () => {
  const initial = createParameters();
  assert.equal(updateParameters(initial, "L", 3.01).L, 3.01);
  assert.equal(updateParameters(initial, "L", 3.01).mu, 1);
  assert.equal(updateParameters(initial, "mu", 1.01).mu, 1.01);
  assert.equal(updateParameters(initial, "mu", 1.01).L, 3);
  assert.equal(updateParameters(initial, "epsilon", 0.51).epsilon, 0.51);
  assert.equal(updateParameters(initial, "L", 3.014).L, 3.01);
});

test("shared physical tracks keep the mu handle left of L after either attempted crossing", () => {
  const initial = createParameters({ L: 3, mu: 1 });
  const position = (parameters, name) => {
    const track = controlTrack(name);
    return (parameters[name] - track.minimum) / (track.maximum - track.minimum);
  };
  assert.equal(position(initial, "L"), 0.3);
  assert.equal(position(initial, "mu"), 0.1);
  const raiseMu = updateParameters(initial, "mu", 10);
  approximatelyEqual(position(raiseMu, "mu"), 0.297);
  assert.ok(position(raiseMu, "mu") < position(raiseMu, "L"));
  assert.equal(raiseMu.L, 3);
  const lowerL = updateParameters(initial, "L", 0);
  approximatelyEqual(position(lowerL, "L"), 0.102);
  assert.ok(position(lowerL, "mu") < position(lowerL, "L"));
  assert.equal(lowerL.mu, 1);
});

test("the fixed vertical window preserves values above the frame for honest clipping", () => {
  const geometry = plotGeometry(0.5333333333333333, { left: 10, right: 110, top: 5, bottom: 115 });
  assert.deepEqual(geometry.yTicks, [0, 0.2, 0.4, 0.6, 0.8, 1]);
  approximatelyEqual(geometry.y(0), 115);
  approximatelyEqual(geometry.y(1.1), 5);
  assert.ok(geometry.y(1.2) < 5, "Above-window values must stay above the frame, rather than being flattened at its edge");
  approximatelyEqual(geometry.x(0), 10);
  approximatelyEqual(geometry.x(0.5333333333333333), 110);
});

test("the vertical window leaves breathing room below the lower curve minimum", () => {
  const bounds = { left: 10, right: 110, top: 5, bottom: 115 };
  const geometry = plotGeometry(0.5333333333333333, bounds, 0.64);
  assert.equal(geometry.yMinimum, 0.6);
  assert.equal(geometry.yMaximum, 1.1);
  assert.deepEqual(geometry.yTicks, [0.6, 0.7, 0.8, 0.9, 1, 1.1]);
  assert.ok(geometry.y(0.64) > bounds.top && geometry.y(0.64) < bounds.bottom);
  approximatelyEqual(geometry.y(1.1), bounds.top);
  assert.ok(geometry.y(0.59) > bounds.bottom);
  const lowerMinimum = plotGeometry(1, bounds, 0.25);
  assert.ok(lowerMinimum.yMinimum >= 0.1 && lowerMinimum.yMinimum < 0.25);
  const nearOne = plotGeometry(1, bounds, 0.999);
  assert.ok(nearOne.yMaximum - nearOne.yMinimum >= 0.15 - 1e-12);
  assert.ok(nearOne.yMinimum < 0.999);
  assert.ok(nearOne.yTicks.length >= 4 && nearOne.yTicks.length <= 7);
});

test("legend clearance uses interpolated span endpoints without including distant peaks", () => {
  const points = [
    { gamma: 0, distance: 0, function: 0, closedForm: 0 },
    { gamma: 1, distance: 2, function: 1, closedForm: 1.5 },
    { gamma: 2, distance: 100, function: 100, closedForm: 100 },
  ];
  approximatelyEqual(curveMaximumInRange(points, 0.25, 0.75), 1.5);
});

test("legend clearance retains coincident sampling knots after step-size rescaling", () => {
  const points = [
    { gamma: 0, distance: 0, function: 0, closedForm: 0 },
    { gamma: 0.5, distance: 1, function: 1, closedForm: 1 },
    { gamma: 0.5, distance: 3, function: 2, closedForm: 2 },
    { gamma: 1, distance: 2, function: 1, closedForm: 1 },
  ];
  assert.equal(curveMaximumInRange(points, 0.4, 0.6), 3);
});

test("the upper axis limit reserves space for a fixed legend while retaining the lower window", () => {
  const bounds = { left: 10, right: 110, top: 5, bottom: 115 };
  const baseline = plotGeometry(1, bounds, 0.64);
  const geometry = plotGeometry(1, bounds, 0.64, { maximum: 1.4, fraction: 0.3 });
  assert.equal(geometry.yMinimum, baseline.yMinimum);
  assert.ok(geometry.y(1.4) >= bounds.top + 0.3 * (bounds.bottom - bounds.top));
  assert.ok(geometry.yMaximum > baseline.yMaximum);
  assert.ok(geometry.yTicks.includes(1));
  assert.ok(geometry.y(geometry.yMaximum + 0.1) < bounds.top);
  const alreadyClear = plotGeometry(1, bounds, 0.64, { maximum: 0.8, fraction: 0.2 });
  assert.equal(alreadyClear.yMaximum, baseline.yMaximum);
});

test("label placement prefers the first empty box and detects crossings between sampled endpoints", () => {
  const candidates = [
    { x: 8, y: 152 },
    { x: 312, y: 152 },
    { x: 8, y: 8 },
    { x: 312, y: 8 },
  ];
  const crossing = [
    [
      { x: 90, y: 130 },
      { x: 90, y: 210 },
    ],
  ];
  assert.deepEqual(chooseLabelPosition(crossing, candidates, { width: 60, height: 40 }), candidates[0]);
  assert.deepEqual(chooseLabelPosition(crossing, candidates, { width: 100, height: 40 }), candidates[1]);
});

test("reference label placement avoids the measured legend box", () => {
  const candidates = [
    { x: 300, y: 20 },
    { x: 180, y: 20 },
    { x: 10, y: 20 },
  ];
  const occupied = [{ x: 300, y: 20, width: 80, height: 20 }];
  assert.deepEqual(chooseLabelPosition([], candidates, { width: 80, height: 20 }, occupied), candidates[1]);
});

test("step-size ticks use readable intervals inside the actual horizontal domain", () => {
  const bounds = { left: 0, right: 100, top: 0, bottom: 100 };
  for (const [maximum, expected] of [
    [0.5333333333333333, [0, 0.1, 0.2, 0.3, 0.4, 0.5]],
    [24, [0, 5, 10, 15, 20]],
    [0.12060301507537688, [0, 0.025, 0.05, 0.075, 0.1]],
  ]) {
    const geometry = plotGeometry(maximum, bounds);
    assert.deepEqual(geometry.xTicks, expected);
    assert.ok(geometry.xTicks.every((value) => value <= maximum));
  }
});

test("display curves stay strictly inside the contraction step interval while preserving source corners", () => {
  const data = validateDataset(fixture());
  const initial = createParameters({ epsilon: 0.5, L: 3, mu: 1 });
  const points = curvePoints(data, initial);
  assert.ok(points.length >= 121);
  assert.ok(points.every((point) => point.step > 0 && point.step < 2 && point.gamma > 0 && point.gamma < initial.gammaMax));
  assert.ok(points[0].step < 1e-5);
  assert.ok(points.at(-1).step > 2 - 1e-5);
  for (const step of [0.7, 1.4]) assert.ok(points.some((point) => Math.abs(point.step - step) < 1e-12));
  assert.ok(points.some((point) => point.function > 1));
  const rescaled = curvePoints(data, createParameters({ epsilon: 0.5, L: 6, mu: 2 }));
  approximatelyEqual(rescaled.at(-1).gamma, points.at(-1).gamma / 2);
  approximatelyEqual(rescaled[50].distance, points[50].distance);
  approximatelyEqual(rescaled[50].function, points[50].function);
});

test("the closed-form function factor selects the correct branches with exact and inexact gradients", () => {
  const exact = createParameters({ epsilon: 0, L: 3, mu: 1 });
  for (const [gamma, expected] of [
    [0, 1],
    [0.1, 0.81],
    [0.5, 0.25],
    [0.8, 1.96],
  ]) {
    approximatelyEqual(closedFormFunction(exact, gamma), expected);
  }
  const inexact = createParameters({ epsilon: 0.5, L: 3, mu: 1 });
  for (const [gamma, expected] of [
    [0.39, 0.648025],
    [0.4, 0.64],
    [0.41, 0.714025],
    [0.6, 2.89],
  ]) {
    approximatelyEqual(closedFormFunction(inexact, gamma), expected);
  }
});

test("the closed-form factor covers the boundary and errors larger than one", () => {
  for (const [epsilon, gamma, expected] of [
    [1, 0, 1],
    [1, 0.5, 1],
    [1, 1.5, 4],
    [2, 0.1, 1.21],
    [2, 1, 4],
    [2, 1.5, 12.25],
    [3, 0.1, 1.44],
  ]) {
    approximatelyEqual(closedFormFunction({ epsilon, mu: 0.5, L: 1 }, gamma), expected);
  }
});

test("the closed-form corner is sampled exactly and rescales with both curvatures", () => {
  const data = validateDataset(fixture());
  const parameters = createParameters({ epsilon: 0.5, L: 3, mu: 1 });
  const points = curvePoints(data, parameters);
  const corner = points.find((point) => Math.abs(point.gamma - 0.4) < 1e-12);
  assert.ok(corner);
  approximatelyEqual(corner.closedForm, 0.64);
  approximatelyEqual(closedFormFunction(createParameters({ epsilon: 0.5, L: 6, mu: 2 }), 0.2), 0.64);
  assert.ok(points.at(-1).closedForm < 1);
  assert.ok(points.at(-1).closedForm > 0.999);
});

test("aligning shifted source minima preserves a single sharp interpolated corner", () => {
  const data = validateDataset(refinedFixture());
  for (const [step, expected] of [
    [0, 1.3525],
    [1.0925, 0.26],
    [1.1025, 0.25],
    [1.1125, 0.26],
    [2, 1.1475],
  ]) {
    approximatelyEqual(interpolateMetric(data, "function", 0.25, 0.5, step), expected);
  }
  const points = curvePoints(data, createParameters({ epsilon: 0.25, L: 2, mu: 1 }));
  assert.ok(points.some((point) => Math.abs(point.step - 1.1025) < 1e-12 && Math.abs(point.function - 0.25) < 1e-12));
  assert.ok(
    points.some((point) => Math.abs(point.step - 0.55125) < 1e-12),
    "An inverse-projected source knot must be rendered"
  );
});

test("refinement keeps the positive-error source face raw and both exact-gradient metrics identical", () => {
  const data = validateDataset(refinedFixture());
  const middle = interpolateMetric(data, "distance", 0.25, 0.5, 1.1025);
  const left = interpolateMetric(data, "distance", 0.25, 0.5, 1.0925);
  const right = interpolateMetric(data, "distance", 0.25, 0.5, 1.1125);
  approximatelyEqual(middle, (left + right) / 2);
  approximatelyEqual(interpolateMetric(data, "distance", 0.5, 0.5, 1.1025), 5);
  const points = curvePoints(data, createParameters({ epsilon: 0, L: 2, mu: 1 }));
  for (const point of points) approximatelyEqual(point.distance, point.function);
  approximatelyEqual(interpolateMetric(data, "distance", 0, 0.5, 0.6), 0.15);
  approximatelyEqual(interpolateMetric(data, "function", 0, 0.5, 0.6), 0.15);
  approximatelyEqual(interpolateMetric(data, "function", 0, 0.25, 0.4), 0.1);
});

test("the refined exact-gradient distance boundary joins continuously to positive errors", () => {
  const data = validateDataset(refinedFixture());
  const exact = interpolateMetric(data, "distance", 0, 0.5, 0.6);
  const nearby = interpolateMetric(data, "distance", 1e-9, 0.5, 0.6);
  approximatelyEqual(exact, 0.15);
  assert.ok(Math.abs(nearby - exact) < 1e-7);
});

test("minimum alignment preserves the source curves' common stability crossing", () => {
  const data = refinedFixture();
  for (const [index, source] of data.refinements.function.entries()) {
    const value = (step) =>
      step <= source.minimumStep
        ? 1 - ((1 - source.minimumRho) * step) / source.minimumStep
        : source.minimumRho + ((1 - source.minimumRho) * (step - source.minimumStep)) / (2 - source.minimumStep);
    data.axes.step.forEach((step, position) => {
      data.metrics.function[index * data.axes.step.length + position] = value(step);
    });
    source.rho = source.step.map(value);
  }
  validateDataset(data);
  approximatelyEqual(interpolateMetric(data, "function", 0.25, 0.5, 1.1025), 0.25);
  approximatelyEqual(interpolateMetric(data, "function", 0.25, 0.5, 2), 1);
});

test("endpoint minima and malformed refinement arrays are handled explicitly", () => {
  for (const endpoint of [0, 2]) {
    const data = validateDataset(refinedFixture(endpoint));
    approximatelyEqual(interpolateMetric(data, "function", 0.25, 0.5, endpoint), 0.25);
    assert.ok(curvePoints(data, createParameters({ epsilon: 0.25, L: 2, mu: 1 })).every((point) => Number.isFinite(point.function)));
  }
  for (const mutate of [
    (data) => data.refinements.function.pop(),
    (data) => {
      data.refinements.function[0].rho[0] = Number.NaN;
    },
    (data) => {
      data.refinements.function[0].minimumStep = 3;
    },
    (data) => {
      data.refinements.function[0].step.reverse();
    },
  ]) {
    const data = refinedFixture();
    mutate(data);
    assert.throws(() => validateDataset(data));
  }
});
