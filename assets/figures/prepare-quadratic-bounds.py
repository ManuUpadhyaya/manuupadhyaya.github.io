"""Add interaction hooks to dvisvgm output without changing the artwork."""

from pathlib import Path
import re
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
SVG = HERE.parent / "img/posts/quadratic-bounds.svg"
NS = "http://www.w3.org/2000/svg"
XLINK = "http://www.w3.org/1999/xlink"
ET.register_namespace("", NS)
ET.register_namespace("xlink", XLINK)
tree = ET.parse(SVG)
root = tree.getroot()
parents = {child: parent for parent in root.iter() for child in parent}
page = root.find(f".//{{{NS}}}g[@id='page1']")
assert page is not None, "Missing dvisvgm page"

bounds = [g.find(f"{{{NS}}}path") for g in page.iter(f"{{{NS}}}g") if g.get("stroke-width") == "0.8"]
assert len(bounds) == 2 and all(path is not None for path in bounds), "Expected two quadratic bounds"
for path, role in zip(bounds, ("lower", "upper")):
    path.set("data-qb", role)
plot = parents[parents[parents[bounds[0]]]]
plot.set("data-qb", "plot")

for glyph, role in (("g0-76", "upper-label"), ("g0-22", "lower-label")):
    use = next(node for node in page.iter(f"{{{NS}}}use") if node.get(f"{{{XLINK}}}href") == f"#{glyph}")
    group = parents[use]
    while not group.get("transform", "").startswith("translate("):
        group = parents[group]
    group.set("data-qb", role)

paths = list(page.iter(f"{{{NS}}}path"))
dot = next(path for path in paths if path.get("stroke") == "none" and "C" in path.get("d", ""))
dot.set("data-qb", "dot")
number = r"(-?\d+(?:\.\d+)?)"
point = re.findall(r"M" + number + r"\s+" + number, dot.get("d"))[-1]
horizontal = next(re.fullmatch(r"M" + number + r"\s+" + number + r"H" + number, path.get("d", "")) for path in paths if re.fullmatch(r"M" + number + r"\s+" + number + r"H" + number, path.get("d", "")))
vertical = next(re.fullmatch(r"M" + number + r"\s+" + number + r"V" + number, path.get("d", "")) for path in paths if re.fullmatch(r"M" + number + r"\s+" + number + r"V" + number, path.get("d", "")))
limits = re.search(r"xmin=([^,]+), xmax=([^,]+), ymin=([^,]+), ymax=([^,]+)", (HERE / "quadratic-bounds.tex").read_text())
xmin, xmax, ymin, ymax = map(float, limits.groups())
xorigin, yorigin = float(vertical.group(1)), float(horizontal.group(2))
metadata = {
    "x-origin": xorigin,
    "y-origin": yorigin,
    "x-scale": xorigin / -xmin,
    "y-scale": yorigin / -ymin,
    "point-x": float(point[0]),
    "point-y": float(point[1]),
    "x-min": xmin,
    "x-max": xmax,
    "y-min": ymin,
    "y-max": ymax,
}
for name, value in metadata.items():
    root.set(f"data-qb-{name}", str(value))
tree.write(SVG, encoding="utf-8", xml_declaration=True)
