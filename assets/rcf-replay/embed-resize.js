"use strict";
if (window.parent !== window) {
  let previous = 0;
  let pending = false;
  const resize = () => {
    pending = false;
    const height = Math.ceil(document.body.getBoundingClientRect().height);
    if (Math.abs(height - previous) < 2) return;
    previous = height;
    parent.postMessage({type:"rcf:height",height},location.origin);
  };
  new ResizeObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(resize);
  }).observe(document.body);
  window.addEventListener("load",resize);
}
