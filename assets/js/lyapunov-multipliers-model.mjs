export { createParameters, updateParameters, parameterBounds, controlTrack } from "./lyapunov-contraction-model.mjs";

const ORDER = Object.freeze(["tau", "k,star", "star,k", "k+1,star", "star,k+1", "k,k+1", "k+1,k"]);
const LIMITS = Object.freeze({ epsilon: [0, 0.99], ratio: [0.001, 0.99], step: [0, 2] });

function finite(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Invalid ${name}`);
  return value;
}

export function validateDataset(data) {
  if (!data || data.version !== 1 || data.solver !== "MOSEK Fusion") throw new Error("Unsupported multiplier data");
  if (!Array.isArray(data.order) || data.order.length !== ORDER.length || data.order.some((name, index) => name !== ORDER[index])) {
    throw new Error("Invalid multiplier order");
  }
  let size = ORDER.length;
  for (const name of Object.keys(LIMITS)) {
    const axis = data.axes?.[name];
    const [minimum, maximum] = LIMITS[name];
    if (!Array.isArray(axis) || axis.length < 2 || axis.length > 1000) throw new Error(`Invalid ${name} axis`);
    for (let index = 0; index < axis.length; index += 1) {
      const value = finite(axis[index], `${name} axis`);
      if (value < minimum || value > maximum || (index && value <= axis[index - 1])) throw new Error(`Invalid ${name} axis bounds`);
    }
    const complete = name === "epsilon" ? (axis[0] === 0 || axis[0] === 0.01) && axis.includes(0.01) : axis[0] === minimum;
    if (!complete || axis.at(-1) !== maximum) throw new Error(`Incomplete ${name} axis`);
    size *= axis.length;
  }
  if (size > 14_000_000 || !Array.isArray(data.values) || data.values.length !== size) throw new Error("Incomplete multiplier data");
  for (let offset = 0; offset < size; offset += ORDER.length) {
    const missing = data.values[offset] === null;
    for (let component = 0; component < ORDER.length; component += 1) {
      const value = data.values[offset + component];
      if (missing ? value !== null : typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error("Multiplier records must contain seven finite values or seven nulls");
      }
    }
  }
  return data;
}

function bracket(axis, value) {
  finite(value, "interpolation parameter");
  if (value < axis[0] - 1e-12 || value > axis.at(-1) + 1e-12) throw new Error("Parameter is outside the multiplier grid");
  const bounded = Math.max(axis[0], Math.min(axis.at(-1), value));
  let lower = 0;
  let upper = axis.length - 1;
  while (upper - lower > 1) {
    const middle = Math.floor((lower + upper) / 2);
    if (axis[middle] <= bounded) lower = middle;
    else upper = middle;
  }
  const weight = (bounded - axis[lower]) / (axis[upper] - axis[lower]);
  return [
    [lower, 1 - weight],
    [upper, weight],
  ].filter(([, contribution]) => contribution > 0);
}

export function interpolateMultipliers(data, epsilon, ratio, step) {
  finite(epsilon, "epsilon");
  if (epsilon < 0 || epsilon > 0.99) throw new Error("Parameter is outside the multiplier grid");
  const ratios = bracket(data.axes.ratio, ratio);
  const steps = bracket(data.axes.step, step);
  if (epsilon === 0) return null;
  const epsilons = bracket(data.axes.epsilon, epsilon);
  const result = Array(ORDER.length).fill(0);
  for (const [e, ew] of epsilons) {
    for (const [r, rw] of ratios) {
      for (const [s, sw] of steps) {
        const offset = ((e * data.axes.ratio.length + r) * data.axes.step.length + s) * ORDER.length;
        if (data.values[offset] === null) return null;
        const weight = ew * rw * sw;
        for (let component = 0; component < ORDER.length; component += 1) result[component] += weight * data.values[offset + component];
      }
    }
  }
  return result;
}

export function curveSteps(data) {
  // Boundary knots support interpolation; the displayed curves lie strictly in 0 < step < 2.
  const inset = 2e-6;
  return [...new Set([inset, ...data.axes.step.filter((step) => step > 0 && step < 2), 2 - inset])].sort((a, b) => a - b);
}

export function curvePoints(data, parameters) {
  return curveSteps(data).map((step) => {
    const values = interpolateMultipliers(data, parameters.epsilon, parameters.ratio, step);
    // The solver grid uses L = 1: lambda is invariant, while the original tau is tau_grid / L.
    if (values) values[0] /= parameters.L;
    return { step, gamma: step / (parameters.L * (1 + parameters.epsilon)), values };
  });
}

export function curvePath(points, component, geometry) {
  let connected = false;
  const path = [];
  const coordinate = (value) => String(Number(value.toPrecision(12)));
  for (const point of points) {
    if (point.values === null) {
      connected = false;
      continue;
    }
    path.push(`${connected ? "L" : "M"}${coordinate(geometry.x(point.gamma))},${coordinate(geometry.y(point.values[component]))}`);
    connected = true;
  }
  return path.join(" ");
}

function niceStep(roughStep) {
  const scale = 10 ** Math.floor(Math.log10(roughStep));
  return [1, 2, 2.5, 5, 10]
    .map((multiple) => multiple * scale)
    .reduce((best, candidate) => (Math.abs(candidate - roughStep) < Math.abs(best - roughStep) ? candidate : best));
}

function ticks(minimum, maximum, step) {
  const first = Math.ceil(minimum / step - 1e-10);
  const last = Math.floor(maximum / step + 1e-10);
  return Array.from({ length: last - first + 1 }, (_, index) => Number(((first + index) * step).toPrecision(12)));
}

export function plotGeometry(gammaMaximum, bounds, values) {
  finite(gammaMaximum, "horizontal plot domain");
  if (gammaMaximum <= 0) throw new Error("The horizontal plot domain must be positive");
  let minimum = 0;
  let maximum = 0;
  for (const value of values) {
    finite(value, "multiplier value");
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }
  const negativeTolerance = 1e-7 * Math.max(1, Math.abs(minimum), Math.abs(maximum));
  // Keep solver noise raw, while reserving room below zero so zero curves clear the clip and axis.
  const axisMinimum = minimum >= -negativeTolerance ? 0 : minimum;
  const span = maximum - axisMinimum || 1;
  const yStep = niceStep((span * 1.08) / 4);
  const yMinimum = Number((axisMinimum < 0 ? Math.floor((axisMinimum - 0.08 * span) / yStep) * yStep : -0.06 * span).toPrecision(12));
  const yMaximum = Number((Math.ceil((maximum + 0.08 * span) / yStep) * yStep).toPrecision(12));
  return {
    xTicks: ticks(0, gammaMaximum, niceStep(gammaMaximum / 5)),
    yTicks: ticks(axisMinimum < 0 ? yMinimum : 0, yMaximum, yStep),
    yMinimum,
    yMaximum,
    x: (gamma) => bounds.left + ((bounds.right - bounds.left) * gamma) / gammaMaximum,
    y: (value) => bounds.bottom - ((bounds.bottom - bounds.top) * (value - yMinimum)) / (yMaximum - yMinimum),
  };
}
