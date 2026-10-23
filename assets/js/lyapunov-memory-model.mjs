export const METHODS = Object.freeze([
  { key: "gradient", label: "Gradient method" },
  { key: "heavy_ball", label: "Heavy-ball method" },
  { key: "nesterov", label: "Nesterov's method" },
  { key: "triple_momentum", label: "Triple momentum method" },
]);

export const METRICS = Object.freeze([{ key: "distance", label: "Squared distance of x to the solution" }]);

export const MODES = Object.freeze(["free", "positive"]);

function sameKeys(values, expected) {
  return (
    Array.isArray(values) &&
    values.length === expected.length &&
    new Set(values).size === expected.length &&
    expected.every((key) => values.includes(key))
  );
}

export function validateDataset(data) {
  if (!data || data.version !== 1 || typeof data.solver !== "string" || !data.solver.trim()) throw new Error("Unsupported Lyapunov search data");
  if (
    !sameKeys(data.modes, MODES) ||
    !sameKeys(
      data.methods,
      METHODS.map(({ key }) => key)
    )
  )
    throw new Error("Invalid Lyapunov search modes or methods");
  const ratio = data.axes?.ratio;
  if (!Array.isArray(ratio) || ratio.length < 2 || ratio.length > 10000) throw new Error("Invalid curvature-ratio axis");
  ratio.forEach((value, index) => {
    if (!Number.isFinite(value) || value <= 0 || value >= 1 || (index > 0 && value <= ratio[index - 1]))
      throw new Error("Invalid curvature-ratio samples");
  });
  for (const { key: metric } of METRICS) {
    for (const mode of MODES) {
      for (const { key: method } of METHODS) {
        const values = data.metrics?.[metric]?.[mode]?.[method];
        if (!Array.isArray(values) || values.length !== ratio.length) throw new Error(`Incomplete ${metric}/${mode}/${method} data`);
        for (const value of values) {
          if (value !== null && (!Number.isFinite(value) || value < 0 || value >= 1)) throw new Error(`Invalid ${metric}/${mode}/${method} factor`);
        }
      }
    }
  }
  if (!data.metadata || typeof data.metadata !== "object" || Array.isArray(data.metadata)) throw new Error("Invalid Lyapunov search metadata");
  return data;
}

export function methodCurves(data) {
  return METHODS.map(({ key: method }) => ({
    method,
    curves: MODES.map((mode) => {
      const values = data.metrics.distance[mode][method];
      const segments = [];
      let current = null;
      let missing = 0;
      values.forEach((rho, index) => {
        if (rho === null) {
          current = null;
          missing += 1;
        } else {
          if (!current) {
            current = [];
            segments.push(current);
          }
          current.push({ ratio: data.axes.ratio[index], rho });
        }
      });
      return { mode, segments, missing };
    }),
  }));
}

export function curvePath(segments, x, y) {
  return segments
    .flatMap((segment) => segment.map((point, index) => `${index === 0 ? "M" : "L"}${x(point.ratio).toFixed(2)},${y(point.rho).toFixed(2)}`))
    .join(" ");
}

export function plotGeometry({ left, right, top, bottom }) {
  const xCondition = (condition) => left + (Math.log10(condition) / 3) * (right - left);
  return {
    x: (ratio) => xCondition(1 / ratio),
    xCondition,
    y: (rho) => bottom - rho * (bottom - top),
    xTicks: [1, 10, 100, 1000],
    yTicks: [0, 0.2, 0.4, 0.6, 0.8, 1],
  };
}
