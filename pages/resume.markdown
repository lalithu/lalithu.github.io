---
layout: page
title: Resume
permalink: /resume/
---

{% assign resume_pdf = '/assets/Lalith_Uriti_Resume.pdf' | relative_url %}
<div class="resume-preview">
  <a class="resume-download" href="{{ resume_pdf }}" download>Download PDF</a>
  <div id="resume-pages" data-pdf="{{ resume_pdf }}" aria-label="Résumé preview"></div>
  <p id="resume-preview-status" role="status" hidden></p>
</div>
<script type="module" src="{{ '/assets/js/resume-preview.mjs' | relative_url }}"></script>
