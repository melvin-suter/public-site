---
title: Blog
layout: layouts/page.njk
tags: 
- page
- nav
---

<ul>
{%- for post in collections.blog -%}
  <li><a href="{{post.url}}">{{ post.data.title }}</a></li>
{%- endfor -%}
</ul>