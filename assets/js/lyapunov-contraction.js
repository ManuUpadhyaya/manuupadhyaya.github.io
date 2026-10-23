import {
  validateDataset,
  createParameters,
  updateParameters,
  parameterBounds,
  controlTrack,
  curvePoints,
  plotGeometry,
  curveMaximumInRange,
} from "./lyapunov-contraction-model.mjs";
import { placeBoundaryTick } from "./lyapunov-axis-boundary.mjs";

const SVG_NS = "http://www.w3.org/2000/svg";
const PLOT = Object.freeze({ left: 54, right: 472, top: 24, bottom: 248 });
const PRECISION = Object.freeze({ epsilon: 2, L: 2, mu: 2 });

function svgNode(name, attributes = {}, text) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatTick(value, precision = 3) {
  return value === 0 ? "0" : String(Number(value.toPrecision(precision)));
}

function createPlot(svg, clipId) {
  const definitions = svgNode("defs");
  const clip = svgNode("clipPath", { id: clipId, clipPathUnits: "userSpaceOnUse" });
  clip.append(svgNode("rect", { x: PLOT.left, y: PLOT.top, width: PLOT.right - PLOT.left, height: PLOT.bottom - PLOT.top }));
  definitions.append(clip);
  const axes = svgNode("g");
  axes.append(
    svgNode("path", { class: "lc-axis", d: `M${PLOT.left},${PLOT.top - 8}V${PLOT.bottom}H${PLOT.right + 12}` }),
    svgNode("path", { class: "lc-arrow", d: `M${PLOT.left - 2.5},${PLOT.top - 5}l2.5,-5l2.5,5Z` }),
    svgNode("path", { class: "lc-arrow", d: `M${PLOT.right + 9},${PLOT.bottom - 2.5}l5,2.5l-5,2.5Z` })
  );
  const grid = svgNode("g", { class: "lc-grid" });
  const ticks = svgNode("g");
  const reference = svgNode("line", { class: "lc-reference", x1: PLOT.left, x2: PLOT.right });
  const distance = svgNode("path", { class: "lc-curve lc-distance" });
  const functionGap = svgNode("path", { class: "lc-curve lc-function" });
  const closedForm = svgNode("path", { class: "lc-curve lc-closed-form" });
  const markers = svgNode("g");
  const curves = svgNode("g", { "clip-path": `url(#${clipId})` });
  curves.append(closedForm, functionGap, distance, markers);
  svg.append(definitions, grid, reference, curves, axes, ticks);
  return { grid, ticks, reference, distance, functionGap, closedForm, markers };
}

export async function enhanceFigure(figure) {
  if (!figure || (figure.dataset.lcState && figure.dataset.lcState !== "pending")) return;
  figure.dataset.lcState = "loading";
  const status = figure.querySelector("[data-lc-status]");
  const zeroErrorStatus = figure.querySelector("[data-lc-zero-error]");
  try {
    const response = await fetch(figure.dataset.lcUrl);
    if (!response.ok) throw new Error(`Contraction data request failed (${response.status})`);
    const data = validateDataset(await response.json());
    const svg = figure.querySelector("[data-lc-plot]");
    const plot = createPlot(svg, `${figure.id}-plot-clip`);
    const description = figure.querySelector("[data-lc-description]");
    const legend = figure.querySelector(".lc-legend");
    const rhoLabel = figure.querySelector("[data-lc-axis-rho]");
    const gammaLabel = figure.querySelector("[data-lc-axis-gamma]");
    const limitLabel = figure.querySelector("[data-lc-axis-limit]");
    const inputs = new Map([...figure.querySelectorAll("[data-lc-control]")].map((input) => [input.dataset.lcControl, input]));
    const outputs = new Map([...figure.querySelectorAll("[data-lc-value]")].map((output) => [output.dataset.lcValue, output]));
    for (const name of ["L", "mu"]) {
      const track = controlTrack(name);
      const input = inputs.get(name);
      input.min = String(track.minimum);
      input.max = String(track.maximum);
      input.step = String(track.step);
    }
    let parameters = createParameters();
    let frame = 0;

    function render() {
      frame = 0;
      const points = curvePoints(data, parameters);
      const viewport = svg.viewBox.baseVal;
      const screen = svg.getBoundingClientRect();
      const scaleX = screen.width / viewport.width || 1;
      const scaleY = screen.height / viewport.height || 1;
      const numeralSize = parseFloat(getComputedStyle(outputs.get("epsilon")).fontSize);
      svg.style.fontSize = `${numeralSize / scaleY}px`;
      const measure = (element) => {
        const box = element.getBoundingClientRect();
        return { width: box.width / scaleX, height: box.height / scaleY };
      };
      const place = (element, position) => {
        element.style.left = `${(100 * position.x) / viewport.width}%`;
        element.style.top = `${(100 * position.y) / viewport.height}%`;
      };
      const mobile = matchMedia("(max-width: 620px)").matches;
      figure.dataset.lcLegendBelow = String(mobile);
      const legendSize = measure(legend);
      const legendPosition = { x: PLOT.left + 8 / scaleX, y: PLOT.top + 8 / scaleY };
      if (!mobile) place(legend, legendPosition);
      const legendRight = Math.min(PLOT.right, legendPosition.x + legendSize.width + 8 / scaleX);
      const reservedTop = mobile
        ? null
        : {
            maximum: curveMaximumInRange(points, 0, (parameters.gammaMax * (legendRight - PLOT.left)) / (PLOT.right - PLOT.left)),
            fraction: (legendPosition.y + legendSize.height + 8 / scaleY - PLOT.top) / (PLOT.bottom - PLOT.top),
          };
      const minimumDistance = Math.min(...points.map((point) => point.distance));
      const minimumFunction = Math.min(...points.map((point) => point.function));
      const minimumClosedForm = Math.min(...points.map((point) => point.closedForm));
      const { x, y, xTicks, yTicks, yMinimum, yMaximum } = plotGeometry(
        parameters.gammaMax,
        PLOT,
        Math.min(minimumDistance, minimumFunction, minimumClosedForm),
        reservedTop
      );
      const path = (metric) =>
        points.map((point, index) => `${index === 0 ? "M" : "L"}${x(point.gamma).toFixed(2)},${y(point[metric]).toFixed(2)}`).join(" ");
      plot.distance.setAttribute("d", path("distance"));
      plot.functionGap.setAttribute("d", path("function"));
      plot.closedForm.setAttribute("d", path("closedForm"));
      plot.reference.setAttribute("y1", y(1));
      plot.reference.setAttribute("y2", y(1));
      plot.ticks.replaceChildren();
      plot.grid.replaceChildren();
      const xTickGroups = [];
      for (const gamma of xTicks) {
        const position = x(gamma);
        if (gamma > 0) plot.grid.append(svgNode("line", { x1: position, x2: position, y1: PLOT.top, y2: PLOT.bottom }));
        const tick = svgNode("g");
        tick.append(
          svgNode("line", { class: "lc-tick", x1: position, x2: position, y1: PLOT.bottom, y2: PLOT.bottom + 4 }),
          svgNode("text", { class: "lc-axis-text", x: position, y: PLOT.bottom + 19, "text-anchor": "middle" }, formatTick(gamma))
        );
        plot.ticks.append(tick);
        xTickGroups.push(tick);
      }
      plot.ticks.append(svgNode("line", { class: "lc-tick", x1: PLOT.right, x2: PLOT.right, y1: PLOT.bottom, y2: PLOT.bottom + 4 }));
      for (const rho of yTicks) {
        const position = y(rho);
        if (rho > 0 && rho !== 1) plot.grid.append(svgNode("line", { x1: PLOT.left, x2: PLOT.right, y1: position, y2: position }));
        plot.ticks.append(
          svgNode("line", { class: "lc-tick", x1: PLOT.left - 4, x2: PLOT.left, y1: position, y2: position }),
          svgNode("text", { class: "lc-axis-text", x: PLOT.left - 8, y: position + 4, "text-anchor": "end" }, formatTick(rho, 4))
        );
      }
      plot.markers.replaceChildren();
      const markerCount = Math.max(3, Math.round(((PLOT.right - PLOT.left) * scaleX) / 90));
      const radius = 2.7 / scaleX;
      const addMarkers = (metric, phase) => {
        let upper = 1;
        for (let index = 0; index < markerCount; index += 1) {
          const gamma = (parameters.gammaMax * (index + phase)) / markerCount;
          if (!(gamma > 0 && gamma < parameters.gammaMax)) continue;
          while (upper < points.length - 1 && points[upper].gamma < gamma) upper += 1;
          const before = points[upper - 1];
          const after = points[upper];
          const weight = (gamma - before.gamma) / (after.gamma - before.gamma);
          const cx = x(gamma);
          const cy = y(before[metric] + weight * (after[metric] - before[metric]));
          if (cy < PLOT.top + radius || cy > PLOT.bottom - radius) continue;
          plot.markers.append(
            metric === "function"
              ? svgNode("circle", { class: "lc-marker lc-function-marker", cx, cy, r: radius })
              : svgNode("rect", { class: "lc-marker lc-distance-marker", x: cx - radius, y: cy - radius, width: 2 * radius, height: 2 * radius })
          );
        }
      };
      addMarkers("function", 0.25);
      addMarkers("distance", 0.75);
      placeBoundaryTick(limitLabel, svg, PLOT, xTickGroups);
      const rhoSize = measure(rhoLabel);
      const gammaSize = measure(gammaLabel);
      place(rhoLabel, { x: PLOT.left + 8, y: Math.max(0, PLOT.top - 10 - rhoSize.height / 2) });
      place(gammaLabel, { x: Math.min(PLOT.right + 17, viewport.width - gammaSize.width - 1), y: PLOT.bottom - gammaSize.height / 2 });
      for (const [name, bounds] of Object.entries(parameterBounds(parameters))) {
        inputs.get(name).setAttribute("aria-valuemin", String(bounds.minimum));
        inputs.get(name).setAttribute("aria-valuemax", String(bounds.maximum));
      }
      for (const name of ["epsilon", "L", "mu"]) {
        const input = inputs.get(name);
        input.value = String(parameters[name]);
        input.setAttribute("aria-valuetext", parameters[name].toFixed(PRECISION[name]));
        outputs.get(name).value = parameters[name].toFixed(PRECISION[name]);
      }
      const zeroError = parameters.epsilon === 0;
      figure.dataset.lcEpsilonZero = String(zeroError);
      status.hidden = true;
      zeroErrorStatus.hidden = !zeroError;
      description.textContent = `Relative error ε = ${parameters.epsilon.toFixed(PRECISION.epsilon)}, smoothness L = ${parameters.L.toFixed(
        PRECISION.L
      )}, and strong convexity μ = ${parameters.mu.toFixed(
        PRECISION.mu
      )}. The horizontal axis is step size γ. Curves are sampled strictly between 0 and ${formatTick(
        parameters.gammaMax
      )}. The vertical axis runs from ${formatTick(yMinimum, 4)} to ${formatTick(
        yMaximum,
        4
      )}, and portions outside this window are clipped. The dashed black curve with hollow square markers shows the contraction factor for the squared distance to the solution, with a displayed minimum of ${formatTick(
        minimumDistance
      )}; the solid black curve with hollow circle markers shows the contraction factor for function-value suboptimality, with a displayed minimum of ${formatTick(
        minimumFunction
      )}. The thicker solid gray curve is the closed-form factor for function-value suboptimality shown in the legend and is drawn behind the black curves so that overlaps remain visible. The staggered marker shapes and line styles are the same for all parameter values. The horizontal dotted line marks contraction factor 1. The black curves interpolate precomputed semidefinite program solutions.`;
    }

    function queue(name, value) {
      parameters = updateParameters(parameters, name, value);
      inputs.get(name).value = String(parameters[name]);
      schedule();
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(render);
    }

    for (const [name, input] of inputs) {
      input.addEventListener("input", () => queue(name, Number(input.value)));
      input.disabled = false;
    }
    svg.removeAttribute("hidden");
    status.hidden = true;
    render();
    figure.dataset.lcState = "ready";
    window.addEventListener("beforeprint", render);
    window.addEventListener("afterprint", schedule);
    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(schedule);
      for (const element of [svg, legend, rhoLabel, gammaLabel, limitLabel]) resizeObserver.observe(element);
    } else {
      window.addEventListener("resize", schedule, { passive: true });
    }
  } catch (error) {
    figure.dataset.lcState = "unavailable";
    for (const element of figure.querySelectorAll(".lc-axis-label, .lc-legend, .lc-canvas")) element.removeAttribute("style");
    zeroErrorStatus.hidden = true;
    status.hidden = false;
    figure.querySelector("[data-lc-plot]")?.setAttribute("hidden", "");
    for (const input of figure.querySelectorAll("[data-lc-control]")) input.disabled = true;
    status.textContent = "This interactive figure is temporarily unavailable.";
    console.warn("Interactive contraction figure unavailable:", error);
  }
}
