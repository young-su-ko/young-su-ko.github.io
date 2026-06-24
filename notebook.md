---
layout: notebook
title: "notebook"
permalink: /notebook/
---

<div class="row g-2 g-lg-5 mb-1">
  <div class="col-lg-6 col-sm-12">
    <h4 class="fw-bold">projects</h4>
    <div class="posts-list">
      {% assign projects = site.posts | where: "category", "projects" %}
      {% if projects.size > 0 %}
        <ul class="list-unstyled">
          {% for post in projects %}
            <li>
              <p class="text-muted mb-0">
                <time datetime="{{ post.date }}">{{ post.date | date: site.theme_config.date_format }}</time>
              </p>
              <a href="{{ post.url | relative_url }}" class="text-decoration-none">
                <p class="mb-1">{{ post.title }}</p>
              </a>
            </li>
          {% endfor %}
        </ul>
      {% else %}
        <p class="text-muted">No projects yet.</p>
      {% endif %}
    </div>
  </div>
  <div class="col-lg-6 col-md-12">
    <h4 class="fw-bold">concepts</h4>
    <div class="posts-list">
      {% assign concepts = site.posts | where: "category", "concepts" %}
      {% if concepts.size > 0 %}
        <ul class="list-unstyled">
          {% for post in concepts %}
            <li>
              <p class="text-muted mb-0">
                <time datetime="{{ post.date }}">{{ post.date | date: site.theme_config.date_format }}</time>
              </p>              
              <a href="{{ post.url | relative_url }}" class="text-decoration-none">
                <p class="mb-1">{{ post.title }}</p>
              </a>
            </li>
          {% endfor %}
        </ul>
      {% else %}
        <p class="text-muted">No concepts yet.</p>
      {% endif %}
    </div>
  </div>
</div>
