# Performance without visual changes

The user requests desktop and mobile Lighthouse scores as close to 100 as practical, especially performance, with absolutely no visual changes.

## Constraints

- Preserve all prose, mathematics, fonts, glyphs, layout, dimensions, spacing, colors, images, video frames and animations.
- Preserve navigation, mathematical accessibility, references, proof expansion, printing, browser search, figure controls and video behavior.
- Measure a fresh production build with the same CSS purge as deployment and production-like gzip delivery. Use Lighthouse 13.5.0 defaults for mobile and its desktop preset; keep settings identical before and after.
- Never improve scores by detecting the auditor, weakening throttling, hiding content, dropping accessibility or changing imagery.
- Retain compact benchmark results and delete temporary raw reports. The user subsequently authorized committing, pushing, and verifying the live deployment, including the already published article.

## Steps

- [x] Capture reference views on About, Publications, Software, Teaching, Blog, the mathematical article, and News, on both profiles.
- [x] Implement only changes supported by measured bottlenecks, with meaningful regression checks where behavior is involved.
- [x] Compare desktop/mobile screenshots and layout measurements against the reference, and check affected interactions.
- [x] Run desktop/mobile Lighthouse measurements, relevant tests, and the production build; record actual scores and remaining limits.

The initial CSS inlining attempt exposed a BOM decoding error and was disabled immediately. Corrected handling strips only the leading decoded BOM, as an external CSS decoder does. A dedicated regression covers this. The initial preliminary score comparison was discarded because its stylesheet purge began before the build completed. A fresh, fully built and once-purged reference was captured before re-enabling inlining.

Verified reference and corrected output: all 14 screenshot pairs are pixel-identical; all 268 sampled element rectangles and their typography, colors, spacing, and other recorded styles are identical. The checked article rectangles include every section heading, the footer, and the first 30 mathematical expressions. The local Compose preview was then restarted and checked again.

After removing the noncritical Roboto math-subset preload, all 268 rectangles and styles remain identical. Twelve screenshots are still exactly identical; two show differences confined to the existing photograph/video regions. The visible prose pixels outside these media regions remain unchanged; media source files and styles are unchanged.

Visible link distinction limits Accessibility on several pages; preserve that styling under the user's strict visual constraint. The independent semantic issues with equation-reference links and unnamed multiplier buttons are fixed. Node verification passes 206 tests with no skips; all 10 Ruby suites and the production build pass.

Final local production Lighthouse 13.5.0 scores, using the standard mobile simulation and desktop preset:

| Page                 | Desktop performance | Mobile performance | Accessibility | Best Practices | SEO |
| -------------------- | ------------------- | ------------------ | ------------- | -------------- | --- |
| About                | 100                 | 95                 | 96            | 100            | 100 |
| Publications         | 100                 | 97                 | 100           | 100            | 100 |
| Software             | 100                 | 100                | 100           | 100            | 100 |
| Teaching             | 100                 | 100                | 96            | 100            | 100 |
| Blog                 | 100                 | 99                 | 100           | 100            | 100 |
| Mathematical article | 100                 | 88                 | 97            | 100            | 100 |
| News                 | 100                 | 98                 | 96            | 100            | 100 |

Accessibility, Best Practices, and SEO scores match across profiles. The long mathematical article remains the largest mobile performance cost. Its complete equations, MathML, source annotations, proof content, search, and print behavior are preserved.
