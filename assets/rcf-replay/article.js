"use strict";
const container = document.querySelector(".rcf-embed");
const frame = container.querySelector("iframe");
window.addEventListener("message", (event) => {
  if (event.source !== frame.contentWindow || event.origin !== location.origin || event.data?.type !== "rcf:height") return;
  const height = Number(event.data.height);
  if (Number.isFinite(height) && height > 0) frame.style.height = Math.min(5000,Math.max(600,height)) + "px";
});
