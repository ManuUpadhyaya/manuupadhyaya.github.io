import assert from "node:assert/strict";
import test from "node:test";

async function metrics() {
  try {
    return await import("../scripts/math-font-metrics.mjs");
  } catch (error) {
    assert.fail(`Roboto metric helper is unavailable: ${error.message}`);
  }
}

test("Roboto text uses glyph advances rather than character-count estimates", async () => {
  const { measureRobotoText } = await metrics();
  assert.ok(measureRobotoText("WWW") > measureRobotoText("iii") * 3);
  assert.equal(measureRobotoText(""), 0);
});

test("the requested variable-font weight changes text width", async () => {
  const { measureRobotoText } = await metrics();
  assert.ok(measureRobotoText("maximum", { weight: 700 }) > measureRobotoText("maximum", { weight: 400 }));
  assert.ok(measureRobotoText("maximum", { weight: 500 }) > measureRobotoText("maximum", { weight: 400 }));
});

test("tracking applies to every character and synthetic italic preserves advances", async () => {
  const { measureRobotoText } = await metrics();
  assert.ok(Math.abs(measureRobotoText("and", { letterSpacing: 0 }) - measureRobotoText("and") - 0.012) < 1e-9);
  assert.equal(measureRobotoText("and", { style: "italic" }), measureRobotoText("and"));
});

test("mixed Latin and Greek text resolves the local font subsets", async () => {
  const { measureRobotoText } = await metrics();
  const mixed = measureRobotoText("x α and β", { letterSpacing: 0 });
  assert.ok(mixed > 3 && mixed < 6);
  assert.throws(() => measureRobotoText("\u{10ffff}"), /Roboto.*U\+10FFFF/);
});

test("Roboto x-height comes from the font and remains in em units", async () => {
  const { robotoXHeight } = await metrics();
  assert.ok(robotoXHeight() > 0.5 && robotoXHeight() < 0.55);
  assert.ok(robotoXHeight(700) > 0.5 && robotoXHeight(700) < 0.55);
});
