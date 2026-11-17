"use strict";
const element = (id) => document.getElementById(id);
const video = element("review-video");
const canvas = element("review-canvas");
const context = canvas.getContext("2d");
const seek = element("review-seek");
const mode = element("review-mode");
let data;
let callbackId = null;

function rowAt(time) {
  let lower = 0;
  let upper = data.frames.length - 1;
  while (lower < upper) {
    const middle = Math.ceil((lower + upper) / 2);
    if (data.frames[middle].t <= time + 1e-8) lower = middle;
    else upper = middle - 1;
  }
  return data.frames[lower];
}

function draw(time = video.currentTime) {
  if (!data) return;
  const row = rowAt(time);
  canvas.dataset.frame = String(row.frame);
  context.clearRect(0, 0, canvas.width, canvas.height);
  seek.value = time;
  element("review-clock").textContent = time.toFixed(2) + " s · frame " + row.frame;
  element("review-count").textContent = row.scene ? row.scene.inliers : "Unavailable";
  element("review-error").textContent = row.scene ? row.scene.median_fb_error_px.toFixed(3) + " px" : "Unavailable";
  element("review-flow").textContent = row.scene ? row.scene.median_displacement_px.toFixed(2) + " px/frame" : "Unavailable";
  element("review-status").textContent = mode.value === "wheel" && !row.wheel
    ? "Wheel-patch output unavailable at this timestamp. Occlusion and wheel-plane calibration limit steering-angle recovery."
    : row.status;
  if (mode.value === "none") return;
  if (mode.value === "scene" || mode.value === "both") {
    if (element("review-rois").checked) {
      context.strokeStyle = "#b69a53";
      context.lineWidth = 1;
      for (const [x1, y1, x2, y2] of row.scene_rois) context.strokeRect(x1, y1, x2-x1, y2-y1);
    }
    for (const track of row.exterior) {
      context.strokeStyle = context.fillStyle = track.inlier ? "#75ccff" : "#e4ad60";
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(...track.from);
      context.lineTo(...track.to);
      context.stroke();
      context.beginPath();
      context.arc(...track.to, 2.2, 0, Math.PI * 2);
      context.fill();
    }
  }
  if ((mode.value === "wheel" || mode.value === "both") && row.wheel) {
    context.fillStyle = "#ffd36e";
    for (const point of row.wheel.points) {
      context.beginPath();
      context.arc(...point, 2.3, 0, Math.PI * 2);
      context.fill();
    }
  }
}

function schedule() {
  if (callbackId !== null || video.paused || video.ended) return;
  if ("requestVideoFrameCallback" in video) {
    callbackId = video.requestVideoFrameCallback((_now, metadata) => {
      callbackId = null;
      if (!video.seeking) draw(metadata.mediaTime);
      schedule();
    });
  } else {
    callbackId = requestAnimationFrame(() => {
      callbackId = null;
      draw();
      schedule();
    });
  }
}

function cancel() {
  if (callbackId === null) return;
  if ("cancelVideoFrameCallback" in video) video.cancelVideoFrameCallback(callbackId);
  else cancelAnimationFrame(callbackId);
  callbackId = null;
}

element("review-play").addEventListener("click", async () => {
  if (!video.paused) {
    video.pause();
    return;
  }
  try {
    await video.play();
  } catch {
    element("review-status").textContent = "Playback could not start. Try the play button again.";
  }
});
video.addEventListener("playing", () => {
  element("review-play").textContent = "Pause";
  schedule();
});
for (const event of ["pause", "ended"]) {
  video.addEventListener(event, () => {
    cancel();
    draw();
    element("review-play").textContent = "Play";
  });
}
video.addEventListener("seeked", () => draw());
video.addEventListener("loadedmetadata", () => {
  seek.max = video.duration;
  draw();
});
video.addEventListener("error", () => {
  element("review-status").textContent = "Original video unavailable. Start the local preview with its file path.";
});
seek.addEventListener("input", () => {
  video.currentTime = Number(seek.value);
  draw(Number(seek.value));
});
mode.addEventListener("change", () => draw());
element("review-rois").addEventListener("change", () => draw());
fetch("observations.json")
  .then((response) => {
    if (!response.ok) throw new Error("Observations unavailable");
    return response.json();
  })
  .then((result) => {
    data = result;
    draw();
  })
  .catch(() => {
    element("review-status").textContent = "Tracking observations are unavailable. Run the local analysis pipeline first.";
  });
