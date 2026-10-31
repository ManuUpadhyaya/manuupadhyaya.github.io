# Build-time mathematics implementation plan

User-approved design: deliver existing MathJax mathematics already typeset in the initial HTML, rather than exposing TeX while the browser renders it.

## Constraints

- Preserve prose, TeX, New Computer Modern 4.1.3, Roboto metrics, 0.92 math scale, equation numbers and forward references.
- Keep responsive formula copies, closed proofs, figures, controls, links, and shared layout functional.
- Keep the current checkout because Docker Compose watches it; no commit, publication, or unrelated redesign is requested.
- Emit accessible MathML with the static CHTML. Static reading does not require browser MathJax; its custom explorer/menu is not hydrated.
- Fail the build on rendering errors rather than silently publishing raw TeX. Cache complete per-page results to keep watch builds fast.

## Tasks

- [x] Add a persistent JSON-line Node renderer using pinned MathJax, the shared configuration, and real local Roboto metrics. Verify AMS references, hidden copies, inherited text, accessibility and failure recovery.
- [x] Add a Jekyll post-render integration with one replaceable cache entry per page, independent generated CSS and local font assets. Test cached rebuilds, base URLs, error reporting and asset restoration.
- [x] Suppress browser typesetting on pre-rendered pages; leave the legacy pseudocode route available. Install build dependencies through Docker and CI, and document bare Jekyll setup.
- [x] Verify the real site build, no visible source in delivered HTML, visual consistency, responsive layouts, proof expansion and interactive figures. Run relevant suites and independent review.

## Verification

All 200 JavaScript tests pass with the actual pinned MathJax dependency, without skips. All Ruby suites pass. The production build succeeds; generated HTML contains static CHTML and assistive MathML with working local assets and no browser MathJax renderer. Desktop math geometry matches the captured previous renderer; mobile layout, proof expansion, interactive curve updates, and the separate video controls/post link were checked in the browser. The Docker image was rebuilt and the existing Compose preview restarted successfully.

## Review focus

Check full-page references, hidden mobile/proof expressions, initial stylesheet/font loading, cache restoration after a clean output directory, and malformed mathematics that must never be cached as a success.
