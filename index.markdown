---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults
layout: home
title: Home
---

<section class="hero-gallery">

  <div class="hero-gallery__viewport">

    <div class="hero-gallery__track">

      <!-- Current homepage image -->
      <figure
        class="hero-gallery__item"
        data-title="Yosemite National Park"
        data-subtitle="California"
      >
        <img
          src="{{ '/assets/images/home.JPG' | relative_url }}"
          alt="Yosemite National Park"
          class="hero-gallery__image"
          draggable="false"
        >
      </figure>


      <!-- Add your other photos here -->

      <figure
        class="hero-gallery__item"
        data-title="Crowders Mountain State Park"
        data-subtitle="North Carolina"
      >
        <img
          src="{{ '/assets/images/crowders.jpeg' | relative_url }}"
          alt="Kings Mountain"
          class="hero-gallery__image"
          draggable="false"
        >
      </figure>


      <figure
        class="hero-gallery__item"
        data-title="Boston"
        data-subtitle="Massachusetts"
      >
        <img
          src="{{ '/assets/images/boston.JPG' | relative_url }}"
          alt="Boston"
          class="hero-gallery__image"
          draggable="false"
        >
      </figure>


      <figure
        class="hero-gallery__item"
        data-title="Charlotte"
        data-subtitle="North Carolina"
      >
        <img
          src="{{ '/assets/images/charlotte.JPG' | relative_url }}"
          alt="Charlotte"
          class="hero-gallery__image"
          draggable="false"
        >
      </figure>

    </div>

  </div>


  <div class="hero-gallery__caption">
    <div class="hero-gallery__title"></div>
    <div class="hero-gallery__subtitle"></div>
  </div>

  <div class="hero-gallery__hint">
    ← explore →
  </div>

</section>


<script>
document.addEventListener("DOMContentLoaded", () => {

  const gallery = document.querySelector(".hero-gallery");
  if (!gallery) return;

  const track = gallery.querySelector(".hero-gallery__track");
  const items = [...gallery.querySelectorAll(".hero-gallery__item")];

  const title = gallery.querySelector(".hero-gallery__title");
  const subtitle = gallery.querySelector(".hero-gallery__subtitle");

  let activeItem = null;
  let frameRequested = false;
  let captionTimer = null;


  /*
   * Scroll any image directly into the center
   */
  function centerItem(item, behavior = "smooth") {

    const trackRect = track.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();

    const difference =
      (itemRect.left + itemRect.width / 2) -
      (trackRect.left + trackRect.width / 2);

    track.scrollTo({
      left: track.scrollLeft + difference,
      behavior: behavior
    });

  }


  /*
   * Update perspective / size / opacity
   */
  function updateGallery() {

    frameRequested = false;

    const trackRect = track.getBoundingClientRect();
    const center = trackRect.left + trackRect.width / 2;

    let closest = null;
    let closestDistance = Infinity;


    items.forEach((item) => {

      const rect = item.getBoundingClientRect();
      const itemCenter = rect.left + rect.width / 2;

      const rawOffset =
        (itemCenter - center) / rect.width;

      const offset =
        Math.max(-2, Math.min(2, rawOffset));

      const distance = Math.abs(offset);


      /*
       * Faux 3D
       */
      const rotateY =
        offset * -14;

      const scale =
        Math.max(
          0.90,
          1 - distance * 0.08
        );

      const opacity =
        Math.max(
          0.72,
          1 - distance * 0.14
        );

      const translateY =
        distance * 3;


      item.style.transform = `
        perspective(1200px)
        rotateY(${rotateY}deg)
        scale(${scale})
        translateY(${translateY}px)
      `;

      item.style.opacity = opacity;


      /*
       * Give side images a clickable cursor
       */
      if (distance > 0.15) {
        item.style.cursor = "pointer";
      } else {
        item.style.cursor = "default";
      }


      /*
       * Find closest image to center
       */
      const centerDistance =
        Math.abs(itemCenter - center);

      if (centerDistance < closestDistance) {
        closestDistance = centerDistance;
        closest = item;
      }

    });


    /*
     * Update active caption
     */
    if (closest && closest !== activeItem) {

      activeItem = closest;

      clearTimeout(captionTimer);

      title.classList.add("changing");
      subtitle.classList.add("changing");

      captionTimer = setTimeout(() => {

        title.textContent =
          activeItem.dataset.title || "";

        subtitle.textContent =
          activeItem.dataset.subtitle || "";

        title.classList.remove("changing");
        subtitle.classList.remove("changing");

      }, 100);

    }

  }


  /*
   * Avoid running updateGallery hundreds
   * of times during the same frame
   */
  function requestUpdate() {

    if (frameRequested) return;

    frameRequested = true;

    requestAnimationFrame(updateGallery);

  }


  /*
   * Normal scrolling
   */
  track.addEventListener(
    "scroll",
    requestUpdate,
    { passive: true }
  );


  /*
   * Mouse wheel:
   *
   * horizontal trackpad movement works normally.
   *
   * vertical mouse-wheel movement becomes
   * horizontal movement while over the gallery.
   */
  track.addEventListener(
    "wheel",
    (event) => {

      /*
       * Let native horizontal trackpad
       * scrolling handle itself.
       */
      if (
        Math.abs(event.deltaX) >
        Math.abs(event.deltaY)
      ) {
        return;
      }

      event.preventDefault();

      track.scrollLeft +=
        event.deltaY;

    },
    { passive: false }
  );


  /*
   * Click any side image to bring
   * it smoothly into the center.
   */
  items.forEach((item) => {

    item.addEventListener("click", () => {

      if (item === activeItem) return;

      centerItem(item, "smooth");

    });

  });


  /*
   * Recalculate perspective after resize
   */
  window.addEventListener(
    "resize",
    requestUpdate
  );


  /*
   * Start on Yosemite / first image
   */
  requestAnimationFrame(() => {

    centerItem(items[0], "auto");

    requestAnimationFrame(
      updateGallery
    );

  });

});
</script>

# Hi, I’m Lalith 👋

## Thanks for visiting — feel free to explore!

### I’m currently a student at UNC Charlotte, majoring in Computer Science concentrating in Systems &amp; Networks.

### I’m passionate about exploring cloud architecture, machine learning, computational modeling, and building tools that solve real problems.

### Apart from coding, here are some things I love to do:

<!-- - Reading and writing -->
### - Running
### - Biking
### - Beating the market
### - Travelling

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


<!-- 
bundle exec jekyll clean
bundle exec jekyll serve
bundle exec jekyll serve --livereload
-->
