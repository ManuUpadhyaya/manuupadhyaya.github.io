import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createParameters } from "../assets/js/lyapunov-multipliers-model.mjs";
import { validateFixedDataset, checkFixedExpressionGrid } from "../assets/js/lyapunov-multiplier-fixed.mjs";

function fixture() {
  const axes = { epsilon: [0, 0.5, 0.99], ratio: [0.001, 1 / 3, 0.99], step: [0, 1, 2] };
  const order = ["tau", "k,star", "star,k", "k+1,star", "star,k+1", "k,k+1", "k+1,k"];
  const data = {
    version: 1,
    solver: "MOSEK Fusion",
    zeroMask: 74,
    formula: "function-gap-v1",
    axes,
    order,
    status: Array.from({ length: 27 }, (_, i) => (i < 9 ? 2 : 1)),
  };
  return { data, reference: { axes: structuredClone(axes), order: [...order] } };
}

test("fixed expression data must identify the exact formulas, zero pattern, order and shared grid", () => {
  const { data, reference } = fixture();
  assert.equal(validateFixedDataset(data, reference), data);
  for (const mutate of [
    (d) => {
      d.version = 2;
    },
    (d) => {
      d.solver = "Other";
    },
    (d) => {
      d.zeroMask = 72;
    },
    (d) => {
      d.formula = "older-formulas";
    },
    (d) => {
      d.order.reverse();
    },
    (d) => {
      d.axes.step[1] = 1.5;
    },
    (d) => {
      d.status.pop();
    },
    (d) => {
      d.status[12] = 3;
    },
    (d) => {
      d.status[0] = 1;
    },
  ]) {
    const changed = structuredClone(data);
    mutate(changed);
    assert.throws(() => validateFixedDataset(changed, reference));
  }
});

test("an exact parameter face uses only its actual checks and ignores zero-weight unavailable neighbors", () => {
  const { data } = fixture();
  data.status.fill(2);
  data.status.splice(12, 3, 1, 1, 1);
  assert.deepEqual(checkFixedExpressionGrid(data, createParameters()), {
    status: 1,
    checked: 3,
    feasible: 3,
    infeasible: 0,
    unavailable: 0,
    exactParameters: true,
  });
});

test("off-grid parameters aggregate the neighboring checks without interpolating their statuses", () => {
  const { data } = fixture();
  const parameters = createParameters({ epsilon: 0.75, mu: 1.5, L: 3 });
  const allFeasible = checkFixedExpressionGrid(data, parameters);
  assert.equal(allFeasible.status, 1);
  assert.equal(allFeasible.checked, 12);
  assert.equal(allFeasible.exactParameters, false);
  data.status[12] = 2;
  const unavailable = checkFixedExpressionGrid(data, parameters);
  assert.equal(unavailable.status, 2);
  assert.equal(unavailable.feasible, 11);
  assert.equal(unavailable.unavailable, 1);
  data.status[12] = 0;
  const mixed = checkFixedExpressionGrid(data, parameters);
  assert.equal(mixed.status, 2);
  assert.equal(mixed.infeasible, 1);
  assert.equal(mixed.feasible, 11);
});

test("uniform infeasibility is distinct from unavailable checks and cannot appear feasible", () => {
  const { data } = fixture();
  data.status.splice(12, 3, 0, 0, 0);
  const result = checkFixedExpressionGrid(data, createParameters());
  assert.equal(result.status, 0);
  assert.equal(result.infeasible, 3);
  assert.equal(result.feasible, 0);
  assert.equal(result.unavailable, 0);
});

test("zero error does not evaluate the singular formulas or report a successful solver check", () => {
  const { data } = fixture();
  assert.deepEqual(checkFixedExpressionGrid(data, createParameters({ epsilon: 0 })), {
    status: 2,
    checked: 0,
    feasible: 0,
    infeasible: 0,
    unavailable: 0,
    exactParameters: false,
  });
});

test("rescaling both curvature bounds preserves fixed-expression sample checks", () => {
  const { data } = fixture();
  assert.deepEqual(
    checkFixedExpressionGrid(data, createParameters({ L: 3, mu: 1 })),
    checkFixedExpressionGrid(data, createParameters({ L: 6, mu: 2 }))
  );
});

test("invalid or out-of-grid parameter queries do not return sampled success", () => {
  const { data } = fixture();
  for (const parameters of [
    { epsilon: NaN, ratio: 1 / 3 },
    { epsilon: 1, ratio: 1 / 3 },
    { epsilon: 0.5, ratio: 0 },
    { epsilon: 0.5, ratio: 1 },
  ])
    assert.throws(() => checkFixedExpressionGrid(data, parameters));
});

test("the public fixed-expression payload matches Figure 3 and contains no duplicated multiplier values", () => {
  const read = (name) => JSON.parse(readFileSync(new URL(`../assets/data/${name}.json`, import.meta.url), "utf8"));
  const reference = read("lyapunov-multipliers");
  const data = validateFixedDataset(read("lyapunov-multiplier-fixed"), reference);
  assert.deepEqual(Object.keys(data).sort(), ["axes", "formula", "order", "solver", "status", "version", "zeroMask"]);
  const result = checkFixedExpressionGrid(data, createParameters());
  assert.equal(result.checked, reference.axes.step.length);
  assert.equal(result.status, 1);
  assert.equal(result.feasible, result.checked);
});
