---
layout: default
title: 归档
permalink: /archive/
---
{% assign hidden_titles = "世界，您好！|思考|敬卡文迪什" | split: "|" %}
<section class="archive-page shell">
  <article class="glass-panel archive-title reveal">
    <p class="overline">ARCHIVE</p>
    <h1>所有文章</h1>
    <p class="archive-intro">按年份整理，方便慢慢翻。首页已经移除了没有实质内容的占位文，这里也同步隐藏。</p>
  </article>

  {% assign posts_by_year = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
  {% for year in posts_by_year %}
    <article class="glass-panel archive-year reveal">
      <h2>{{ year.name }}</h2>
      <ol>
        {% for post in year.items %}
          {% unless hidden_titles contains post.title %}
            <li>
              <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%m.%d' }}</time>
              <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
            </li>
          {% endunless %}
        {% endfor %}
      </ol>
    </article>
  {% endfor %}
</section>
