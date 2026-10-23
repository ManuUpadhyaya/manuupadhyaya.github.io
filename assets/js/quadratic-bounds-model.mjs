export const PARAMETERS = Object.freeze({
  mu: 0.2,
  L: 1.8,
  initialAnchor: 0.5,
  domainMin: -2.2,
  domainMax: 2.4,
});

const shift = 0.15;
const frequency = 2.5;
const offsetSlope = Math.tanh(frequency * shift);

function logCosh(x) {
  const magnitude = Math.abs(x);
  return magnitude + Math.log1p(Math.exp(-2 * magnitude)) - Math.LN2;
}

const offsetValue = logCosh(frequency * shift);

export function value(x) {
  return 0.1 * x * x + 0.256 * (logCosh(frequency * (x - shift)) - offsetValue) + 0.64 * x * offsetSlope;
}

export function gradient(x) {
  return 0.2 * x + 0.64 * (Math.tanh(frequency * (x - shift)) + offsetSlope);
}

export function curvature(x) {
  const tangent = Math.tanh(frequency * (x - shift));
  return 0.2 + 1.6 * (1 - tangent * tangent);
}

export function coefficients(anchor, c) {
  const slope = gradient(anchor);
  return { linear: slope - c * anchor, constant: value(anchor) - slope * anchor + 0.5 * c * anchor * anchor };
}

export function bound(x, anchor, c) {
  const delta = x - anchor;
  return value(anchor) + gradient(anchor) * delta + 0.5 * c * delta * delta;
}

export function clampAnchor(x) {
  return Math.max(PARAMETERS.domainMin, Math.min(PARAMETERS.domainMax, x));
}

export function labelPosition(anchor, c, preferredX, maxY) {
  const { linear, constant } = coefficients(anchor, c);
  const vertex = -linear / c;
  const minimum = constant - (linear * linear) / (2 * c);
  const radius = Math.sqrt(Math.max(0, (2 * (maxY - minimum)) / c));
  const left = Math.max(PARAMETERS.domainMin, vertex - radius);
  const right = Math.min(PARAMETERS.domainMax, vertex + radius);
  const x = Math.max(left, Math.min(right, preferredX));
  return { x, y: bound(x, anchor, c) };
}
