# Installation

This repository already contains the source for <https://manuupadhyaya.github.io>. It is not maintained as a general-purpose template fork. For the full upstream theme setup guide, see <https://github.com/alshedivat/al-folio>.

## Local Setup With Ruby/Bundler

Prerequisites:

- Ruby and Bundler
- Node.js 20 or newer and npm
- Python and `pip`
- ImageMagick

Install dependencies and run the site locally:

```bash
bundle install
npm ci --ignore-scripts --prefer-offline --no-audit --no-fund
pip install -r requirements.txt
bundle exec jekyll serve --unpublished
```

Open `http://localhost:4000`.

## Local Setup With Docker

For day-to-day previews:

```bash
docker compose up
```

For the first run, or after changing dependencies (`Gemfile` or `Gemfile.lock`), `Dockerfile`, or `bin/entry_point.sh`, use `docker compose up --build`.

Open `http://localhost:8080`.

Docker installs the JavaScript dependencies automatically when the preview starts if `package-lock.json` has changed since the previous start. Unchanged dependencies are reused across restarts.

## Related Automation

- `deploy.yml` builds and deploys the site to GitHub Pages.
- `broken-links-site.yml` checks the generated `_site` output for local link issues after deploy.
- `lighthouse-badger.yml` runs Lighthouse PageSpeed Insights against the live site URL and writes badges/reports back to the repository when triggered.
- The Docker files are for local development and for the upstream image publishing workflows. In this repository, the image-publish workflows are present but their push jobs are gated to the upstream owner.

## Deployment

Deployment is handled by GitHub Actions on pushes to `main`.

If you change the publication URL or repository name, update these fields in `_config.yml` before deploying:

- `url`
- `baseurl`

GitHub Pages serves the generated site from the `gh-pages` branch.
