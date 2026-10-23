const ORDER = Object.freeze(["tau", "k,star", "star,k", "k+1,star", "star,k+1", "k,k+1", "k+1,k"]);

export function validateFixedDataset(data, reference) {
  if (
    !data ||
    data.version !== 1 ||
    data.solver !== "MOSEK Fusion" ||
    data.zeroMask !== 74 ||
    data.formula !== "function-gap-v1" ||
    (data.fixedMask !== undefined && data.fixedMask !== 53)
  )
    throw new Error("Unsupported fixed-expression checks");
  if (
    !Array.isArray(data.order) ||
    data.order.length !== ORDER.length ||
    data.order.some((name, index) => name !== ORDER[index] || name !== reference.order?.[index])
  )
    throw new Error("Invalid fixed-expression multiplier order");
  let size = 1;
  for (const name of ["epsilon", "ratio", "step"]) {
    const axis = data.axes?.[name];
    const expected = reference.axes?.[name];
    if (!Array.isArray(axis) || !Array.isArray(expected) || axis.length !== expected.length || axis.some((value, index) => value !== expected[index]))
      throw new Error("Fixed-expression axes differ from the solver grid");
    size *= axis.length;
  }
  if (!Array.isArray(data.status) || data.status.length !== size) throw new Error("Incomplete fixed-expression checks");
  const faceSize = data.axes.ratio.length * data.axes.step.length;
  for (let point = 0; point < size; point += 1) {
    const status = data.status[point];
    if (![0, 1, 2].includes(status) || (data.axes.epsilon[Math.floor(point / faceSize)] === 0 && status !== 2)) {
      throw new Error("Invalid fixed-expression check status");
    }
  }
  return data;
}

function contributingIndices(axis, value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < axis[0] - 1e-12 || value > axis.at(-1) + 1e-12) {
    throw new Error("Parameter is outside the fixed-expression grid");
  }
  let lower = 0;
  let upper = axis.length - 1;
  while (upper - lower > 1) {
    const middle = Math.floor((lower + upper) / 2);
    if (axis[middle] <= value) lower = middle;
    else upper = middle;
  }
  if (Math.abs(value - axis[lower]) <= 1e-12) return [lower];
  if (Math.abs(value - axis[upper]) <= 1e-12) return [upper];
  return [lower, upper];
}

// This aggregates categorical checks at sampled problems, not a new SDP solve
// or a certificate of feasibility at parameters between the shared grid faces.
export function checkFixedExpressionGrid(data, parameters) {
  const result = { status: 2, checked: 0, feasible: 0, infeasible: 0, unavailable: 0, exactParameters: false };
  const epsilons = contributingIndices(data.axes.epsilon, parameters.epsilon);
  if (parameters.epsilon === 0) return result;
  const ratios = contributingIndices(data.axes.ratio, parameters.ratio);
  result.exactParameters = epsilons.length === 1 && ratios.length === 1;
  for (const epsilon of epsilons) {
    for (const ratio of ratios) {
      for (let step = 0; step < data.axes.step.length; step += 1) {
        const point = (epsilon * data.axes.ratio.length + ratio) * data.axes.step.length + step;
        result.checked += 1;
        if (data.status[point] === 1) result.feasible += 1;
        else if (data.status[point] === 0) result.infeasible += 1;
        else result.unavailable += 1;
      }
    }
  }
  if (result.feasible === result.checked) result.status = 1;
  else if (result.infeasible === result.checked) result.status = 0;
  return result;
}
