# Manu Upadhyaya Website

Source for <https://manuupadhyaya.github.io>.

This repository contains the Jekyll source for Manu Upadhyaya's personal academic website. It started from the [al-folio](https://github.com/alshedivat/al-folio) theme.

## Live Site Scope

The current live site exposes:

- `/` About
- `/news/`
- `/publications/`
- `/software/`
- `/teaching/`
- `/share/CV.pdf`

The template-only blog, projects, repositories, people, and demo media content are intentionally not part of this repo anymore.

## Main Content Files

- `_pages/about.md`: homepage content
- `_news/`: homepage and `/news/` announcements
- `_pages/publications.md` and `_bibliography/papers.bib`: publication list
- `_pages/software.md`: software/projects summary page
- `_pages/teaching.md`: teaching page
- `_data/`: structured metadata such as socials, CV data, venues, and coauthors
- `share/`: PDFs linked directly from the site
- `assets/img/prof_pic.jpg`: profile photo
- `assets/img/prof_pic_color.png`: Open Graph preview image

## Local Development

### Ruby/Bundler

```bash
bundle install
pip install -r requirements.txt
bundle exec jekyll serve
```

Open `http://localhost:4000`.

### Docker

```bash
docker compose pull
docker compose up
```

Open `http://localhost:8080`.

## Deployment

Pushes to `main` trigger the GitHub Actions deployment workflow. GitHub Pages serves the generated site from `gh-pages`.

If you change the site URL or repository name, update `url` and `baseurl` in `_config.yml`.

## Related Automation

- `deploy.yml` builds and deploys the site.
- `broken-links.yml` checks Markdown and HTML source files.
- `broken-links-site.yml` checks the generated `_site` output after deploy.
- `lighthouse-badger.yml` runs Lighthouse PageSpeed Insights against the published site URL and writes badges/reports back to the repository when triggered.
- `docker-compose.yml` and `Dockerfile` support local containerized development. The Docker image publish workflows remain in the repo, but `deploy-image.yml` and `docker-slim.yml` only push for the upstream owner.

## Lighthouse PageSpeed Insights

### Desktop

[![Google Lighthouse PageSpeed Insights](lighthouse_results/desktop/pagespeed.svg)](https://htmlpreview.github.io/?https://github.com/ManuUpadhyaya/manuupadhyaya.github.io/blob/main/lighthouse_results/desktop/manuupadhyaya_github_io_.html)

Run the test yourself: [Google Lighthouse PageSpeed Insights](https://pagespeed.web.dev/report?url=https%3A%2F%2Fmanuupadhyaya.github.io%2F&form_factor=desktop)

### Mobile

[![Google Lighthouse PageSpeed Insights](lighthouse_results/mobile/pagespeed.svg)](https://htmlpreview.github.io/?https://github.com/ManuUpadhyaya/manuupadhyaya.github.io/blob/main/lighthouse_results/mobile/manuupadhyaya_github_io_.html)

Run the test yourself: [Google Lighthouse PageSpeed Insights](https://pagespeed.web.dev/report?url=https%3A%2F%2Fmanuupadhyaya.github.io%2F&form_factor=mobile)

## Upstream Theme

If you want to reintroduce removed al-folio features such as the blog, projects grid, repositories page, or people page, use the upstream theme as the source of truth:

- <https://github.com/alshedivat/al-folio>
