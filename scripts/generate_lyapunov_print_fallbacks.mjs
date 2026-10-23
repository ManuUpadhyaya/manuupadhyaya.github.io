import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { format, resolveConfig } from "prettier";
import * as contraction from "../assets/js/lyapunov-contraction-model.mjs";
import * as multipliers from "../assets/js/lyapunov-multipliers-model.mjs";
import * as memory from "../assets/js/lyapunov-memory-model.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destination = resolve(root, "_includes/generated");
const tick = (value, precision = 3) => (value === 0 ? "0" : String(Number(value.toPrecision(precision))));
const element = (name, attributes, contents = "") =>
  `<${name}${Object.entries(attributes)
    .map(([key, value]) => ` ${key}="${value}"`)
    .join("")}>${contents}</${name}>`;
const path = (className, d) => element("path", { class: className, d });
const line = (attributes) => element("line", attributes);
const text = (x, y, anchor, value) => element("text", { class: "lc-axis-text", x, y, "text-anchor": anchor }, value);

function axes(bounds) {
  return [
    path("lc-axis", `M${bounds.left},${bounds.top - 8}V${bounds.bottom}H${bounds.right + 12}`),
    path("lc-arrow", `M${bounds.left - 2.5},${bounds.top - 5}l2.5,-5l2.5,5Z`),
    path("lc-arrow", `M${bounds.right + 9},${bounds.bottom - 2.5}l5,2.5l-5,2.5Z`),
  ].join("");
}

function ticksAndGrid(bounds, geometry, reference = false) {
  const grid = [];
  const ticks = [];
  for (const value of geometry.xTicks) {
    const x = geometry.x(value);
    if (value > 0) grid.push(line({ x1: x, x2: x, y1: bounds.top, y2: bounds.bottom }));
    ticks.push(line({ class: "lc-tick", x1: x, x2: x, y1: bounds.bottom, y2: bounds.bottom + 4 }));
    // The existing boundary fraction occupies the last numbered tick's space.
    if (value !== geometry.xTicks.at(-1)) ticks.push(text(x, bounds.bottom + 19, "middle", tick(value)));
  }
  ticks.push(line({ class: "lc-tick", x1: bounds.right, x2: bounds.right, y1: bounds.bottom, y2: bounds.bottom + 4 }));
  for (const value of geometry.yTicks) {
    const y = geometry.y(value);
    if (reference ? value > 0 && value !== 1 : value !== geometry.yMinimum) grid.push(line({ x1: bounds.left, x2: bounds.right, y1: y, y2: y }));
    ticks.push(line({ class: "lc-tick", x1: bounds.left - 4, x2: bounds.left, y1: y, y2: y }), text(bounds.left - 8, y + 4, "end", tick(value, 4)));
  }
  return { grid: element("g", { class: "lc-grid" }, grid.join("")), ticks: ticks.join("") };
}

function fallback(id, bounds, contents, fontSize) {
  const clip = `${id}-print-clip`;
  return element(
    "g",
    { "data-lc-print-fallback": "", "aria-hidden": "true", "font-size": fontSize },
    element(
      "defs",
      {},
      element(
        "clipPath",
        { id: clip, clipPathUnits: "userSpaceOnUse" },
        element("rect", {
          x: bounds.left,
          y: bounds.top,
          width: bounds.right - bounds.left,
          height: bounds.bottom - bounds.top,
        })
      )
    ) + contents(clip)
  );
}

export function contractionFallback(data) {
  const bounds = { left: 54, right: 472, top: 24, bottom: 248 };
  const parameters = contraction.createParameters();
  const points = contraction.curvePoints(contraction.validateDataset(data), parameters);
  // The original default desktop layout: 760px figure, 150px controls and 24px gap.
  // Use its measured legend to retain the same plotted window without requiring a browser at print time.
  const scaleX = 586.005859375 / 500;
  const scaleY = 318.779296875 / 272;
  const legend = { width: 311.6015625, height: 51.34765625 };
  const legendRight = Math.min(bounds.right, bounds.left + (16 + legend.width) / scaleX);
  const geometry = contraction.plotGeometry(
    parameters.gammaMax,
    bounds,
    Math.min(...points.flatMap((point) => [point.distance, point.function, point.closedForm])),
    {
      maximum: contraction.curveMaximumInRange(points, 0, (parameters.gammaMax * (legendRight - bounds.left)) / (bounds.right - bounds.left)),
      fraction: (16 + legend.height) / scaleY / (bounds.bottom - bounds.top),
    }
  );
  const curves = ["closedForm", "function", "distance"].map((metric) =>
    path(
      `lc-curve lc-${metric === "closedForm" ? "closed-form" : metric}`,
      points.map((point, index) => `${index ? "L" : "M"}${geometry.x(point.gamma).toFixed(2)},${geometry.y(point[metric]).toFixed(2)}`).join(" ")
    )
  );
  const radius = 2.7 / scaleX;
  const markerCount = Math.max(3, Math.round(((bounds.right - bounds.left) * scaleX) / 90));
  for (const [metric, phase] of [
    ["function", 0.25],
    ["distance", 0.75],
  ]) {
    let upper = 1;
    for (let index = 0; index < markerCount; index += 1) {
      const gamma = (parameters.gammaMax * (index + phase)) / markerCount;
      if (!(gamma > 0 && gamma < parameters.gammaMax)) continue;
      while (upper < points.length - 1 && points[upper].gamma < gamma) upper += 1;
      const before = points[upper - 1];
      const after = points[upper];
      const weight = (gamma - before.gamma) / (after.gamma - before.gamma);
      const cx = geometry.x(gamma);
      const cy = geometry.y(before[metric] + weight * (after[metric] - before[metric]));
      if (cy < bounds.top + radius || cy > bounds.bottom - radius) continue;
      curves.push(
        metric === "function"
          ? element("circle", { class: "lc-marker lc-function-marker", cx, cy, r: radius })
          : element("rect", { class: "lc-marker lc-distance-marker", x: cx - radius, y: cy - radius, width: 2 * radius, height: 2 * radius })
      );
    }
  }
  const layers = ticksAndGrid(bounds, geometry, true);
  return fallback(
    "{{ lyapunov_figure_id }}",
    bounds,
    (clip) =>
      layers.grid +
      line({ class: "lc-reference", x1: bounds.left, x2: bounds.right, y1: geometry.y(1), y2: geometry.y(1) }) +
      element("g", { "clip-path": `url(#${clip})` }, curves.join("")) +
      axes(bounds) +
      layers.ticks,
    13.6 / scaleY
  );
}

export function multiplierFallbacks(data) {
  multipliers.validateDataset(data);
  const bounds = { left: 56, right: 314, top: 80, bottom: 242 };
  const parameters = multipliers.createParameters();
  const points = multipliers.curvePoints(data, parameters);
  return [[0], [1, 2], [3, 4], [5, 6]].map((components, index) => {
    const values = points.filter((point) => point.values !== null).flatMap((point) => components.map((component) => point.values[component]));
    const geometry = multipliers.plotGeometry(parameters.gammaMax, bounds, values);
    const layers = ticksAndGrid(bounds, geometry);
    const curves = components.map((component, componentIndex) =>
      path(`lc-curve lc-function${componentIndex ? " lm-dashed" : ""}`, multipliers.curvePath(points, component, geometry))
    );
    return fallback(
      `{{ lyapunov_multipliers_id }}-${index}`,
      bounds,
      (clip) => layers.grid + axes(bounds) + layers.ticks + element("g", { "clip-path": `url(#${clip})` }, curves.join("")),
      15.9
    );
  });
}

export function memoryFallbacks(data) {
  memory.validateDataset(data);
  const bounds = { left: 54, right: 440, top: 24, bottom: 264 };
  const geometry = memory.plotGeometry(bounds);
  return memory.methodCurves(data).map((panel) => {
    const grid = [];
    const ticks = [];
    for (const value of geometry.xTicks) {
      const x = geometry.xCondition(value);
      if (value > 1 && value < 1000) grid.push(line({ x1: x, x2: x, y1: bounds.top, y2: bounds.bottom }));
      ticks.push(line({ class: "lc-tick", x1: x, x2: x, y1: bounds.bottom, y2: bounds.bottom + 4 }), text(x, bounds.bottom + 23.2, "middle", value));
    }
    for (const value of geometry.yTicks) {
      const y = geometry.y(value);
      if (value > 0 && value < 1) grid.push(line({ x1: bounds.left, x2: bounds.right, y1: y, y2: y }));
      ticks.push(line({ class: "lc-tick", x1: bounds.left - 4, x2: bounds.left, y1: y, y2: y }), text(bounds.left - 9.8, y + 4.9, "end", value));
    }
    const curves = panel.curves.map((curve) => path(`lc-curve memory-${curve.mode}`, memory.curvePath(curve.segments, geometry.x, geometry.y)));
    for (const curve of panel.curves) {
      for (const segment of curve.segments) {
        if (segment.length !== 1) continue;
        const point = segment[0];
        const cx = geometry.x(point.ratio);
        const cy = geometry.y(point.rho);
        const radius = 3.3;
        curves.push(
          curve.mode === "free"
            ? element("circle", { class: "lc-marker memory-free-marker", cx, cy, r: radius })
            : element("rect", { class: "lc-marker memory-positive-marker", x: cx - radius, y: cy - radius, width: 2 * radius, height: 2 * radius })
        );
      }
    }
    return fallback(
      `{{ lyapunov_memory_id }}-${panel.method}`,
      bounds,
      (clip) =>
        element("g", { class: "lc-grid" }, grid.join("")) +
        line({ class: "lc-reference", x1: bounds.left, x2: bounds.right, y1: bounds.top, y2: bounds.top }) +
        element("g", { "clip-path": `url(#${clip})` }, curves.join("")) +
        axes(bounds) +
        ticks.join(""),
      18
    );
  });
}

export async function generatedFallbacks() {
  const readDataset = async (name) => JSON.parse(await readFile(resolve(root, `assets/data/lyapunov-${name}.json`), "utf8"));
  const datasets = await Promise.all([readDataset("contraction"), readDataset("multipliers"), readDataset("memory")]);
  const fallbacks = {
    "lyapunov-contraction-print.liquid": contractionFallback(datasets[0]),
    "lyapunov-multipliers-print.liquid": `{% case forloop.index %}\n${multiplierFallbacks(datasets[1])
      .map((markup, index) => `{% when ${index + 1} %}\n${markup}`)
      .join("\n")}\n{% endcase %}`,
    "lyapunov-memory-print.liquid": `{% case memory_method %}\n${memoryFallbacks(datasets[2])
      .map((markup, index) => `{% when '${memory.METHODS[index].key}' %}\n${markup}`)
      .join("\n")}\n{% endcase %}`,
  };
  const options = await resolveConfig(resolve(root, "package.json"));
  return Object.fromEntries(
    await Promise.all(
      Object.entries(fallbacks).map(async ([name, markup]) => [
        name,
        await format(
          `{% comment %}Generated by scripts/generate_lyapunov_print_fallbacks.mjs. Do not edit curve coordinates by hand.{% endcomment %}\n${markup}\n`,
          { ...options, filepath: resolve(destination, name) }
        ),
      ])
    )
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await mkdir(destination, { recursive: true });
  for (const [name, markup] of Object.entries(await generatedFallbacks())) {
    await writeFile(resolve(destination, name), markup);
  }
}
