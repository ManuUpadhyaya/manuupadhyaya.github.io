export function placeBoundaryTick(label, svg, bounds, tickGroups) {
  const screen = svg.getBoundingClientRect();
  if (!screen.width || !screen.height) return;
  const viewport = svg.viewBox.baseVal;
  const scaleX = screen.width / viewport.width;
  const scaleY = screen.height / viewport.height;
  const size = label.getBoundingClientRect();
  const left = Math.max(0, Math.min(bounds.right * scaleX - size.width / 2, screen.width - size.width - 1));
  const top = bounds.bottom * scaleY + 8;
  label.style.left = `${left}px`;
  label.style.top = `${top}px`;
  label.parentElement.style.marginBottom = `${Math.max(0, top + size.height - screen.height) + 6}px`;

  // Read all tick boxes before hiding any, keeping the layout work to one pass.
  const boxes = tickGroups.map((group) => group.getBoundingClientRect());
  tickGroups.forEach((group, index) => {
    const box = boxes[index];
    const overlaps = box.right + 6 > screen.left + left && box.left - 6 < screen.left + left + size.width;
    group.style.display = overlaps ? "none" : "";
  });
}
