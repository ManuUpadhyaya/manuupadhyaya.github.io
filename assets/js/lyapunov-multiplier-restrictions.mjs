import { curvePoints as rawCurvePoints, curveSteps } from "./lyapunov-multipliers-model.mjs";

const FAMILIES = ["base", "slow", "large"];
const SUPPORTS = { base: [32, 53, 35, 33], slow: [113], large: [23] };

function maskValue(mask) {
  if (!Number.isInteger(mask) || mask < 0 || mask > 127) throw new Error("Invalid multiplier zero selection");
  return mask;
}

export function validateRestrictionIndex(index, reference) {
  if (!index || index.version !== 1 || index.solver !== "MOSEK Fusion") throw new Error("Unsupported restricted multiplier data");
  for (const name of ["epsilon", "ratio", "step"]) {
    if (
      !Array.isArray(index.axes?.[name]) ||
      index.axes[name].length !== reference.axes[name].length ||
      index.axes[name].some((value, position) => value !== reference.axes[name][position])
    ) {
      throw new Error("Restricted multiplier axes differ from the original grid");
    }
  }
  if (!Array.isArray(index.order) || index.order.length !== 7 || index.order.some((value, position) => value !== reference.order[position]))
    throw new Error("Invalid restricted multiplier order");
  for (const family of FAMILIES)
    if (typeof index.families?.[family]?.file !== "string" || !index.families[family].file.endsWith(".json.gz"))
      throw new Error("Missing restricted multiplier family");
  return index;
}

export function validateFamilyDataset(data, index) {
  const size = index.axes.epsilon.length * index.axes.ratio.length * index.axes.step.length;
  if (
    !data ||
    data.version !== 1 ||
    !Array.isArray(data.values) ||
    data.values.length !== size * 7 ||
    !Array.isArray(data.status) ||
    data.status.length !== size ||
    !Array.isArray(data.support) ||
    data.support.length !== size
  )
    throw new Error("Incomplete restricted multiplier family");
  for (let point = 0; point < size; point += 1) {
    const status = data.status[point];
    const support = data.support[point];
    if (
      ![0, 1, 2].includes(status) ||
      !Number.isInteger(support) ||
      support < 0 ||
      support > 127 ||
      (status === 0 && support !== 0) ||
      (status === 1 && support === 0)
    )
      throw new Error("Invalid restricted multiplier status");
    for (let component = 0; component < 7; component += 1) {
      const value = data.values[point * 7 + component];
      if (status === 1 ? typeof value !== "number" || !Number.isFinite(value) || (!(support & (1 << component)) && value !== 0) : value !== null)
        throw new Error("Invalid restricted multiplier record");
    }
  }
  return data;
}

export function requiredFamilies(mask) {
  maskValue(mask);
  return FAMILIES.filter((family) => SUPPORTS[family].some((support) => !(support & mask)));
}

function baseSupport(epsilon, step) {
  if (step === 0) return 32;
  if ((epsilon === 1 && step <= 2) || (epsilon < 1 && step === 2)) return 33;
  return epsilon < 1 && step < 2 ? 53 : 35;
}

function applicableSupports(epsilon, ratio, step, tolerance) {
  if (step === 0) return [32];
  if (epsilon === 0) return [];
  const h = step / (1 + epsilon);
  const supports = [baseSupport(epsilon, step)];
  const slow = 3 - h * (2 + 2 * epsilon + 2 * ratio - 3 * epsilon * ratio) + h * h * ratio * (1 - epsilon) * (1 + epsilon - epsilon * ratio);
  if (epsilon < 1 && h <= 2 / (1 + epsilon + ratio * (1 - epsilon)) + tolerance && slow >= -tolerance) supports.push(113);
  const large = ratio * h * ((1 + epsilon) * h - epsilon) - 1;
  if (large >= -tolerance) supports.push(23);
  return supports;
}

export function classifyRestriction(mask, epsilon, ratio, step) {
  maskValue(mask);
  if (
    !Number.isFinite(epsilon) ||
    epsilon < 0 ||
    epsilon > 0.99 ||
    !Number.isFinite(ratio) ||
    ratio < 0.001 - 1e-12 ||
    ratio > 0.99 + 1e-12 ||
    !Number.isFinite(step) ||
    step < 0 ||
    step > 2
  )
    throw new Error("Parameter is outside the restricted multiplier domain");
  const boundedRatio = Math.max(0.001, Math.min(0.99, ratio));
  if (epsilon === 0 && step > 0) return 2;
  if (applicableSupports(epsilon, boundedRatio, step, 0).some((support) => !(support & mask))) return 1;
  if (applicableSupports(epsilon, boundedRatio, step, 1e-10).some((support) => !(support & mask))) return 2;
  return 0;
}

function bracket(axis, value) {
  if (!Number.isFinite(value) || value < axis[0] - 1e-12 || value > axis.at(-1) + 1e-12)
    throw new Error("Parameter is outside the restricted multiplier grid");
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

export function interpolateRestriction(index, tables, mask, epsilon, ratio, step) {
  maskValue(mask);
  if (epsilon === 0) return { values: null, status: 2 };
  const classification = classifyRestriction(mask, epsilon, ratio, step);
  if (classification === 0) return { values: null, status: 0 };
  const result = Array(7).fill(0);
  let missing = false;
  for (const [e, ew] of bracket(index.axes.epsilon, epsilon)) {
    for (const [r, rw] of bracket(index.axes.ratio, ratio)) {
      for (const [s, sw] of bracket(index.axes.step, step)) {
        const point = (e * index.axes.ratio.length + r) * index.axes.step.length + s;
        const family = FAMILIES.find((name) => tables[name]?.status[point] === 1 && !(tables[name].support[point] & mask));
        if (!family) {
          missing = true;
          continue;
        }
        for (let component = 0; component < 7; component += 1) result[component] += ew * rw * sw * tables[family].values[point * 7 + component];
      }
    }
  }
  return missing ? { values: null, status: 2 } : { values: result, status: 1 };
}

export function restrictionCurvePoints(raw, index, tables, mask, parameters) {
  if (mask === 0) return rawCurvePoints(raw, parameters);
  return curveSteps(index).map((step) => {
    const record = interpolateRestriction(index, tables, mask, parameters.epsilon, parameters.ratio, step);
    if (record.values) record.values[0] /= parameters.L;
    return { step, gamma: step / (parameters.L * (1 + parameters.epsilon)), ...record };
  });
}
