# Customization

This repository has been trimmed to the parts that are used by the live site. The original al-folio demo content for the blog, projects grid, repositories page, people page, CV page, screenshots, and demo media has been removed.

## Main Files To Edit

- `_pages/about.md`: homepage
- `_news/*.md`: news items shown on the homepage and `/news/`
- `_pages/publications.md`: publications landing page
- `_bibliography/papers.bib`: publication entries
- `_pages/software.md`: software page
- `_pages/teaching.md`: teaching page
- `_data/socials.yml`: social/contact links
- `_data/coauthors.yml`: publication coauthor links
- `_data/cv.yml`: structured CV data kept for reference
- `share/CV.pdf`: PDF linked from the header
- `share/prerequisites.pdf` and `share/trading.pdf`: PDFs linked from teaching
- `assets/img/prof_pic.jpg`: profile image
- `assets/img/prof_pic_color.png`: Open Graph preview image

## Layout And Styling

- `_config.yml`: site-wide settings
- `_config.yml` analytics fields: `google_analytics` and `google_site_verification` for GA4 and Search Console
- `_layouts/`: page layouts
- `_includes/`: reusable page fragments
- `_sass/`: site styling
- `assets/css/` and `assets/js/`: compiled/runtime frontend assets

## Analytics

The site is configured to activate Google Analytics only when `google_analytics` is set and Search Console verification only when `google_site_verification` is set.

GA4 automatically tracks:

- `cv_download`
- `email_click`
- `publication_outbound_click`
- `software_outbound_click`
- `outbound_link_click`

After publishing the Search Console verification tag, finish the setup in Google's UI by linking the Search Console property to the GA4 property.

## Adding Or Changing Pages

Add new top-level pages under `_pages/` with front matter such as:

```yaml
---
layout: page
title: Example
permalink: /example/
nav: true
nav_order: 6
---
```

Navigation is driven by page front matter, except for the header CV button, which links directly to `share/CV.pdf`.

## Removed Template Features

This repo no longer carries the upstream demo content for:

- blog posts and blog landing page
- projects collection and projects landing page
- repositories page
- people/profiles page
- CV page generated from the demo PDF
- README preview screenshots and Lighthouse report artifacts
- demo audio, video, notebook, plotly, and sample image assets

If you want any of those features back, copy the relevant files from upstream al-folio instead of relying on this repo to keep the template scaffolding around.

Upstream reference:

- <https://github.com/alshedivat/al-folio>
