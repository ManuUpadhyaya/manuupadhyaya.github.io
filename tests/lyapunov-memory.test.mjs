import assert from "node:assert/strict";
import test from "node:test";
import { validateDataset, methodCurves, curvePath, plotGeometry } from "../assets/js/lyapunov-memory-model.mjs";

function fixture() {
  const result = {
    version: 1,
    solver: "MOSEK",
    axes: { ratio: [0.01, 0.1, 0.5, 0.9] },
    modes: ["free", "positive"],
    methods: ["gradient", "heavy_ball", "nesterov", "triple_momentum"],
    metrics: {},
    metadata: { tolerance: 0.001 },
  };
  for (const metric of ["distance"]) {
    result.metrics[metric] = {};
    for (const mode of result.modes) {
      result.metrics[metric][mode] = {};
      for (const method of result.methods) result.metrics[metric][mode][method] = [0.98, 0.8, 0.4, 0.1];
    }
  }
  return result;
}

test("missing certificates break curves instead of joining distant feasible samples", () => {
  const data = fixture();
  data.metrics.distance.free.heavy_ball = [0.9, null, 0.5, 0.2];
  const curve = methodCurves(validateDataset(data))[1].curves.find((item) => item.mode === "free");
  assert.deepEqual(curve.segments, [
    [{ ratio: 0.01, rho: 0.9 }],
    [
      { ratio: 0.5, rho: 0.5 },
      { ratio: 0.9, rho: 0.2 },
    ],
  ]);
  assert.equal(curve.missing, 1);
  assert.equal(
    curvePath(
      curve.segments,
      (value) => value * 100,
      (value) => value * 100
    ),
    "M1.00,90.00 M50.00,50.00 L90.00,20.00"
  );
});

test("each method panel compares free and positive searches for squared distance only", () => {
  const data = fixture();
  data.metrics.distance.free.triple_momentum = [0.8, 0.6, 0.3, 0.05];
  data.metrics.distance.positive.triple_momentum = [null, null, 0.5, 0.2];
  const panels = methodCurves(validateDataset(data));
  assert.deepEqual(
    panels.map(({ method }) => method),
    ["gradient", "heavy_ball", "nesterov", "triple_momentum"]
  );
  assert.equal(panels[3].curves[0].mode, "free");
  assert.deepEqual(panels[3].curves[0].segments[0], [
    { ratio: 0.01, rho: 0.8 },
    { ratio: 0.1, rho: 0.6 },
    { ratio: 0.5, rho: 0.3 },
    { ratio: 0.9, rho: 0.05 },
  ]);
  assert.equal(panels[3].curves[1].mode, "positive");
  assert.deepEqual(panels[3].curves[1].segments, [
    [
      { ratio: 0.5, rho: 0.5 },
      { ratio: 0.9, rho: 0.2 },
    ],
  ]);
  assert.equal(panels[3].curves[1].missing, 2);
  assert.equal(data.metrics.distance.free.gradient[0], 0.98);
});

test("a wholly unavailable curve remains empty and isolated valid points remain available", () => {
  const data = fixture();
  data.metrics.distance.positive.heavy_ball = [null, null, null, null];
  data.metrics.distance.positive.nesterov = [null, 0.7, null, null];
  const panels = methodCurves(validateDataset(data));
  assert.deepEqual(panels[1].curves[1].segments, []);
  assert.equal(panels[1].curves[1].missing, 4);
  assert.deepEqual(panels[2].curves[1].segments, [[{ ratio: 0.1, rho: 0.7 }]]);
});

test("validation rejects malformed grids and non-certificate values rather than plotting them", () => {
  for (const mutate of [
    (data) => {
      data.version = 2;
    },
    (data) => {
      data.solver = "";
    },
    (data) => {
      data.axes.ratio = [0, 0.5, 0.9, 0.99];
    },
    (data) => {
      data.axes.ratio = [0.01, 0.1, 0.1, 0.9];
    },
    (data) => {
      data.axes.ratio[3] = 1;
    },
    (data) => {
      data.methods[3] = "gradient";
    },
    (data) => {
      data.modes.pop();
    },
    (data) => {
      delete data.metrics.distance.positive;
    },
    (data) => {
      data.metrics.distance.free.gradient.pop();
    },
    (data) => {
      data.metrics.distance.free.gradient[0] = Number.NaN;
    },
    (data) => {
      data.metrics.distance.free.gradient[0] = 1;
    },
    (data) => {
      data.metrics.distance.free.gradient[0] = -0.1;
    },
    (data) => {
      data.metadata = [];
    },
  ]) {
    const data = fixture();
    mutate(data);
    assert.throws(() => validateDataset(data));
  }
  assert.equal(validateDataset(fixture()).solver, "MOSEK");
});

test("all method panels map reciprocal curvature ratios to the same logarithmic condition-number axis", () => {
  const bounds = { left: 60, right: 460, top: 20, bottom: 260 };
  const geometry = plotGeometry(bounds);
  assert.equal(geometry.x(1), 60);
  assert.ok(Math.abs(geometry.x(0.1) - (60 + 400 / 3)) < 1e-10);
  assert.ok(Math.abs(geometry.x(0.01) - (60 + 800 / 3)) < 1e-10);
  assert.equal(geometry.x(0.001), 460);
  assert.ok(Math.abs(geometry.xCondition(10) - (60 + 400 / 3)) < 1e-10);
  assert.equal(geometry.xCondition(1000), 460);
  assert.equal(geometry.y(0), 260);
  assert.equal(geometry.y(1), 20);
  assert.deepEqual(geometry.xTicks, [1, 10, 100, 1000]);
  assert.deepEqual(geometry.yTicks, [0, 0.2, 0.4, 0.6, 0.8, 1]);
});
