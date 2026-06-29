---
layout: default
title: 文章归档
permalink: /archive/
---
<section class="archive shell-narrow">
  <header class="page-title"><p class="eyebrow">ARCHIVE</p><h1>所有文章</h1></header>
  {% assign postsByYear = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
  {% for year in postsByYear %}
  <div class="archive-year">
    <h2>{{ year.name }}</h2>
    <ol>
      {% for post in year.items %}
      <li><time>{{ post.date | date: '%m.%d' }}</time><a href="{{ post.url | relative_url }}">{{ post.title }}</a></li>
      {% endfor %}
    </ol>
  </div>
  {% endfor %}
</section>

