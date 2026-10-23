import { METHODS, MODES, validateDataset, methodCurves, curvePath, plotGeometry } from "./lyapunov-memory-model.mjs";

const SVG_NS = "http://www.w3.org/2000/svg";
const PLOT = Object.freeze({ left: 54, right: 440, top: 24, bottom: 264 });

function svgNode(name, attributes = {}, text) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

function createPlot(wrapper, figureId) {
  const svg = wrapper.querySelector("[data-memory-plot]");
  const clipId = `${figureId}-${wrapper.dataset.memoryMethod}-clip`;
  const definitions = svgNode("defs");
  const clip = svgNode("clipPath", { id: clipId, clipPathUnits: "userSpaceOnUse" });
  clip.append(svgNode("rect", { x: PLOT.left, y: PLOT.top, width: PLOT.right - PLOT.left, height: PLOT.bottom - PLOT.top }));
  definitions.append(clip);
  const grid = svgNode("g", { class: "lc-grid" });
  const reference = svgNode("line", { class: "lc-reference", x1: PLOT.left, x2: PLOT.right, y1: PLOT.top, y2: PLOT.top });
  const curves = svgNode("g", { "clip-path": `url(#${clipId})` });
  const paths = new Map();
  for (const mode of MODES) {
    const path = svgNode("path", { class: `lc-curve memory-${mode}` });
    paths.set(mode, path);
    curves.append(path);
  }
  const markers = svgNode("g");
  curves.append(markers);
  const axes = svgNode("g");
  axes.append(
    svgNode("path", { class: "lc-axis", d: `M${PLOT.left},${PLOT.top - 8}V${PLOT.bottom}H${PLOT.right + 12}` }),
    svgNode("path", { class: "lc-arrow", d: `M${PLOT.left - 2.5},${PLOT.top - 5}l2.5,-5l2.5,5Z` }),
    svgNode("path", { class: "lc-arrow", d: `M${PLOT.right + 9},${PLOT.bottom - 2.5}l5,2.5l-5,2.5Z` })
  );
  const ticks = svgNode("g");
  svg.append(definitions, grid, reference, curves, axes, ticks);
  return { wrapper, svg, grid, ticks, markers, paths, description: wrapper.querySelector("[data-memory-description]") };
}

function marker(mode, cx, cy, radius) {
  const attributes = { class: `lc-marker memory-${mode}-marker` };
  return mode === "free"
    ? svgNode("circle", { ...attributes, cx, cy, r: radius })
    : svgNode("rect", { ...attributes, x: cx - radius, y: cy - radius, width: 2 * radius, height: 2 * radius });
}

export async function enhanceFigure(figure) {
  if (!figure || figure.dataset.memoryState) return;
  figure.dataset.memoryState = "loading";
  figure.dataset.lcState = "loading";
  const status = figure.querySelector("[data-memory-status]");
  try {
    const response = await fetch(figure.dataset.memoryUrl);
    if (!response.ok) throw new Error(`Lyapunov search data request failed (${response.status})`);
    const data = validateDataset(await response.json());
    const plots = new Map(
      [...figure.querySelectorAll("[data-memory-method]")].map((wrapper) => [wrapper.dataset.memoryMethod, createPlot(wrapper, figure.id)])
    );
    let frame = 0;

    function render() {
      frame = 0;
      const panels = methodCurves(data);
      for (const panel of panels) {
        const plot = plots.get(panel.method);
        const { svg } = plot;
        const viewport = svg.viewBox.baseVal;
        const screen = svg.getBoundingClientRect();
        const scaleX = screen.width / viewport.width || 1;
        const scaleY = screen.height / viewport.height || 1;
        const textSize = parseFloat(getComputedStyle(figure).fontSize) * 0.85;
        svg.style.fontSize = `${textSize / scaleY}px`;
        const { x, xCondition, y, xTicks, yTicks } = plotGeometry(PLOT);
        plot.grid.replaceChildren();
        plot.ticks.replaceChildren();
        for (const value of xTicks) {
          const position = xCondition(value);
          if (value > 1 && value < 1000) plot.grid.append(svgNode("line", { x1: position, x2: position, y1: PLOT.top, y2: PLOT.bottom }));
          plot.ticks.append(
            svgNode("line", { class: "lc-tick", x1: position, x2: position, y1: PLOT.bottom, y2: PLOT.bottom + 4 }),
            svgNode("text", { class: "lc-axis-text", x: position, y: PLOT.bottom + 19 / scaleY, "text-anchor": "middle" }, String(value))
          );
        }
        for (const value of yTicks) {
          if (value > 0 && value < 1) plot.grid.append(svgNode("line", { x1: PLOT.left, x2: PLOT.right, y1: y(value), y2: y(value) }));
          plot.ticks.append(
            svgNode("line", { class: "lc-tick", x1: PLOT.left - 4, x2: PLOT.left, y1: y(value), y2: y(value) }),
            svgNode("text", { class: "lc-axis-text", x: PLOT.left - 8 / scaleX, y: y(value) + 4 / scaleY, "text-anchor": "end" }, String(value))
          );
        }
        plot.markers.replaceChildren();
        for (const curve of panel.curves) {
          plot.paths.get(curve.mode).setAttribute("d", curvePath(curve.segments, x, y));
          for (const segment of curve.segments) {
            if (segment.length === 1) {
              const point = segment[0];
              plot.markers.append(marker(curve.mode, x(point.ratio), y(point.rho), 2.7 / scaleX));
            }
          }
        }
        for (const [selector, position] of [
          ["[data-memory-axis-rho]", { x: PLOT.left + 8, y: 0 }],
          ["[data-memory-axis-ratio]", { x: PLOT.right + 17, y: PLOT.bottom }],
        ]) {
          const label = plot.wrapper.querySelector(selector);
          const box = label.getBoundingClientRect();
          const width = box.width / scaleX;
          const height = box.height / scaleY;
          label.style.left = `${(100 * Math.min(position.x, viewport.width - width - 1)) / viewport.width}%`;
          label.style.top = `${(100 * Math.max(0, position.y - height / 2)) / viewport.height}%`;
        }
        const curveDescriptions = panel.curves
          .map((curve) => {
            const available = curve.segments.flat();
            const range = available.length
              ? `factors range from ${Math.min(...available.map(({ rho }) => rho)).toPrecision(3)} to ${Math.max(
                  ...available.map(({ rho }) => rho)
                ).toPrecision(3)};`
              : "no factor below one was found;";
            const mode = curve.mode === "free" ? "Without additional constraints" : "With additional constraints";
            return `${mode}: ${range} ${curve.missing} of ${data.axes.ratio.length} samples are unavailable.`;
          })
          .join(" ");
        plot.description.textContent = `${
          METHODS.find(({ key }) => key === panel.method).label
        }. Performance measure: squared distance of x to the solution. Horizontal axis: condition number L over mu on a logarithmic scale from one to one thousand; sampled condition numbers range from ${(
          1 / data.axes.ratio.at(-1)
        ).toPrecision(4)} to ${(1 / data.axes.ratio[0]).toPrecision(
          4
        )}, all strictly greater than one. Vertical axis: certifiable Lyapunov contraction factor rho from zero to one. ${curveDescriptions} Lines join adjacent available samples only. Isolated available samples are shown as points. Gaps mean no contraction factor below one was found. Both curves use the Lyapunov search problem. The solid gray curve uses no additional constraints. The dashed black curve adds the constraints that Q is positive semidefinite and q is nonnegative. Where curves coincide, the gray solid curve remains visible between the black dashes.`;
      }
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(render);
    }

    for (const { svg } of plots.values()) svg.removeAttribute("hidden");
    status.hidden = true;
    figure.dataset.memoryState = "ready";
    figure.dataset.lcState = "ready";
    render();
    window.addEventListener("beforeprint", render);
    window.addEventListener("afterprint", schedule);
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(schedule);
      for (const { svg, wrapper } of plots.values()) {
        observer.observe(svg);
        for (const label of wrapper.querySelectorAll(".lc-axis-label")) observer.observe(label);
      }
    } else {
      window.addEventListener("resize", schedule, { passive: true });
    }
    document.fonts?.ready.then(schedule);
    window.MathJax?.startup?.promise?.then(schedule);
  } catch (error) {
    figure.dataset.memoryState = "unavailable";
    figure.dataset.lcState = "unavailable";
    for (const element of figure.querySelectorAll(".lc-axis-label, .lc-legend, .lc-canvas")) element.removeAttribute("style");
    for (const svg of figure.querySelectorAll("[data-memory-plot]")) svg.setAttribute("hidden", "");
    status.hidden = false;
    status.textContent = "This interactive figure is temporarily unavailable.";
    console.warn("Interactive Lyapunov search figure unavailable:", error);
  }
}
