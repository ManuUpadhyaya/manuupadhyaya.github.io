import { readFileSync } from "node:fs";
import { create } from "fontkit";
import wawoff2 from "wawoff2";

const fontDirectory = new URL("../assets/fonts/roboto-v51/", import.meta.url);
const declarations = readFileSync(new URL("../_includes/roboto-local-fonts.liquid", import.meta.url), "utf8");
const variations = new Map();

function unicodeRange(range) {
  const [start, end] = range.trim().replace(/^U\+/i, "").split("-");
  return [parseInt(start.replaceAll("?", "0"), 16), parseInt((end || start).replaceAll("?", "F"), 16)];
}

// Reuse the site's actual ranges and declaration order, including overlaps.
// The same variable files are declared for every supported CSS font weight.
const faces = [...declarations.matchAll(/@font-face\s*\{([\s\S]*?)^\s*\}/gm)]
  .filter(([, body]) => /font-weight:\s*400\s*;/.test(body))
  .map(([, body]) => {
    const filename = body.match(/roboto-v51\/([^'"\s]+\.woff2)/)?.[1];
    const ranges = body
      .match(/unicode-range:\s*([^;]+);/)?.[1]
      .split(",")
      .map(unicodeRange);
    if (!filename || !ranges) throw new Error("Cannot read the site's Roboto font declarations");
    return { filename, ranges };
  })
  .reverse();

if (!faces.length) throw new Error("No local Roboto font declarations found");

// Fontkit 2.0.4's variation parser expects sfnt data. Decode the site's WOFF2
// bytes once, without writing or substituting any font files.
const fontFiles = new Map();
for (const filename of new Set(faces.map(({ filename }) => filename))) {
  const bytes = readFileSync(new URL(filename, fontDirectory));
  // The decoder returns a view into reusable WASM memory. Copy each result
  // before decoding the next subset.
  fontFiles.set(filename, create(Buffer.from(await wawoff2.decompress(bytes))));
}

function fontForFace(face, weight) {
  const key = `${face.filename}:${weight}`;
  if (!variations.has(key)) {
    const font = fontFiles.get(face.filename);
    variations.set(key, font.getVariation({ wght: weight }));
  }
  return variations.get(key);
}

function normalizedWeight(weight) {
  if (weight === "normal") return 400;
  if (weight === "bold") return 700;
  const number = Number(weight);
  if (!Number.isFinite(number) || number < 100 || number > 900) throw new Error(`Unsupported Roboto font weight: ${weight}`);
  return number;
}

function faceForCodePoint(codePoint, weight) {
  const face = faces.find(({ ranges }) => ranges.some(([start, end]) => codePoint >= start && codePoint <= end));
  if (!face || !fontForFace(face, weight).hasGlyphForCodePoint(codePoint)) {
    throw new Error(`Local Roboto has no glyph for U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`);
  }
  return face;
}

/** Return an inherited prose run's shaped advance width in em units. */
export function measureRobotoText(text, { weight = 400, style = "normal", letterSpacing = -0.004 } = {}) {
  if (typeof text !== "string") throw new TypeError("Roboto text must be a string");
  if (!Number.isFinite(letterSpacing)) throw new TypeError("Roboto letter spacing must be a number in em units");
  if (!["normal", "italic", "oblique"].includes(style)) throw new Error(`Unsupported Roboto font style: ${style}`);
  weight = normalizedWeight(weight);
  if (!text) return 0;

  // The site supplies upright Roboto only. Browsers synthesize italic/oblique
  // with a shear, which changes ink bounds while preserving advance widths.
  let width = 0;
  let run = "";
  let current = null;
  const flush = () => {
    if (!run) return;
    const font = fontForFace(current, weight);
    // CSS tracking disables optional ligatures; keep kerning and required ones.
    const features = letterSpacing === 0 ? undefined : { liga: false, clig: false };
    const shaped = font.layout(run, features);
    width += shaped.positions.reduce((advance, position) => advance + position.xAdvance, 0) / font.unitsPerEm;
  };
  for (const character of text) {
    const face = faceForCodePoint(character.codePointAt(0), weight);
    if (face !== current) {
      flush();
      run = "";
      current = face;
    }
    run += character;
  }
  flush();
  return width + [...text].length * letterSpacing;
}

/** Return the x-height used by MathJax's surrounding-font metric probe. */
export function robotoXHeight(weight = 400) {
  weight = normalizedWeight(weight);
  const font = fontForFace(faceForCodePoint(0x78, weight), weight);
  return font.xHeight / font.unitsPerEm;
}
