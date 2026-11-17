"use strict";
const container = document.querySelector(".rcf-embed");
const frame = container.querySelector("iframe");
container.querySelector(".rcf-load-replay").addEventListener("click", () => {
  frame.src = container.dataset.replayUrl;
  frame.hidden = false;
  container.querySelector(".rcf-replay-poster").hidden = true;
  container.querySelector(".rcf-load-replay").hidden = true;
});
window.addEventListener("message", (event) => {
  if (event.source !== frame.contentWindow || event.origin !== location.origin || event.data?.type !== "rcf:height") return;
  const height = Number(event.data.height);
  if (Number.isFinite(height) && height > 0) frame.style.height = Math.min(5000,Math.max(600,height)) + "px";
});
