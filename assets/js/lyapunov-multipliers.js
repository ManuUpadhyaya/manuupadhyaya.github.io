import {
  validateDataset,
  createParameters,
  updateParameters,
  parameterBounds,
  controlTrack,
  curvePoints,
  curvePath,
  plotGeometry,
} from "./lyapunov-multipliers-model.mjs";

import { placeBoundaryTick } from "./lyapunov-axis-boundary.mjs";
import { formulaCurvePoints } from "./lyapunov-multiplier-formulas.mjs";
import { validateFixedDataset, checkFixedExpressionGrid } from "./lyapunov-multiplier-fixed.mjs";
import { createDatasetSelection, createFixedExpressionControl, fetchJsonDataset, toggleZeroMask } from "./lyapunov-multipliers-loading.mjs";
import { validateRestrictionIndex, validateFamilyDataset, requiredFamilies, restrictionCurvePoints } from "./lyapunov-multiplier-restrictions.mjs";

const SVG_NS = "http://www.w3.org/2000/svg";
const PLOT = Object.freeze({ left: 56, right: 314, top: 80, bottom: 242 });

function svgNode(name, attributes = {}, text) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatTick(value, precision = 3) {
  return value === 0 ? "0" : String(Number(value.toPrecision(precision)));
}

function createPlot(panel, clipId) {
  const svg = panel.querySelector("[data-lm-plot]");
  const components = panel.dataset.lmPanel.split(",").map(Number);
  const clip = svgNode("clipPath", { id: clipId, clipPathUnits: "userSpaceOnUse" });
  clip.append(svgNode("rect", { x: PLOT.left, y: PLOT.top, width: PLOT.right - PLOT.left, height: PLOT.bottom - PLOT.top }));
  const definitions = svgNode("defs");
  definitions.append(clip);
  const grid = svgNode("g", { class: "lc-grid" });
  const ticks = svgNode("g");
  const axes = svgNode("g");
  axes.append(
    svgNode("path", { class: "lc-axis", d: `M${PLOT.left},${PLOT.top - 8}V${PLOT.bottom}H${PLOT.right + 12}` }),
    svgNode("path", { class: "lc-arrow", d: `M${PLOT.left - 2.5},${PLOT.top - 5}l2.5,-5l2.5,5Z` }),
    svgNode("path", { class: "lc-arrow", d: `M${PLOT.right + 9},${PLOT.bottom - 2.5}l5,2.5l-5,2.5Z` })
  );
  const paths = components.map((component, index) => svgNode("path", { class: `lc-curve lc-function${index ? " lm-dashed" : ""}` }));
  const curves = svgNode("g", { "clip-path": `url(#${clipId})` });
  const reference = svgNode("path", { class: "lc-curve lc-closed-form" });
  curves.append(reference, ...paths);
  svg.append(definitions, grid, axes, ticks, curves);
  return {
    svg,
    components,
    paths,
    reference,
    referenceComponent: components.find((component) => [0, 2, 4, 5].includes(component)),
    grid,
    ticks,
    legend: panel.querySelector(".lc-legend"),
    gammaLabel: panel.querySelector("[data-lm-axis-gamma]"),
    limitLabel: panel.querySelector("[data-lm-axis-limit]"),
    description: panel.querySelector("[data-lm-description]"),
  };
}

export async function enhanceFigure(figure) {
  if (!figure || (figure.dataset.lcState && figure.dataset.lcState !== "pending")) return;
  figure.dataset.lcState = "loading";
  const status = figure.querySelector("[data-lm-status]");
  const zeroErrorStatus = figure.querySelector("[data-lm-zero-error]");
  const zeroTauStatus = figure.querySelector("[data-lm-zero-tau]");
  const panels = figure.querySelector("[data-lm-panels]");
  try {
    const data = validateDataset(await fetchJsonDataset(figure.dataset.lmUrl));
    const plots = [...figure.querySelectorAll("[data-lm-panel]")].map((panel, index) => createPlot(panel, `${figure.id}-clip-${index}`));
    const notice = figure.querySelector("[data-lm-notice]");
    const inputs = new Map([...figure.querySelectorAll("[data-lm-control]")].map((input) => [input.dataset.lmControl, input]));
    const outputs = new Map([...figure.querySelectorAll("[data-lm-value]")].map((output) => [output.dataset.lmValue, output]));
    for (const name of ["L", "mu"]) {
      const track = controlTrack(name);
      const input = inputs.get(name);
      input.min = String(track.minimum);
      input.max = String(track.maximum);
      input.step = String(track.step);
    }
    const zeroToggles = [...figure.querySelectorAll("[data-lm-zero]")];
    const presetButtons = [...figure.querySelectorAll("[data-lm-preset]")];
    const formulaLabels = [...figure.querySelectorAll("[data-lm-formula]")];
    const formulaCaption = figure.querySelector("[data-lm-formula-caption]");
    const fixedButtons = [...figure.querySelectorAll("[data-lm-fix]")];
    const fixedControls = figure.querySelector("[data-lm-fixed-controls]");
    const fixedValues = figure.querySelector("[data-lm-fixed-values]");
    const fixedStatus = figure.querySelector("[data-lm-fixed-status]");
    const zeroHeading = figure.querySelector("[data-lm-zero-heading]");
    const zeroGrid = figure.querySelector("[data-lm-zero-grid]");
    const rawLegends = [...figure.querySelectorAll("[data-lm-legend-raw]")];
    const fixedLegends = [...figure.querySelectorAll("[data-lm-legend-fixed]")];
    const rawCaption = figure.querySelector("[data-lm-raw-caption]");
    const fixedCaption = figure.querySelector("[data-lm-fixed-caption]");
    const fixedCaptionResult = figure.querySelector("[data-lm-fixed-caption-result]");
    const showFormulas = (visible, fixed = false) => {
      figure.dataset.lmFormulas = String(visible);
      figure.dataset.lmFixed = String(fixed);
      for (const label of formulaLabels) label.hidden = !visible || fixed;
      for (const legend of rawLegends) legend.hidden = fixed;
      for (const legend of fixedLegends) legend.hidden = !fixed;
      formulaCaption.hidden = !visible || fixed;
      fixedControls.hidden = !visible;
      for (const button of fixedButtons) button.hidden = !visible;
      fixedValues.hidden = !fixed;
      zeroGrid.hidden = fixed;
      zeroHeading.textContent = fixed ? "Fixed multipliers" : "Set to zero";
      fixedStatus.hidden = !fixed;
      rawCaption.hidden = fixed;
      fixedCaption.hidden = !fixed;
    };
    const restrictionsUrl = new URL(figure.dataset.lmRestrictionsUrl, document.baseURI);
    let restrictionsIndex;
    let indexPromise;
    const loadIndex = () => {
      if (!indexPromise) {
        indexPromise = fetchJsonDataset(restrictionsUrl)
          .then((index) => {
            restrictionsIndex = validateRestrictionIndex(index, data);
            return restrictionsIndex;
          })
          .catch((error) => {
            indexPromise = null;
            throw error;
          });
      }
      return indexPromise;
    };
    const selection = createDatasetSelection(async (family) => {
      const index = await loadIndex();
      const url = new URL(index.families[family].file, restrictionsUrl);
      return validateFamilyDataset(await fetchJsonDataset(url, true), index);
    });
    let zeroMask = 0;
    let selectedTables = null;
    let restrictionLoading = false;
    let restrictionError = false;
    let parameters = createParameters();
    let frame = 0;
    const fixedControl = createFixedExpressionControl(
      async () => validateFixedDataset(await fetchJsonDataset(figure.dataset.lmFixedUrl), data),
      schedule
    );

    function render() {
      frame = 0;
      showFormulas(false);
      const fixedState = fixedControl.getState();
      for (const button of fixedButtons) {
        button.setAttribute("aria-pressed", String(fixedState.selected));
        button.textContent = fixedState.selected ? "Release expressions" : "Fix to expressions";
        button.setAttribute(
          "aria-label",
          fixedState.selected ? "Release expressions for the prescribed multipliers" : "Fix to expressions for all multipliers"
        );
      }
      for (const plot of plots) plot.reference.setAttribute("d", "");
      for (const [name, bounds] of Object.entries(parameterBounds(parameters))) {
        inputs.get(name).setAttribute("aria-valuemin", String(bounds.minimum));
        inputs.get(name).setAttribute("aria-valuemax", String(bounds.maximum));
      }
      for (const name of ["epsilon", "L", "mu"]) {
        const value = parameters[name].toFixed(2);
        inputs.get(name).value = String(parameters[name]);
        inputs.get(name).setAttribute("aria-valuetext", value);
        outputs.get(name).value = value;
      }
      zeroTauStatus.hidden = true;
      for (const button of zeroToggles) button.setAttribute("aria-pressed", String(Boolean(zeroMask & (1 << Number(button.dataset.lmZero)))));
      for (const button of presetButtons) {
        const selected = zeroMask === Number(button.dataset.lmPreset);
        button.setAttribute("aria-pressed", String(selected));
        button.textContent = selected ? "Unselect" : "Select";
        button.setAttribute(
          "aria-label",
          selected
            ? "Unselect the three-zero setting and allow all multipliers"
            : "Select lambda k star, lambda k plus one star, and lambda k plus one k to be zero"
        );
      }
      if (parameters.epsilon === 0) {
        panels.hidden = true;
        notice.hidden = true;
        status.hidden = true;
        zeroErrorStatus.hidden = false;
        return;
      }
      zeroErrorStatus.hidden = true;
      if (zeroMask & 1) {
        panels.hidden = true;
        notice.hidden = true;
        status.hidden = true;
        zeroTauStatus.hidden = false;
        return;
      }
      if (zeroMask && (restrictionLoading || restrictionError || !selectedTables)) {
        panels.hidden = true;
        notice.hidden = true;
        status.hidden = false;
        status.textContent = restrictionLoading ? "Loading constrained solver multipliers…" : "Constrained solver data is temporarily unavailable.";
        return;
      }
      const referencePoints = zeroMask === 74 ? formulaCurvePoints(data, parameters) : [];
      const points = fixedState.selected
        ? referencePoints
        : zeroMask
          ? restrictionCurvePoints(data, restrictionsIndex ?? data, selectedTables, zeroMask, parameters)
          : curvePoints(data, parameters);
      const available = points.filter((point) => point.values !== null);
      if (!available.some((point) => point.step > 0)) {
        panels.hidden = true;
        notice.hidden = true;
        status.hidden = false;
        status.textContent =
          zeroMask && points.filter((point) => point.step > 0).every((point) => point.status === 0)
            ? "The selected zero constraints are infeasible at this factor for positive step sizes."
            : "No solver certificate was returned at these parameter values.";
        return;
      }
      panels.hidden = false;
      status.hidden = true;
      notice.hidden = fixedState.selected || available.length === points.length;
      notice.textContent = zeroMask ? "Gaps mark infeasible or unavailable solver samples." : "Gaps mark unavailable solver samples.";
      const formulaVisible = referencePoints.length > 1;
      const fixedPresentation = formulaVisible && fixedState.selected;
      showFormulas(formulaVisible, fixedPresentation);
      let sampledCheckCaption = "";
      if (fixedPresentation) {
        if (fixedState.loading) {
          fixedStatus.textContent = "Loading recorded MOSEK checks…";
          sampledCheckCaption = "Recorded MOSEK sample checks are loading.";
        } else if (fixedState.error || !fixedState.data) {
          fixedStatus.textContent = "Recorded MOSEK checks are temporarily unavailable.";
          sampledCheckCaption = fixedStatus.textContent;
        } else {
          const checks = checkFixedExpressionGrid(fixedState.data, parameters);
          if (checks.status === 1) {
            fixedStatus.textContent = "MOSEK: feasible at all checked samples.";
            sampledCheckCaption = "MOSEK found this choice feasible at all checked samples.";
          } else if (checks.status === 0) {
            fixedStatus.textContent = "MOSEK: infeasible at all checked samples.";
            sampledCheckCaption = "MOSEK found this choice infeasible at all checked samples.";
          } else {
            fixedStatus.textContent = "MOSEK checks do not establish feasibility at all sampled points.";
            sampledCheckCaption = fixedStatus.textContent;
          }
        }
        fixedCaptionResult.textContent = sampledCheckCaption;
      }
      const numeralSize = parseFloat(getComputedStyle(outputs.get("epsilon")).fontSize);
      for (const plot of plots) {
        const { svg, components, paths, reference, referenceComponent, grid, ticks, legend, gammaLabel, limitLabel, description } = plot;
        const viewport = svg.viewBox.baseVal;
        const screen = svg.getBoundingClientRect();
        const scaleX = screen.width / viewport.width || 1;
        const scaleY = screen.height / viewport.height || 1;
        svg.style.fontSize = `${numeralSize / scaleY}px`;
        const place = (element, x, y) => {
          element.style.left = `${(100 * x) / viewport.width}%`;
          element.style.top = `${(100 * y) / viewport.height}%`;
        };
        place(legend, PLOT.left, 8);
        const gammaSize = gammaLabel.getBoundingClientRect();
        place(gammaLabel, Math.min(PLOT.right + 17, viewport.width - gammaSize.width / scaleX - 1), PLOT.bottom - gammaSize.height / scaleY / 2);
        const values = available.flatMap((point) => components.map((component) => point.values[component]));
        if (formulaVisible) values.push(...referencePoints.map((point) => point.values[referenceComponent]));
        const geometry = plotGeometry(parameters.gammaMax, PLOT, values);
        if (formulaVisible && !fixedPresentation) reference.setAttribute("d", curvePath(referencePoints, referenceComponent, geometry));
        components.forEach((component, index) => paths[index].setAttribute("d", curvePath(points, component, geometry)));
        ticks.replaceChildren();
        grid.replaceChildren();
        const xTickGroups = [];
        for (const gamma of geometry.xTicks) {
          const position = geometry.x(gamma);
          if (gamma > 0) grid.append(svgNode("line", { x1: position, x2: position, y1: PLOT.top, y2: PLOT.bottom }));
          const group = svgNode("g");
          group.append(
            svgNode("line", { class: "lc-tick", x1: position, x2: position, y1: PLOT.bottom, y2: PLOT.bottom + 4 }),
            svgNode("text", { class: "lc-axis-text", x: position, y: PLOT.bottom + 19, "text-anchor": "middle" }, formatTick(gamma))
          );
          ticks.append(group);
          xTickGroups.push(group);
        }
        ticks.append(svgNode("line", { class: "lc-tick", x1: PLOT.right, x2: PLOT.right, y1: PLOT.bottom, y2: PLOT.bottom + 4 }));
        for (const value of geometry.yTicks) {
          const position = geometry.y(value);
          if (value !== geometry.yMinimum) grid.append(svgNode("line", { x1: PLOT.left, x2: PLOT.right, y1: position, y2: position }));
          ticks.append(
            svgNode("line", { class: "lc-tick", x1: PLOT.left - 4, x2: PLOT.left, y1: position, y2: position }),
            svgNode("text", { class: "lc-axis-text", x: PLOT.left - 8, y: position + 4, "text-anchor": "end" }, formatTick(value, 4))
          );
        }
        placeBoundaryTick(limitLabel, svg, PLOT, xTickGroups);
        const names = components.map((component) => (data.order[component] === "tau" ? "τ" : `λ(${data.order[component]})`));
        description.textContent = `${fixedPresentation ? "Prescribed multiplier values" : "Raw MOSEK Fusion multipliers"} ${names.join(
          " (solid black) and "
        )} ${
          components.length > 1 ? "(dashed black)" : "(solid black)"
        }, with rho fixed at the exact function-value bound. Relative error ε = ${parameters.epsilon.toFixed(
          2
        )}, smoothness L = ${parameters.L.toFixed(2)}, strong convexity μ = ${parameters.mu.toFixed(
          2
        )}. The displayed step sizes γ lie strictly between 0 and ${formatTick(
          parameters.gammaMax
        )}. This panel's multiplier axis runs from ${formatTick(geometry.yMinimum, 4)} to ${formatTick(geometry.yMaximum, 4)}. ${
          zeroMask ? "Selected multipliers are constrained to zero. " : ""
        }${
          fixedPresentation
            ? `All multipliers are fixed to the displayed expressions. ${sampledCheckCaption}`
            : `${
                formulaVisible ? "The thick gray curve shows the expression fitted to the numerical data. " : ""
              }Straight segments interpolate the returned solver samples; gaps mark unavailable samples. The multipliers can be nonunique. No secondary optimization or smoothing is applied.`
        }`;
      }
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(render);
    }

    for (const [name, input] of inputs) {
      input.addEventListener("input", () => {
        parameters = updateParameters(parameters, name, Number(input.value));
        input.value = String(parameters[name]);
        schedule();
      });
      input.disabled = false;
    }
    function setZeroMask(nextMask) {
      if (nextMask === zeroMask && !restrictionError) return;
      zeroMask = nextMask;
      fixedControl.setMask(zeroMask);
      selectedTables = null;
      restrictionError = false;
      restrictionLoading = false;
      selection.invalidate();
      if (zeroMask && !(zeroMask & 1)) {
        const families = requiredFamilies(zeroMask);
        restrictionLoading = true;
        selection.select(families).then((result) => {
          if (!result.current) return;
          restrictionLoading = false;
          restrictionError = Boolean(result.error);
          selectedTables = result.datasets ?? null;
          schedule();
        });
      }
      schedule();
    }

    for (const button of zeroToggles) {
      button.addEventListener("click", () => setZeroMask(toggleZeroMask(zeroMask, Number(button.dataset.lmZero))));
      button.disabled = false;
    }
    for (const button of presetButtons) {
      button.addEventListener("click", () => {
        const preset = Number(button.dataset.lmPreset);
        setZeroMask(zeroMask === preset ? 0 : preset);
      });
      button.disabled = false;
    }
    for (const button of fixedButtons) {
      button.addEventListener("click", () => fixedControl.toggle());
      button.disabled = false;
    }
    render();
    figure.dataset.lcState = "ready";
    window.addEventListener("beforeprint", render);
    window.addEventListener("afterprint", schedule);
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(schedule);
      for (const plot of plots) {
        for (const element of [plot.svg, plot.legend, plot.gammaLabel, plot.limitLabel]) observer.observe(element);
      }
    } else {
      window.addEventListener("resize", schedule, { passive: true });
    }
  } catch (error) {
    figure.dataset.lcState = "unavailable";
    for (const element of figure.querySelectorAll(".lc-axis-label, .lc-legend, .lc-canvas")) element.removeAttribute("style");
    figure.dataset.lmFormulas = "false";
    figure.dataset.lmFixed = "false";
    for (const element of figure.querySelectorAll(
      "[data-lm-formula], [data-lm-formula-caption], [data-lm-fixed-caption], [data-lm-fixed-controls], [data-lm-fix]"
    ))
      element.hidden = true;
    figure.querySelector("[data-lm-raw-caption]").hidden = false;
    panels.hidden = true;
    zeroErrorStatus.hidden = true;
    zeroTauStatus.hidden = true;
    status.hidden = false;
    status.textContent = "This interactive figure is temporarily unavailable.";
    for (const input of figure.querySelectorAll("[data-lm-control], [data-lm-zero], [data-lm-preset], [data-lm-fix]")) input.disabled = true;
    console.warn("Interactive multiplier figure unavailable:", error);
  }
}
