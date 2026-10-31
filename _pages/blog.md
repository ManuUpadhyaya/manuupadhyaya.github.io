---
layout: page
title: Blog
permalink: /blog/
seo_description: Blog posts by Manu Upadhyaya on optimization and computer-aided convergence analysis.
nav: true
nav_order: 4
---

{% if site.posts.size > 0 %}
{% assign has_video_preview = false %}

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
      {% assign preview = site.data.blog_previews[post.url] %}
      {% if preview %}
        {% assign has_video_preview = true %}
        {% include blog-video-preview.liquid preview=preview title=post.title %}
      {% endif %}
    </li>
  {% endfor %}
</ul>
{% if has_video_preview %}
  <script defer src="{{ '/assets/js/blog-video-preview.js' | relative_url | bust_file_cache }}"></script>
{% endif %}
{% else %}
<p>No posts published yet.</p>
{% endif %}
