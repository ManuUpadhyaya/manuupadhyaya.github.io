const LIMITS = Object.freeze({
  epsilon: [0, 0.99],
  ratio: [0.001, 0.99],
  L: [0.1, 10],
  step: [0, 2],
});
const METRICS = ["distance", "function"];
const functionCurves = new WeakMap();

function finite(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Invalid ${name}`);
  return value;
}

function clamp(value, [minimum, maximum]) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function validateDataset(data) {
  if (!data || data.version !== 1 || typeof data.solver !== "string" || !data.solver.trim()) {
    throw new Error("Unsupported contraction data");
  }
  let size = 1;
  for (const name of ["epsilon", "ratio", "step"]) {
    const axis = data.axes?.[name];
    const [minimum, maximum] = LIMITS[name];
    if (!Array.isArray(axis) || axis.length < 2 || axis.length > 1000) throw new Error(`Invalid ${name} axis`);
    for (let index = 0; index < axis.length; index += 1) {
      const value = finite(axis[index], `${name} axis`);
      if (value < minimum || value > maximum || (index > 0 && value <= axis[index - 1])) {
        throw new Error(`Invalid ${name} axis bounds`);
      }
    }
    if (axis[0] !== minimum || axis.at(-1) !== maximum) throw new Error(`Incomplete ${name} axis`);
    size *= axis.length;
  }
  if (size > 2_000_000) throw new Error("Contraction grid is too large");
  for (const name of METRICS) {
    const values = data.metrics?.[name];
    if (!Array.isArray(values) || values.length !== size) throw new Error(`Incomplete ${name} data`);
    for (const value of values) if (finite(value, `${name} data`) < 0) throw new Error(`Negative ${name} data`);
  }
  if (data.refinements !== undefined) {
    const refinements = data.refinements?.function;
    if (!Array.isArray(refinements) || refinements.length !== data.axes.epsilon.length * data.axes.ratio.length) {
      throw new Error("Incomplete function refinements");
    }
    for (const curve of refinements) {
      if (
        !Array.isArray(curve.step) ||
        curve.step.length < 1 ||
        curve.step.length > 1000 ||
        !Array.isArray(curve.rho) ||
        curve.rho.length !== curve.step.length
      ) {
        throw new Error("Invalid function refinement knots");
      }
      for (let index = 0; index < curve.step.length; index += 1) {
        const step = finite(curve.step[index], "refinement step");
        if (step < 0 || step > LIMITS.step[1] || (index > 0 && step <= curve.step[index - 1]) || finite(curve.rho[index], "refinement value") < 0) {
          throw new Error("Invalid function refinement bounds");
        }
      }
      if (finite(curve.minimumStep, "minimum step") < 0 || curve.minimumStep > LIMITS.step[1] || finite(curve.minimumRho, "minimum value") < 0) {
        throw new Error("Invalid function minimum");
      }
    }
  }
  return data;
}

function bracket(axis, value) {
  finite(value, "interpolation parameter");
  if (value < axis[0] - 1e-12 || value > axis.at(-1) + 1e-12) throw new Error("Parameter is outside the contraction grid");
  const bounded = clamp(value, [axis[0], axis.at(-1)]);
  let lower = 0;
  let upper = axis.length - 1;
  while (upper - lower > 1) {
    const middle = Math.floor((lower + upper) / 2);
    if (axis[middle] <= bounded) lower = middle;
    else upper = middle;
  }
  return [lower, upper, (bounded - axis[lower]) / (axis[upper] - axis[lower])];
}

function gridMetric(data, metric, epsilon, ratio, step) {
  const [e0, e1, ew] = bracket(data.axes.epsilon, epsilon);
  const [r0, r1, rw] = bracket(data.axes.ratio, ratio);
  const [s0, s1, sw] = bracket(data.axes.step, step);
  const values = data.metrics[metric];
  const at = (e, r, s) => values[(e * data.axes.ratio.length + r) * data.axes.step.length + s];
  const blend = (a, b, weight) => a + (b - a) * weight;
  const atStep = (s) => blend(blend(at(e0, r0, s), at(e1, r0, s), ew), blend(at(e0, r1, s), at(e1, r1, s), ew), rw);
  return blend(atStep(s0), atStep(s1), sw);
}

function refinedCurve(data, index) {
  if (!functionCurves.has(data)) functionCurves.set(data, new Map());
  const cache = functionCurves.get(data);
  if (cache.has(index)) return cache.get(index);
  const local = data.refinements.function[index];
  const nodes = new Map(data.axes.step.map((step, position) => [step, data.metrics.function[index * data.axes.step.length + position]]));
  local.step.forEach((step, position) => nodes.set(step, local.rho[position]));
  nodes.set(local.minimumStep, local.minimumRho);
  const steps = [...nodes.keys()].sort((a, b) => a - b);
  const curve = {
    step: steps,
    rho: steps.map((step) => nodes.get(step)),
    minimumStep: local.minimumStep,
  };
  cache.set(index, curve);
  return curve;
}

function alignedFunction(data, epsilon, ratio) {
  if (!data.refinements?.function) return null;
  const [e0, e1, ew] = bracket(data.axes.epsilon, epsilon);
  const [r0, r1, rw] = bracket(data.axes.ratio, ratio);
  const sources = [
    [e0, r0, (1 - ew) * (1 - rw)],
    [e0, r1, (1 - ew) * rw],
    [e1, r0, ew * (1 - rw)],
    [e1, r1, ew * rw],
  ]
    .filter(([, , weight]) => weight > 0)
    .map(([e, r, weight]) => ({
      ...refinedCurve(data, e * data.axes.ratio.length + r),
      weight,
    }));
  const maximum = data.axes.step.at(-1);
  const endpointMinimum = sources.some((source) => source.minimumStep === 0);
  if (endpointMinimum && ew > 0 && ew < 1) {
    const lower = alignedFunction(data, data.axes.epsilon[e0], ratio);
    const upper = alignedFunction(data, data.axes.epsilon[e1], ratio);
    // Blend epsilon faces at the actual step when a minimum reaches zero.
    // This joins the interior and endpoint profiles without moving either one.
    return {
      steps: [...lower.steps, ...upper.steps],
      value(step) {
        return (1 - ew) * lower.value(step) + ew * upper.value(step);
      },
    };
  }
  const minimum = clamp(
    sources.reduce((sum, source) => sum + source.weight * source.minimumStep, 0),
    [0, maximum]
  );
  // Interior minima share a crossing at the boundary t = 2.
  const anchor = !endpointMinimum && minimum < 2 && sources.every((source) => source.minimumStep < 2) ? 2 : maximum;
  // Map the two sides separately so neighboring minima meet at one corner.
  const mapStep = (step, fromMinimum, toMinimum) => {
    if (endpointMinimum) return step;
    if (step >= anchor && anchor < maximum) return step;
    if (step === fromMinimum) return toMinimum;
    return step < fromMinimum ? (step * toMinimum) / fromMinimum : toMinimum + ((step - fromMinimum) * (anchor - toMinimum)) / (anchor - fromMinimum);
  };
  return {
    steps: [minimum, ...sources.flatMap((source) => source.step.map((step) => clamp(mapStep(step, source.minimumStep, minimum), [0, maximum])))],
    value(step) {
      finite(step, "interpolation step");
      if (step < -1e-12 || step > maximum + 1e-12) throw new Error("Parameter is outside the contraction grid");
      return sources.reduce((sum, source) => {
        const mapped = mapStep(clamp(step, [0, maximum]), minimum, source.minimumStep);
        const [lower, upper, weight] = bracket(source.step, mapped);
        return sum + source.weight * (source.rho[lower] + weight * (source.rho[upper] - source.rho[lower]));
      }, 0);
    },
  };
}

function refinedDistance(data, epsilon, ratio) {
  const firstPositive = data.axes.epsilon[1];
  if (!data.refinements?.function || !(epsilon >= 0 && epsilon < firstPositive)) return null;
  const zeroFace = alignedFunction(data, 0, ratio);
  const weight = epsilon / firstPositive;
  // Refine the exact-gradient face continuously, without moving positive-error
  // source curves along the step-size axis.
  return {
    steps: zeroFace.steps,
    value(step) {
      const exact = zeroFace.value(step);
      return exact + weight * (gridMetric(data, "distance", firstPositive, ratio, step) - exact);
    },
  };
}

export function interpolateMetric(data, metric, epsilon, ratio, step) {
  if (!METRICS.includes(metric)) throw new Error("Unknown contraction metric");
  const profile = metric === "function" ? alignedFunction(data, epsilon, ratio) : refinedDistance(data, epsilon, ratio);
  return profile ? profile.value(step) : gridMetric(data, metric, epsilon, ratio, step);
}

function parameterState(epsilon, L, mu) {
  const scale = L * (1 + epsilon);
  return {
    epsilon,
    L,
    mu,
    ratio: mu / L,
    gammaMax: 2 / scale,
    stableGamma: 2 / scale,
  };
}

function hundredths(value) {
  return Math.round(value * 100 + 1e-9);
}

export function createParameters({ epsilon = 0.5, L = 3, mu = 1 } = {}) {
  const epsilonUnits = clamp(hundredths(finite(epsilon, "epsilon")), [0, 99]);
  const LUnits = clamp(hundredths(finite(L, "L")), [10, 1000]);
  const muUnits = clamp(hundredths(finite(mu, "mu")), [1, Math.floor((99 * LUnits) / 100)]);
  return parameterState(epsilonUnits / 100, LUnits / 100, muUnits / 100);
}

export function updateParameters(parameters, name, value) {
  finite(value, name);
  const { epsilon, L, mu } = parameters;
  const units = hundredths(value);
  if (name === "mu") return parameterState(epsilon, L, clamp(units, [1, Math.floor((99 * hundredths(L)) / 100)]) / 100);
  if (name === "L") return parameterState(epsilon, clamp(units, [Math.max(10, Math.ceil((100 * hundredths(mu)) / 99)), 1000]) / 100, mu);
  if (name === "epsilon") return parameterState(clamp(units, [0, 99]) / 100, L, mu);
  throw new Error("Unknown contraction parameter");
}

export function parameterBounds({ L, mu }) {
  return {
    L: {
      minimum: Math.max(10, Math.ceil((100 * hundredths(mu)) / 99)) / 100,
      maximum: 10,
    },
    mu: {
      minimum: 0.01,
      maximum: Math.floor((99 * hundredths(L)) / 100) / 100,
    },
  };
}

export function controlTrack(name) {
  if (name !== "L" && name !== "mu") throw new Error("Unknown curvature control");
  return { minimum: 0, maximum: 10, step: 0.01 };
}

function niceStep(roughStep, roundUp = false) {
  const scale = 10 ** Math.floor(Math.log10(roughStep));
  const candidates = [1, 2, 2.5, 5, 10].map((multiple) => multiple * scale);
  return roundUp
    ? candidates.find((candidate) => candidate >= roughStep - 1e-12)
    : candidates.reduce((best, candidate) => (Math.abs(candidate - roughStep) < Math.abs(best - roughStep) ? candidate : best));
}

export function plotGeometry(gammaMaximum, bounds, minimumValue = 0, reservedTop = null) {
  finite(gammaMaximum, "horizontal plot domain");
  if (gammaMaximum <= 0) throw new Error("The horizontal plot domain must be positive");
  const step = niceStep(gammaMaximum / 5);
  const xTicks = Array.from({ length: Math.ceil(gammaMaximum / step) + 1 }, (_, index) => Number((step * index).toPrecision(12))).filter(
    (value) => value <= gammaMaximum
  );
  let yMaximum = 1.1;
  const minimum = clamp(finite(minimumValue, "curve minimum"), [0, yMaximum]);
  const breathingRoom = Math.max(0.025, Math.min(0.05, (yMaximum - minimum) * 0.08));
  const lower = Math.max(0, Math.min(minimum - breathingRoom, yMaximum - 0.15));
  let yStep = niceStep((yMaximum - lower) / 6, true);
  const lowerRounding = Math.min(0.1, yStep);
  const yMinimum = Number((Math.floor((lower + 1e-12) / lowerRounding) * lowerRounding).toPrecision(12));
  if (reservedTop) {
    const fraction = finite(reservedTop.fraction, "legend height fraction");
    if (fraction < 0 || fraction >= 1) throw new Error("The legend must leave room for the plot");
    const requiredMaximum = yMinimum + (finite(reservedTop.maximum, "local curve maximum") - yMinimum) / (1 - fraction);
    if (requiredMaximum > yMaximum) {
      yStep = niceStep((requiredMaximum - yMinimum) / 6, true);
      yMaximum = Number((Math.ceil((requiredMaximum - 1e-12) / yStep) * yStep).toPrecision(12));
    }
  }
  const firstTick = Math.ceil((yMinimum - 1e-12) / yStep) * yStep;
  const yTicks = Array.from({ length: Math.ceil((yMaximum - firstTick) / yStep) + 1 }, (_, index) =>
    Number((firstTick + yStep * index).toPrecision(12))
  ).filter((value) => value <= yMaximum);
  return {
    xTicks,
    yTicks,
    yMinimum,
    yMaximum,
    x: (gamma) => bounds.left + ((bounds.right - bounds.left) * gamma) / gammaMaximum,
    y: (rho) => bounds.bottom - ((bounds.bottom - bounds.top) * (rho - yMinimum)) / (yMaximum - yMinimum),
  };
}

export function curveMaximumInRange(points, lower, upper) {
  let maximum = -Infinity;
  for (let index = 1; index < points.length; index += 1) {
    const before = points[index - 1];
    const after = points[index];
    const left = Math.max(lower, before.gamma);
    const right = Math.min(upper, after.gamma);
    if (left > right) continue;
    if (after.gamma === before.gamma) {
      for (const metric of ["distance", "function", "closedForm"]) maximum = Math.max(maximum, before[metric], after[metric]);
      continue;
    }
    for (const gamma of [left, right]) {
      const weight = (gamma - before.gamma) / (after.gamma - before.gamma);
      for (const metric of ["distance", "function", "closedForm"]) {
        maximum = Math.max(maximum, before[metric] + weight * (after[metric] - before[metric]));
      }
    }
  }
  return finite(maximum, "curve maximum within the legend span");
}

function segmentIntersectsBox(a, b, box) {
  let start = 0,
    end = 1;
  for (const [axis, extent] of [
    ["x", "width"],
    ["y", "height"],
  ]) {
    const delta = b[axis] - a[axis];
    if (delta === 0) {
      if (a[axis] < box[axis] || a[axis] > box[axis] + box[extent]) return false;
    } else {
      const first = (box[axis] - a[axis]) / delta;
      const second = (box[axis] + box[extent] - a[axis]) / delta;
      start = Math.max(start, Math.min(first, second));
      end = Math.min(end, Math.max(first, second));
      if (start > end) return false;
    }
  }
  return true;
}

export function chooseLabelPosition(curves, candidates, size, occupied = []) {
  const segmentCount = curves.reduce((sum, curve) => sum + Math.max(0, curve.length - 1), 0);
  let best = candidates[0],
    bestScore = Infinity;
  for (const candidate of candidates) {
    const box = {
      x: candidate.x - 6,
      y: candidate.y - 6,
      width: size.width + 12,
      height: size.height + 12,
    };
    let score = occupied.some(
      (other) => box.x <= other.x + other.width && box.x + box.width >= other.x && box.y <= other.y + other.height && box.y + box.height >= other.y
    )
      ? segmentCount + 1
      : 0;
    for (const curve of curves) {
      for (let index = 1; index < curve.length; index += 1) if (segmentIntersectsBox(curve[index - 1], curve[index], box)) score += 1;
    }
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
    if (score === 0) break;
  }
  return best;
}

export function closedFormFunction(parameters, gamma) {
  finite(gamma, "step size");
  if (gamma < 0) throw new Error("The step size must be nonnegative");
  const { epsilon, L, mu } = parameters;
  return Math.max((1 - gamma * mu * (1 - epsilon)) ** 2, (1 - gamma * L * (1 - epsilon)) ** 2, (1 - gamma * L * (1 + epsilon)) ** 2);
}

export function curvePoints(data, parameters) {
  const profile = alignedFunction(data, parameters.epsilon, parameters.ratio);
  const distanceProfile = refinedDistance(data, parameters.epsilon, parameters.ratio);
  const scale = parameters.L * (1 + parameters.epsilon);
  const branchSwitch = (2 * scale) / (scale + parameters.mu * (1 - parameters.epsilon));
  // Boundary knots support interpolation; displayed samples stay in 0 < t < 2.
  const steps = [
    ...new Set([
      ...data.axes.step,
      ...Array.from({ length: 121 }, (_, index) => (2 * index) / 120),
      1e-6,
      2 - 1e-6,
      branchSwitch,
      ...(profile?.steps ?? []),
      ...(distanceProfile?.steps ?? []),
    ]),
  ]
    .filter((step) => step > 0 && step < 2)
    .sort((a, b) => a - b);
  return steps.map((step) => {
    const functionValue = profile ? profile.value(step) : gridMetric(data, "function", parameters.epsilon, parameters.ratio, step);
    return {
      step,
      gamma: step / scale,
      distance: distanceProfile ? distanceProfile.value(step) : gridMetric(data, "distance", parameters.epsilon, parameters.ratio, step),
      function: functionValue,
      closedForm: closedFormFunction(parameters, step / scale),
    };
  });
}
