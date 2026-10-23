import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createDatasetSelection, toggleZeroMask } from "../assets/js/lyapunov-multipliers-loading.mjs";

async function serverFor(t, handler) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections();
    return new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });
  return `http://127.0.0.1:${server.address().port}`;
}

test("each component button toggles only its own zero constraint and all 128 combinations remain selectable", () => {
  assert.equal(toggleZeroMask(0, 0), 1);
  assert.equal(toggleZeroMask(0, 3), 8);
  assert.equal(toggleZeroMask(8, 6), 72);
  assert.equal(toggleZeroMask(72, 3), 64);
  assert.equal(toggleZeroMask(127, 0), 126);
  for (let mask = 0; mask < 128; mask += 1) {
    for (let component = 0; component < 7; component += 1) assert.equal(toggleZeroMask(toggleZeroMask(mask, component), component), mask);
  }
  for (const [mask, component] of [
    [-1, 0],
    [128, 0],
    [0, -1],
    [0, 7],
    [0.5, 2],
  ])
    assert.throws(() => toggleZeroMask(mask, component));
});

test("older family responses cannot replace a newer selection and cached requests are reused", async (t) => {
  let releaseSlow;
  let markSlowStarted;
  const slowStarted = new Promise((resolve) => {
    markSlowStarted = resolve;
  });
  const slowGate = new Promise((resolve) => {
    releaseSlow = resolve;
  });
  let slowRequests = 0;
  const origin = await serverFor(t, async (request, response) => {
    const family = request.url.slice(1);
    if (family === "slow") {
      slowRequests += 1;
      markSlowStarted();
      await slowGate;
    }
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ family }));
  });
  const selection = createDatasetSelection(async (family) => {
    const response = await fetch(`${origin}/${family}`);
    return response.json();
  });
  const older = selection.select(["slow"]);
  await slowStarted;
  const newer = await selection.select(["base"]);
  assert.equal(newer.current, true);
  assert.deepEqual(newer.datasets, { base: { family: "base" } });
  releaseSlow();
  assert.equal((await older).current, false);
  const reused = await selection.select(["slow"]);
  assert.equal(reused.current, true);
  assert.deepEqual(reused.datasets, { slow: { family: "slow" } });
  assert.equal(slowRequests, 1);
});

test("returning to an in-flight family reuses its request while invalidation protects the raw default", async (t) => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  let requests = 0;
  const origin = await serverFor(t, async (request, response) => {
    requests += 1;
    await gate;
    response.end('{"family":"base"}');
  });
  const selection = createDatasetSelection(async (family) => (await fetch(`${origin}/${family}`)).json());
  const first = selection.select(["base"]);
  const second = selection.select(["base"]);
  selection.invalidate();
  release();
  assert.equal((await first).current, false);
  assert.equal((await second).current, false);
  assert.equal((await selection.select(["base"])).current, true);
  assert.equal(requests, 1);
});

test("failed family requests are evicted so retry can succeed", async (t) => {
  let requests = 0;
  const origin = await serverFor(t, (request, response) => {
    requests += 1;
    response.statusCode = requests === 1 ? 503 : 200;
    response.end('{"family":"large"}');
  });
  const selection = createDatasetSelection(async (family) => {
    const response = await fetch(`${origin}/${family}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  });
  const failed = await selection.select(["large"]);
  assert.equal(failed.current, true);
  assert.match(failed.error.message, /503/);
  const retry = await selection.select(["large"]);
  assert.equal(retry.current, true);
  assert.deepEqual(retry.datasets, { large: { family: "large" } });
  assert.equal(requests, 2);
});
