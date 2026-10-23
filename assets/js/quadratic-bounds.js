import { PARAMETERS, value, coefficients, clampAnchor, labelPosition } from "./quadratic-bounds-model.mjs";

const SVG_NS = "http://www.w3.org/2000/svg";
let figureIndex = 0;

function svgNode(name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, attribute] of Object.entries(attributes)) node.setAttribute(key, attribute);
  return node;
}

function namespaceIds(svg, prefix) {
  const ids = new Map();
  for (const node of svg.querySelectorAll("[id]")) {
    const old = node.id;
    node.id = `${prefix}-${old}`;
    ids.set(old, node.id);
  }
  for (const node of svg.querySelectorAll("*")) {
    for (const attribute of [...node.attributes]) {
      let text = attribute.value;
      if (text.startsWith("#") && ids.has(text.slice(1))) text = `#${ids.get(text.slice(1))}`;
      text = text.replace(/url\(#([^)]*)\)/g, (match, id) => (ids.has(id) ? `url(#${ids.get(id)})` : match));
      if (text !== attribute.value) node.setAttributeNS(attribute.namespaceURI, attribute.name, text);
    }
  }
}

async function enhanceFigure(container) {
  const image = container.querySelector("img");
  if (!image || container.dataset.qbReady) return;
  const response = await fetch(image.getAttribute("src"));
  if (!response.ok) throw new Error(`Figure request failed (${response.status})`);
  const parsed = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
  if (parsed.querySelector("parsererror")) throw new Error("Invalid figure SVG");
  const svg = document.importNode(parsed.documentElement, true);
  const plot = svg.querySelector('[data-qb="plot"]');
  const dot = svg.querySelector('[data-qb="dot"]');
  if (!plot || !dot) throw new Error("Missing quadratic figure hooks");

  const prefix = `quadratic-bounds-${++figureIndex}`;
  namespaceIds(svg, prefix);
  svg.setAttribute("class", `${image.className} quadratic-bounds-interactive`);
  svg.setAttribute("width", image.getAttribute("width") || "520");
  svg.removeAttribute("height");
  svg.setAttribute("role", "group");
  svg.setAttribute("aria-label", "A function and its tangent quadratic bounds");
  svg.style.height = "auto";

  const data = (key) => Number(svg.getAttribute(`data-qb-${key}`));
  const xOrigin = data("x-origin"),
    yOrigin = data("y-origin");
  const xScale = data("x-scale"),
    yScale = data("y-scale");
  const pointX = data("point-x"),
    pointY = data("point-y");
  const initial = PARAMETERS.initialAnchor;
  const clipId = `${prefix}-clip`;
  const clip = svgNode("clipPath", { id: clipId, clipPathUnits: "userSpaceOnUse" });
  clip.append(
    svgNode("rect", {
      x: xOrigin + xScale * data("x-min"),
      y: yOrigin + yScale * data("y-min"),
      width: xScale * (data("x-max") - data("x-min")),
      height: yScale * (data("y-max") - data("y-min")),
    })
  );
  svg.querySelector("defs").append(clip);

  const curves = [
    ["lower", PARAMETERS.mu, -1.5, 0.2],
    ["upper", PARAMETERS.L, -1.8, 4.25],
  ].map(([role, c, preferred, maxY]) => {
    const path = svg.querySelector(`[data-qb="${role}"]`);
    const label = svg.querySelector(`[data-qb="${role}-label"]`);
    const translate = label.getAttribute("transform").match(/translate\(([-\d.]+)[ ,]+([-\d.]+)\)/);
    path.parentElement.setAttribute("clip-path", `url(#${clipId})`);
    return {
      path,
      label,
      c,
      preferred,
      maxY,
      labelX: Number(translate[1]),
      labelY: Number(translate[2]),
      baseline: coefficients(initial, c),
      initialLabelY: labelPosition(initial, c, preferred, maxY).y,
    };
  });

  const control = svgNode("g", {
    class: "quadratic-bounds-control",
    tabindex: "0",
    role: "slider",
    "aria-label": "Move x along the function",
    "aria-orientation": "horizontal",
    "aria-valuemin": PARAMETERS.domainMin,
    "aria-valuemax": PARAMETERS.domainMax,
    "aria-valuenow": initial,
    "aria-valuetext": `x = ${initial}`,
  });
  const title = svgNode("title");
  title.textContent = "Drag horizontally to move x";
  const halo = svgNode("circle", {
    class: "quadratic-bounds-halo",
    cx: pointX,
    cy: pointY,
    fill: "none",
    stroke: "#888",
    "pointer-events": "none",
    "aria-hidden": "true",
  });
  const hit = svgNode("circle", {
    class: "quadratic-bounds-hit",
    cx: pointX,
    cy: pointY,
    fill: "transparent",
    stroke: "none",
    "pointer-events": "all",
    "aria-hidden": "true",
  });
  control.append(title, halo, hit);
  plot.append(control);

  let anchor = initial,
    pointer = null,
    horizontalOffset = 0,
    pending = null,
    frame = 0,
    moved = false;

  function scaleControl() {
    const screen = plot.getScreenCTM();
    const viewport = plot.getCTM();
    if (!screen || !viewport) return;
    const screenScale = Math.hypot(screen.a, screen.b);
    const viewportScale = Math.hypot(viewport.a, viewport.b);
    const coarse = matchMedia("(any-pointer: coarse)").matches;
    hit.setAttribute("r", (coarse ? 22 : 12) / screenScale);
    halo.setAttribute("r", 9 / screenScale);
    halo.setAttribute("stroke-width", 1 / screenScale);
    if (moved) for (const curve of curves) curve.path.setAttribute("stroke-width", 0.8 * viewportScale);
  }

  function render(next) {
    const clamped = clampAnchor(next);
    if (clamped === anchor) return;
    anchor = clamped;
    moved = true;
    // Only each quadratic's linear and constant terms change. A shear maps
    // its original path exactly, without rebuilding hundreds of samples.
    const viewport = plot.getCTM();
    const stroke = 0.8 * Math.hypot(viewport.a, viewport.b);
    for (const curve of curves) {
      const current = coefficients(anchor, curve.c);
      const shear = (yScale / xScale) * (current.linear - curve.baseline.linear);
      const offset = yScale * (current.constant - curve.baseline.constant) - shear * xOrigin;
      curve.path.setAttribute("transform", `matrix(1 ${shear} 0 1 0 ${offset})`);
      curve.path.setAttribute("vector-effect", "non-scaling-stroke");
      curve.path.setAttribute("stroke-width", stroke);
      const position = labelPosition(anchor, curve.c, curve.preferred, curve.maxY);
      curve.label.setAttribute(
        "transform",
        `translate(${curve.labelX + xScale * (position.x - curve.preferred)} ${curve.labelY + yScale * (position.y - curve.initialLabelY)})`
      );
    }
    const dx = xScale * (anchor - initial),
      dy = yScale * (value(anchor) - value(initial));
    dot.setAttribute("transform", `translate(${dx} ${dy})`);
    control.setAttribute("transform", `translate(${dx} ${dy})`);
    control.setAttribute("aria-valuenow", anchor.toFixed(3));
    control.setAttribute("aria-valuetext", `x = ${anchor.toFixed(2)}`);
  }

  function pointerX(event) {
    const matrix = plot.getScreenCTM();
    if (!matrix) return anchor;
    const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return (local.x - xOrigin) / xScale;
  }

  function flush() {
    frame = 0;
    if (pending === null) return;
    const next = pending;
    pending = null;
    render(next);
  }

  function queue(next) {
    pending = next;
    if (!frame) frame = requestAnimationFrame(flush);
  }

  control.addEventListener("pointerdown", (event) => {
    if (pointer !== null || !event.isPrimary || event.button !== 0) return;
    horizontalOffset = pointerX(event) - anchor;
    pointer = event.pointerId;
    control.classList.add("is-dragging");
    control.setPointerCapture(pointer);
    control.focus({ preventScroll: true });
    event.preventDefault();
  });
  control.addEventListener("pointermove", (event) => {
    if (event.pointerId === pointer) queue(pointerX(event) - horizontalOffset);
  });
  function finish(event) {
    if (event.pointerId !== pointer) return;
    if (event.type === "pointerup") pending = pointerX(event) - horizontalOffset;
    if (frame) cancelAnimationFrame(frame);
    flush();
    const previous = pointer;
    pointer = null;
    control.classList.remove("is-dragging");
    if (control.hasPointerCapture(previous)) control.releasePointerCapture(previous);
  }
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) control.addEventListener(type, finish);
  control.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? 0.25 : 0.05;
    const base = pending ?? anchor;
    const next = {
      ArrowLeft: base - step,
      ArrowDown: base - step,
      ArrowRight: base + step,
      ArrowUp: base + step,
      Home: PARAMETERS.domainMin,
      End: PARAMETERS.domainMax,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    queue(next);
  });

  image.closest("picture").replaceWith(svg);
  container.dataset.qbReady = "true";
  scaleControl();
  new ResizeObserver(scaleControl).observe(svg);
}

const observer =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            observer.unobserve(entry.target);
            enhanceFigure(entry.target).catch((error) => console.warn("Interactive figure unavailable:", error));
          }
        },
        { rootMargin: "400px" }
      )
    : null;
for (const container of document.querySelectorAll("[data-quadratic-bounds]")) {
  if (observer) observer.observe(container);
  else enhanceFigure(container).catch((error) => console.warn("Interactive figure unavailable:", error));
}
