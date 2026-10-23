import { closedFormFunction } from "./lyapunov-contraction-model.mjs";
import { curveSteps } from "./lyapunov-multipliers-model.mjs";

export function formulaCurvePoints(data, parameters) {
  const { epsilon, L, mu } = parameters;
  if (epsilon === 0) return [];
  const scale = L * (1 + epsilon);
  const crossover = (2 * scale) / (scale + mu * (1 - epsilon));
  const steps = [...new Set([...curveSteps(data), ...Array.from({ length: 121 }, (_, index) => (2 * index) / 120), crossover])]
    .filter((step) => step > 0 && step < 2)
    .sort((a, b) => a - b);
  return steps.map((step) => {
    const gamma = step / scale;
    const root = Math.sqrt(closedFormFunction(parameters, gamma));
    return { step, gamma, values: [(gamma * root) / (2 * epsilon), 0, root * (1 - root), 0, 1 - root, root, 0] };
  });
}
