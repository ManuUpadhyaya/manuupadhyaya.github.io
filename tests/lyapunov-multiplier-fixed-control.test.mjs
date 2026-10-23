import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createFixedExpressionControl } from "../assets/js/lyapunov-multipliers-loading.mjs";

async function serverFor(t, handler) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections();
    return new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });
  return `http://127.0.0.1:${server.address().port}/fixed.json`;
}

function loadFrom(url) {
  return async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  };
}

test("fixed mode is limited to the exact preset, reuses recorded checks, and releases without changing the zero mask", async (t) => {
  let requests = 0;
  const url = await serverFor(t, (request, response) => {
    requests += 1;
    response.end('{"status":[1,1,1]}');
  });
  const control = createFixedExpressionControl(loadFrom(url));
  await control.toggle();
  assert.equal(control.getState().selected, false);
  assert.equal(requests, 0);
  control.setMask(74);
  await control.toggle();
  assert.deepEqual(control.getState(), { mask: 74, selected: true, loading: false, data: { status: [1, 1, 1] }, error: null });
  await control.toggle();
  assert.deepEqual(control.getState(), { mask: 74, selected: false, loading: false, data: null, error: null });
  await control.toggle();
  assert.equal(control.getState().selected, true);
  assert.equal(requests, 1);
  control.setMask(72);
  assert.deepEqual(control.getState(), { mask: 72, selected: false, loading: false, data: null, error: null });
});

test("release or a zero-mask change prevents a late successful response from reactivating fixed mode", async (t) => {
  let release;
  let started;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  const url = await serverFor(t, async (request, response) => {
    started();
    await gate;
    response.end('{"status":[1]}');
  });
  const control = createFixedExpressionControl(loadFrom(url));
  control.setMask(74);
  const pending = control.toggle();
  assert.equal(control.getState().loading, true);
  await ready;
  await control.toggle();
  control.setMask(127);
  release();
  await pending;
  assert.deepEqual(control.getState(), { mask: 127, selected: false, loading: false, data: null, error: null });
  control.setMask(74);
  await control.toggle();
  assert.equal(control.getState().selected, true);
  assert.deepEqual(control.getState().data, { status: [1] });
});

test("reentering fixed mode during the same pending request keeps only the newest selection active", async (t) => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  let requests = 0;
  const url = await serverFor(t, async (request, response) => {
    requests += 1;
    await gate;
    response.end('{"status":[1]}');
  });
  const control = createFixedExpressionControl(loadFrom(url));
  control.setMask(74);
  const first = control.toggle();
  await control.toggle();
  const latest = control.toggle();
  release();
  await Promise.all([first, latest]);
  assert.equal(requests, 1);
  assert.deepEqual(control.getState(), { mask: 74, selected: true, loading: false, data: { status: [1] }, error: null });
});

test("failed recorded checks remain unavailable and can be retried after release", async (t) => {
  let requests = 0;
  const url = await serverFor(t, (request, response) => {
    requests += 1;
    response.statusCode = requests === 1 ? 503 : 200;
    response.end('{"status":[1]}');
  });
  const control = createFixedExpressionControl(loadFrom(url));
  control.setMask(74);
  await control.toggle();
  assert.equal(control.getState().selected, true);
  assert.equal(control.getState().loading, false);
  assert.equal(control.getState().data, null);
  assert.match(control.getState().error.message, /503/);
  await control.toggle();
  await control.toggle();
  assert.equal(requests, 2);
  assert.equal(control.getState().error, null);
  assert.deepEqual(control.getState().data, { status: [1] });
});
