---
layout: page
permalink: /publications/
title: Publications
description:
years: [2022,2021,2020,2019,2018,2017]
abbr: [Conference]
nav: true
nav_order: 1
---

<!-- _pages/publications.md -->
<div class="publications">
  {%- for y in page.abbr %}
    <h2 class="status">{{y}}s</h2>
    {% bibliography -f papers -q @*[abbr={{y}}]* %}
  {% endfor %}
</div>
