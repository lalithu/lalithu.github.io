---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults
layout: home
heading: Hello, I’m Lalith Uriti 👋
header_image: /assets/images/home.JPG
---

## Thank you for visiting my website — feel free to explore and get to know me better!

### I’m currently a student at UNC Charlotte, majoring in Computer Science with a concentration in Systems & Networks.

### I’m passionate about exploring cloud architecture, machine learning, computational modeling, and building tools that solve real problems.

### Apart from coding, here are some things I love to do:

<!-- - Reading and writing -->
### - Running
### - Beating the market
### - Travelling
### - Designing and building things
### - Exploring new Tech

<section class="skills-section">
  <h2 class="skills-title">Skills</h2>
  <div class="skills-grid" id="skills-grid"></div>
</section>

<section class="skills-section">
  <h2 class="skills-title">Tools</h2>
  <div class="skills-grid" id="tools-grid"></div>
</section>

<script>
const skills = [
  "python", 
  "openjdk", 
  "cplusplus", 
  "swift", 
  "go",
  "kotlin",
  "julia",
  "mysql", 
  "javascript",
  "react"
];

const tools = [
  "intellijidea",
  "git",
  "github",
  "firebase",
  "postman",
  "docker",
  "opencv",
  "tensorflow"
];

function loadIcons(list, containerId) {
  const container = document.getElementById(containerId);

  list.forEach(icon => {
    const tile = document.createElement("div");
    tile.className = "skill-tile";

    const img = document.createElement("img");
    img.src = `https://cdn.simpleicons.org/${icon}`;
    img.alt = icon;

    tile.appendChild(img);
    container.appendChild(tile);
  });
}

loadIcons(skills, "skills-grid");
loadIcons(tools, "tools-grid");
</script>


