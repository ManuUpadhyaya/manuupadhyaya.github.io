import test from "node:test";
import assert from "node:assert/strict";
import {
  validateRestrictionIndex,
  validateFamilyDataset,
  requiredFamilies,
  classifyRestriction,
  interpolateRestriction,
  restrictionCurvePoints,
} from "../assets/js/lyapunov-multiplier-restrictions.mjs";
import { createParameters, curvePoints } from "../assets/js/lyapunov-multipliers-model.mjs";

function fixture() {
  const axes = { epsilon: [0.01, 0.5, 0.9, 0.99], ratio: [0.001, 1 / 3, 0.99], step: [0, 1.5, 1.8, 2] };
  const order = ["tau", "k,star", "star,k", "k+1,star", "star,k+1", "k,k+1", "k+1,k"];
  const index = {
    version: 1,
    solver: "MOSEK Fusion",
    axes,
    order,
    families: { base: { file: "base.json.gz" }, slow: { file: "slow.json.gz" }, large: { file: "large.json.gz" } },
  };
  const count = 4 * 3 * 4;
  const tables = Object.fromEntries(
    ["base", "slow", "large"].map((family) => [
      family,
      { version: 1, values: Array(count * 7).fill(null), status: Array(count).fill(0), support: Array(count).fill(0) },
    ])
  );
  const raw = { version: 1, solver: "MOSEK Fusion", axes, order, values: Array(count * 7).fill(9) };
  return { index, tables, raw };
}

function record(data, family, e, r, s, support, values, status = 1) {
  const point = (e * 3 + r) * 4 + s;
  data.tables[family].support[point] = support;
  data.tables[family].status[point] = status;
  data.tables[family].values.splice(point * 7, 7, ...(values ?? Array(7).fill(null)));
}

test("requested zero masks choose actual compatible solver columns rather than hiding raw curves", () => {
  const data = fixture();
  record(data, "base", 1, 1, 1, 53, [1, 0, 3, 0, 5, 6, 0]);
  record(data, "slow", 1, 1, 1, 113, [10, 0, 0, 0, 40, 50, 60]);
  record(data, "large", 1, 2, 2, 23, [20, 21, 22, 0, 24, 0, 0]);
  assert.deepEqual(interpolateRestriction(data.index, data.tables, 8, 0.5, 1 / 3, 1.5).values, [1, 0, 3, 0, 5, 6, 0]);
  assert.deepEqual(interpolateRestriction(data.index, data.tables, 4, 0.5, 1 / 3, 1.5).values, [10, 0, 0, 0, 40, 50, 60]);
  assert.deepEqual(interpolateRestriction(data.index, data.tables, 32, 0.5, 0.99, 1.8).values, [20, 21, 22, 0, 24, 0, 0]);
  assert.deepEqual(requiredFamilies(32), ["large"]);
});

test("an analytical current-point exclusion prevents interpolation from drawing an infeasible zero selection", () => {
  const data = fixture();
  record(data, "large", 1, 1, 1, 23, [20, 21, 22, 0, 24, 0, 0]);
  assert.deepEqual(interpolateRestriction(data.index, data.tables, 32, 0.5, 1 / 3, 1.5), { values: null, status: 0 });
});

test("different compatible corner families blend while every selected zero remains zero", () => {
  const data = fixture();
  record(data, "base", 1, 1, 1, 53, [2, 0, 4, 0, 6, 8, 0]);
  record(data, "slow", 1, 1, 2, 113, [4, 0, 0, 0, 10, 12, 14]);
  const sample = interpolateRestriction(data.index, data.tables, 2, 0.5, 1 / 3, 1.65);
  sample.values.forEach((value, position) => assert.ok(Math.abs(value - [3, 0, 2, 0, 8, 10, 7][position]) < 1e-12));
  assert.equal(sample.status, 1);
});

test("unresolved corners create honest gaps and a finite compatible alternative can fill them", () => {
  const data = fixture();
  record(data, "base", 1, 1, 1, 53, [1, 0, 3, 0, 5, 6, 0]);
  record(data, "base", 1, 1, 2, 33, null, 2);
  assert.equal(interpolateRestriction(data.index, data.tables, 8, 0.5, 1 / 3, 1.65).values, null);
  assert.equal(interpolateRestriction(data.index, data.tables, 8, 0.5, 1 / 3, 1.65).status, 2);
  assert.deepEqual(interpolateRestriction(data.index, data.tables, 8, 0.5, 1 / 3, 1.5).values, [1, 0, 3, 0, 5, 6, 0]);
  record(data, "slow", 1, 1, 2, 113, [10, 0, 0, 0, 40, 50, 60]);
  assert.deepEqual(interpolateRestriction(data.index, data.tables, 8, 0.5, 1 / 3, 1.8).values, [10, 0, 0, 0, 40, 50, 60]);
});

test("zero-selection reset preserves the original table including its raw gaps and tau scaling", () => {
  const data = fixture();
  data.raw.values.splice(4 * 7, 7, ...Array(7).fill(null));
  const parameters = createParameters({ epsilon: 0.5, L: 3, mu: 1 });
  assert.deepEqual(restrictionCurvePoints(data.raw, data.index, data.tables, 0, parameters), curvePoints(data.raw, parameters));
});

test("masked curves also omit both boundary knots and retain near-edge interpolation samples", () => {
  const data = fixture();
  const parameters = createParameters({ epsilon: 0.5, L: 3, mu: 1 });
  const points = restrictionCurvePoints(data.raw, data.index, data.tables, 8, parameters);
  assert.ok(points.every((point) => point.step > 0 && point.step < 2 && point.gamma > 0 && point.gamma < 2 / 4.5));
  assert.ok(points[0].step < 0.00002);
  assert.ok(points.at(-1).step > 1.99998);
  assert.ok(points.some((point) => point.step === 1.5));
  assert.throws(() => classifyRestriction(8, 1, 1 / 3, 1));
  assert.throws(() => classifyRestriction(8, 0.5, 1 / 3, 2.01));
});

for (const { L, mu, tau } of [
  { L: 3, mu: 2.97, tau: 2 },
  { L: 6, mu: 5.94, tau: 1 },
]) {
  test(`restricted curves retain the allowed slider endpoint L=${L}, mu=${mu}`, () => {
    const data = fixture();
    record(data, "base", 1, 2, 1, 53, [6, 0, 3, 0, 5, 6, 0]);
    const parameters = createParameters({ epsilon: 0.5, L, mu });
    const points = restrictionCurvePoints(data.raw, data.index, data.tables, 74, parameters);
    const sample = points.find((point) => point.step === 1.5);
    assert.equal(sample.status, 1);
    assert.deepEqual(sample.values, [tau, 0, 3, 0, 5, 6, 0]);
  });
}

test("restricted interpolation clamps ratio rounding within the grid endpoint tolerance", () => {
  const data = fixture();
  record(data, "base", 1, 0, 1, 53, [1, 0, 3, 0, 5, 6, 0]);
  record(data, "base", 1, 2, 1, 53, [2, 0, 4, 0, 6, 7, 0]);
  assert.deepEqual(interpolateRestriction(data.index, data.tables, 74, 0.5, 0.001 - 5e-13, 1.5), {
    values: [1, 0, 3, 0, 5, 6, 0],
    status: 1,
  });
  assert.deepEqual(interpolateRestriction(data.index, data.tables, 74, 0.5, 0.99 + 5e-13, 1.5), {
    values: [2, 0, 4, 0, 6, 7, 0],
    status: 1,
  });
});

test("restricted interpolation rejects ratios beyond the grid endpoint tolerance", () => {
  const data = fixture();
  for (const ratio of [0.001 - 2e-12, 0.99 + 2e-12]) {
    assert.throws(() => classifyRestriction(74, 0.5, ratio, 1.5), /outside the restricted multiplier domain/);
    assert.throws(() => interpolateRestriction(data.index, data.tables, 74, 0.5, ratio, 1.5), /outside the restricted multiplier domain/);
  }
});

test("analytical exclusions distinguish infeasibility from uncertain rounded boundaries", () => {
  assert.equal(classifyRestriction(1, 0.5, 1 / 3, 1.5), 0);
  assert.equal(classifyRestriction(32, 0.5, 1 / 3, 1.5), 0);
  assert.equal(classifyRestriction(32, 0.5, 0.99, 1.8), 1);
  assert.equal(classifyRestriction(6, 0.5, 1 / 3, 1.5), 1);
  const largeThreshold = (0.5 + Math.sqrt(0.25 + 6 / 0.99)) / 3;
  const justBelow = (largeThreshold - 1e-13) * 1.5;
  assert.equal(classifyRestriction(32, 0.5, 0.99, justBelow), 2);
  assert.equal(classifyRestriction(32, 0.5, 0.99 + 5e-13, justBelow), 2);
  for (let mask = 0; mask < 128; mask += 1) assert.equal(classifyRestriction(mask, 0.5, 1 / 3, 0), mask & 32 ? 0 : 1);
});

test("restriction metadata rejects mismatched axes, partial records, and forbidden raw columns", () => {
  const data = fixture();
  assert.equal(validateRestrictionIndex(data.index, data.raw), data.index);
  const wrong = structuredClone(data.index);
  wrong.axes.step[1] = 1.6;
  assert.throws(() => validateRestrictionIndex(wrong, data.raw));
  record(data, "base", 1, 1, 1, 53, [1, 0, -1e-13, 0, 5, 6, 0]);
  assert.equal(validateFamilyDataset(data.tables.base, data.index), data.tables.base);
  data.tables.base.values[((1 * 3 + 1) * 4 + 1) * 7 + 1] = 0.1;
  assert.throws(() => validateFamilyDataset(data.tables.base, data.index));
  const unavailableFace = structuredClone(data.tables.slow);
  unavailableFace.status[0] = 2;
  assert.equal(validateFamilyDataset(unavailableFace, data.index), unavailableFace);
  const incomplete = structuredClone(data.tables.slow);
  incomplete.status.pop();
  assert.throws(() => validateFamilyDataset(incomplete, data.index));
});
