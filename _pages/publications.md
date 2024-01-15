---
layout: page
permalink: /publications/
title: Publications
description:
years: [2023,2022,2021,2020,201z9,2018,2017]
abbr: [Preprint,Conference,Thesis]
nav: true
nav_order: 1
---

<!-- _pages/publications.md -->
<div class="publications">
    <h2 class="status">Preprints</h2>
    {% bibliography -f papers -q @*[abbr=Preprint]* %}
    <h2 class="status">Journals</h2>
    {% bibliography -f papers -q @*[abbr=Journal]* %}
    <h2 class="status">Conferences</h2>
    {% bibliography -f papers -q @*[abbr=Conference]* %}
    <h2 class="status">Theses</h2>
    {% bibliography -f papers -q @*[abbr=Thesis]* %}
</div>
