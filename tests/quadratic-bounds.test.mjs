import assert from "node:assert/strict";
import test from "node:test";
import { PARAMETERS, value, gradient, curvature, bound, clampAnchor, labelPosition } from "../assets/js/quadratic-bounds-model.mjs";

const anchors = [-2.2, -1.4, -0.3, 0.5, 1.5, 2.4];
const derivativeStep = 1e-5;

function approximatelyEqual(actual, expected, tolerance = 1e-8) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance, `Expected ${actual} to be within ${tolerance} of ${expected}`);
}

test("the gradient is the slope of the displayed function", () => {
  for (const x of [...anchors, 0.15]) {
    const slope = (value(x + derivativeStep) - value(x - derivativeStep)) / (2 * derivativeStep);
    approximatelyEqual(gradient(x), slope);
  }
});

test("both quadratics touch the function with the same slope at the anchor", () => {
  for (const anchor of anchors) {
    for (const c of [PARAMETERS.mu, PARAMETERS.L]) {
      approximatelyEqual(bound(anchor, anchor, c), value(anchor));
      const slope = (bound(anchor + derivativeStep, anchor, c) - bound(anchor - derivativeStep, anchor, c)) / (2 * derivativeStep);
      approximatelyEqual(slope, gradient(anchor));
    }
  }
});

test("the lower and upper quadratics enclose the function throughout the domain", () => {
  for (const anchor of anchors) {
    for (let step = 0; step <= 230; step += 1) {
      const x = PARAMETERS.domainMin + ((PARAMETERS.domainMax - PARAMETERS.domainMin) * step) / 230;
      const actual = value(x);
      assert.ok(bound(x, anchor, PARAMETERS.mu) <= actual + 1e-10, `Lower quadratic exceeds f at x=${x}, anchor=${anchor}`);
      assert.ok(actual <= bound(x, anchor, PARAMETERS.L) + 1e-10, `Upper quadratic falls below f at x=${x}, anchor=${anchor}`);
    }
  }
});

test("curvature stays in the advertised range and agrees with changes in slope", () => {
  for (let step = 0; step <= 230; step += 1) {
    const x = PARAMETERS.domainMin + step * 0.02;
    const actual = curvature(x);
    assert.ok(actual >= 0.2 - 1e-12 && actual <= 1.8 + 1e-12);
    const slopeChange = (gradient(x + derivativeStep) - gradient(x - derivativeStep)) / (2 * derivativeStep);
    approximatelyEqual(actual, slopeChange);
  }
  approximatelyEqual(curvature(0.15), 1.8);
});

test("dragging stops at each domain endpoint while preserving interior anchors", () => {
  for (const x of [-100, -2.3]) {
    assert.equal(clampAnchor(x), -2.2);
  }
  for (const x of [2.5, 100]) {
    assert.equal(clampAnchor(x), 2.4);
  }
  for (const x of [-2.2, -1, 0, 0.5, 2.4]) {
    assert.equal(clampAnchor(x), x);
  }
});

test("the initial upper label keeps its preferred location when it is visible", () => {
  const label = labelPosition(PARAMETERS.initialAnchor, PARAMETERS.L, -1.8, 4.25);
  assert.equal(label.x, -1.8);
  approximatelyEqual(label.y, bound(-1.8, PARAMETERS.initialAnchor, PARAMETERS.L));
});

test("labels project onto the visible quadratic interval across anchor extremes", () => {
  const maxY = 4.25;
  for (const anchor of [-2.2, 0.5, 2.4]) {
    for (const c of [PARAMETERS.mu, PARAMETERS.L]) {
      for (const preferredX of [-5, -1.8, 0.5, 2, 5]) {
        const label = labelPosition(anchor, c, preferredX, maxY);
        assert.ok(label.x >= PARAMETERS.domainMin && label.x <= PARAMETERS.domainMax);
        assert.ok(label.y <= maxY + 1e-10, `Label exceeds top padding at anchor=${anchor}`);
        approximatelyEqual(label.y, bound(label.x, anchor, c));

        const preferredIsVisible = preferredX >= PARAMETERS.domainMin && preferredX <= PARAMETERS.domainMax && bound(preferredX, anchor, c) <= maxY;
        if (preferredIsVisible) {
          approximatelyEqual(label.x, preferredX);
        } else {
          // A point slightly nearer the preference must be outside the visible
          // interval; otherwise the label has moved farther than necessary.
          const nearerX = label.x + Math.sign(preferredX - label.x) * 1e-6;
          assert.ok(
            nearerX < PARAMETERS.domainMin || nearerX > PARAMETERS.domainMax || bound(nearerX, anchor, c) > maxY,
            `Label is not the nearest visible point to x=${preferredX} at anchor=${anchor}`
          );
        }
      }
    }
  }
});

test("the lower label stays on its curve within the axis-safe height cap throughout dragging", () => {
  const maxY = 0.2;
  const sampledAnchors = Array.from(
    { length: 231 },
    (_, step) => PARAMETERS.domainMin + ((PARAMETERS.domainMax - PARAMETERS.domainMin) * step) / 230
  );
  for (const anchor of [...sampledAnchors, -0.3, -0.2, -0.1, 0, 0.5]) {
    const label = labelPosition(anchor, PARAMETERS.mu, -1.5, maxY);
    assert.ok(label.x >= PARAMETERS.domainMin && label.x <= PARAMETERS.domainMax);
    assert.ok(label.y <= maxY + 1e-10, `Lower label exceeds axis-safe height at anchor=${anchor}`);
    approximatelyEqual(label.y, bound(label.x, anchor, PARAMETERS.mu));
  }
  assert.equal(labelPosition(0.5, PARAMETERS.mu, -1.5, maxY).x, -1.5);
});
