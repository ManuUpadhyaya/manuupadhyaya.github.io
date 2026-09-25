---
layout: page
permalink: /publications/
title: Publications
description:
seo_description: Publications by Manu Upadhyaya on optimization, first-order methods, Lyapunov analysis, mathematical programming, and machine learning.
nav: true
nav_order: 2
math: true # enables MathJax for LaTeX expressions coming from papers.bib
mdb: true
---

{% include bib_search.liquid %}

<div class="publications">

<h2 class="bibliography" id="preprints">Preprints</h2>

{% bibliography --query @*[abbr=Preprint] %}

<h2 class="bibliography" id="journal-articles">Journal articles</h2>

{% bibliography --query @*[abbr=Journal] %}

<h2 class="bibliography" id="conference-proceedings">Conference proceedings</h2>

{% bibliography --query @*[abbr=Conference] %}

<h2 class="bibliography" id="theses">Theses</h2>

{% bibliography --query @*[abbr=Thesis] %}

</div>
