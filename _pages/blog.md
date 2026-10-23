---
layout: page
title: Blog
permalink: /blog/
seo_description: Blog posts by Manu Upadhyaya on optimization and computer-aided convergence analysis.
nav: true
nav_order: 4
---

{% if site.posts.size > 0 %}

<ul class="blog post-list">
  {% for post in site.posts %}
    <li class="blog-entry">
      <h2>
        <a class="post-title" href="{{ post.url | relative_url }}">{{ post.title | escape }}</a>
      </h2>
      <p class="post-meta">
        <time datetime="{{ post.date | date: '%Y-%m-%d' }}">{{ post.date | date: '%B %d, %Y' }}</time>
      </p>
      {% if post.description %}
        <p>{{ post.description | escape }}</p>
      {% endif %}
    </li>
  {% endfor %}
</ul>
{% else %}
<p>No posts published yet.</p>
{% endif %}
