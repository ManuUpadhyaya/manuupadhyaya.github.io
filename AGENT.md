# AGENT.md

## Mission

- Keep LaTeX math rendering working everywhere it is used.
- Keep Lighthouse PageSpeed Insights as close to 100 as possible on desktop and mobile.

## Math Rules (Do Not Break)

- Keep `enable_math: true` in `_config.yml`.
- Set front matter `math: true` on any page/post/news item that contains TeX math.
- Keep MathJax loading logic intact in `_includes/scripts.liquid` and `_includes/distill_scripts.liquid`.
- Verify math rendering on at least:
  - `/` from `_pages/about.md`
  - `/publications/` from `_pages/publications.md`
  - `_news/*.md` entries that contain TeX

## Lighthouse Rules

- Treat Lighthouse regressions as bugs.
- Prefer non-blocking loading for non-critical CSS/JS.
- Keep homepage LCP optimized:
  - use responsive image sizes
  - avoid overserving large images on mobile
- Keep favicon/mobile icon coverage complete:
  - `/favicon.ico`
  - `/assets/img/favicon-16x16.png`
  - `/assets/img/favicon-32x32.png`
  - `/assets/img/apple-touch-icon.png`
  - `/assets/img/android-chrome-192x192.png`
  - `/assets/img/android-chrome-512x512.png`
  - `/site.webmanifest`

## Required Checks Before Merge

- `npx prettier . --check`
- `docker compose up --build` (or equivalent containerized Jekyll build)
- Run Lighthouse workflow and compare against previous run.
- Do not merge if math rendering breaks or Lighthouse scores regress without a documented reason.

## Practical Guardrails

- Avoid unnecessary third-party assets on the homepage.
- Keep critical-path CSS minimal.
- Keep `Gemfile.lock` stable unless intentionally updating dependencies.
- Do not change font style, typography, favicon, or icon assets/links unless explicitly requested by the user.
