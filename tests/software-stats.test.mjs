import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const starsURL = "https://img.shields.io/github/stars/AutoLyap/AutoLyap.json";
const downloadsURL = "https://img.shields.io/pepy/dt/autolyap.json";
const stars = { label: "stars", message: "19", color: "blue", link: [], name: "stars", value: "19" };
const downloads = { label: "downloads", message: "5.3k", color: "brightgreen", link: [], name: "downloads", value: "5.3k" };

function loadStats(responses, { fetchAvailable = true, initialValue = "—" } = {}) {
  const stats = [starsURL, downloadsURL].map((source) => {
    const value = {
      textContent: initialValue,
      attributes: new Map(),
      setAttribute(name, text) {
        this.attributes.set(name, text);
      },
      removeAttribute(name) {
        this.attributes.delete(name);
      },
    };
    return {
      dataset: { softwareStatSource: source },
      querySelector: (selector) => (selector === ".software-stat-value" ? value : null),
      value,
    };
  });
  const context = {
    document: { querySelectorAll: () => stats },
    ...(fetchAvailable && {
      fetch: async (url) => {
        const response = responses.get(url);
        if (response instanceof Error) throw response;
        return { ok: true, json: async () => response, ...response };
      },
    }),
  };
  const source = new URL("../assets/js/software-stats.js", import.meta.url);
  vm.runInNewContext(existsSync(source) ? readFileSync(source, "utf8") : "", context);
  return stats.map(({ value }) => value);
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test("software statistics use the current numeric messages from each live source", async () => {
  const values = loadStats(
    new Map([
      [starsURL, stars],
      [downloadsURL, downloads],
    ])
  );
  await settle();
  assert.deepEqual(
    values.map(({ textContent }) => textContent),
    ["19", "5.3k"]
  );
  assert.equal(values[0].attributes.has("aria-label"), false);
});

test("zero and newly increased counts replace previous values", async () => {
  const values = loadStats(
    new Map([
      [starsURL, { ...stars, message: "0" }],
      [downloadsURL, { ...downloads, message: "1.2M" }],
    ])
  );
  await settle();
  assert.deepEqual(
    values.map(({ textContent }) => textContent),
    ["0", "1.2M"]
  );
});

test("failed requests clear stale counts while an independent counter still updates", async () => {
  const values = loadStats(
    new Map([
      [starsURL, new Error("Offline")],
      [downloadsURL, downloads],
    ]),
    { initialValue: "999" }
  );
  await settle();
  assert.deepEqual(
    values.map(({ textContent }) => textContent),
    ["—", "5.3k"]
  );
  assert.equal(values[0].attributes.get("aria-label"), "Count unavailable");
});

test("HTTP errors and broken JSON retain the quiet unavailable fallback", async () => {
  const values = loadStats(
    new Map([
      [starsURL, { ok: false, json: async () => stars }],
      [
        downloadsURL,
        {
          json: async () => {
            throw new SyntaxError("Invalid JSON");
          },
        },
      ],
    ])
  );
  await settle();
  assert.deepEqual(
    values.map(({ textContent }) => textContent),
    ["—", "—"]
  );
});

test("missing or malformed source messages never become visible errors or counts", async () => {
  for (const payload of [
    null,
    {},
    { message: 19 },
    { message: "inaccessible" },
    { message: "-1" },
    { message: "NaN" },
    { message: "<b>19</b>" },
    { message: "1.2.3k" },
    { message: "" },
  ]) {
    const values = loadStats(
      new Map([
        [starsURL, payload],
        [downloadsURL, downloads],
      ])
    );
    await settle();
    assert.equal(values[0].textContent, "—", JSON.stringify(payload));
  }
});

test("browsers without fetching retain the accessible fallback", async () => {
  const values = loadStats(new Map(), { fetchAvailable: false, initialValue: "999" });
  await settle();
  assert.deepEqual(
    values.map(({ textContent }) => textContent),
    ["—", "—"]
  );
});
