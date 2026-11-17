import { fit, project, wrap, targets } from "./hybrid-model.mjs";

const byId = (id) => document.getElementById(id);
const video = byId("video");
const portrait = byId("portrait");
const mediaStatus = byId("media-status");
const scrubber = byId("scrubber");
const play = byId("play");
const rate = byId("rate");
const overlay = byId("overlay");
const modeButtons = [...document.querySelectorAll("[data-overlay]")];
let duration = 14.97;
let nominalFps = 30;
let mediaReady = false;
let demoPlaying = false;
let demoTime = 0;
let previousTick = 0;
let animation = null;
let fileUrl;
let source = "";
let mode = "combined";
let shownFrame = null;
let sourceMatches = false;
let view = "estimate";
let reconstruction;
let observations;
let selected;
let working;
let config;
let fitGeneration = 0;
let editCount = 0;
let latestMetrics = [];
const metricNames = ["Speed", "Body heading", "Travel direction", "Yaw rate", "Sideslip β", "Lateral acc.", "Ground position", "Wheel patch"];
const RADIANS_TO_DEGREES = 180 / Math.PI;
const MPH = 2.2369363;
const svgNamespace = "http://www.w3.org/2000/svg";

function svgElement(name, attributes) {
  const element = document.createElementNS(svgNamespace, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}
for (const name of metricNames) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "metric";
  button.setAttribute("aria-haspopup", "dialog");
  button.innerHTML = '<strong></strong><span class="metric-value">—</span><span class="metric-state">Unavailable</span><span class="metric-range"></span>';
  button.querySelector("strong").textContent = name;
  button.addEventListener("click", () => inspect(name));
  byId("metrics").append(button);
}

function formatTime(time) {
  const centis = Math.floor(time * 100 + 1e-6);
  return String(Math.floor(centis / 6000)).padStart(2, "0") + ":" +
    String(Math.floor(centis / 100) % 60).padStart(2, "0") + "." + String(centis % 100).padStart(2, "0");
}
function clock() { return mediaReady ? video.currentTime : demoTime; }
function indexAt(rows, time) {
  let lower = 0;
  let upper = rows.length - 1;
  while (lower < upper) {
    const middle = Math.ceil((lower + upper) / 2);
    if (rows[middle].t <= time + 1e-8) lower = middle;
    else upper = middle - 1;
  }
  return lower;
}
function currentSolution() { return view === "whatif" ? working : selected; }
function stateAt(time, solution = currentSolution()) { return solution.states[indexAt(solution.states, time)]; }
function evidenceAt(time) { return observations.frames[indexAt(observations.frames, time)]; }
function mapPoint(point) { return project(point, reconstruction.input.worldToApple); }
function pathString(points) {
  return points.map((point, index) => (index ? "L" : "M") + point.map((value) => value.toFixed(2)).join(" ")).join(" ");
}
function comparisonStates(time) {
  const solutions = reconstruction.solutions.filter((solution) => solution.summary.feasible);
  if (view === "whatif") solutions.push(working);
  return solutions.map((solution) => stateAt(time, solution));
}
function rangeText(key, time, scale = 1, reference = null) {
  const values = comparisonStates(time).map((state) => state[key]).filter((value) => value !== null);
  if (!values.length) return "Undefined near standstill";
  const transformed = values.map((value) => ((reference === null || key === "beta") ? value : reference + wrap(value - reference)) * scale);
  return Math.round(Math.min(...transformed)) + "–" + Math.round(Math.max(...transformed));
}
function kindAt(state) {
  return view === "whatif" || state.kind === "Simulated" ? "Simulated" : "Estimated";
}
function updateMetrics(time) {
  if (!reconstruction || !observations) return;
  if (!sourceMatches) {
    for (const element of byId("metrics").children) {
      element.dataset.kind = "Unavailable";
      element.querySelector(".metric-value").textContent = "—";
      element.querySelector(".metric-state").textContent = "Unavailable";
      element.querySelector(".metric-range").textContent = "Analysed source required";
    }
    return;
  }
  const row = evidenceAt(time);
  const state = stateAt(time);
  const kind = kindAt(state);
  if (view === "observed") {
    latestMetrics = [
      { value: "N/A", kind: "Unavailable", range: "Metric speed unresolved" },
      { value: "N/A", kind: "Unavailable", range: "Body pose unresolved" },
      { value: row.scene ? row.scene.inliers + " pts" : "N/A", kind: row.scene ? "Observed" : "Unavailable", range: "Image-model inliers" },
      { value: "N/A", kind: "Unavailable", range: "Body rotation unresolved" },
      { value: "N/A", kind: "Unavailable", range: "Ground velocity unresolved" },
      { value: row.scene ? row.scene.median_displacement_px.toFixed(1) + " px/f" : "N/A", kind: row.scene ? "Observed" : "Unavailable", range: "Image displacement" },
      { value: "N/A", kind: "Unavailable", range: "No measured ground pose" },
      { value: row.wheel ? row.wheel.points.length + " pts" : "N/A", kind: row.wheel ? "Observed" : "Unavailable", range: "Visible wheel-patch tracks" },
    ];
  } else {
    const bearing = ((90 - state.heading * RADIANS_TO_DEGREES) % 360 + 360) % 360;
    const direction = ((90 - state.direction * RADIANS_TO_DEGREES) % 360 + 360) % 360;
    latestMetrics = [
      { value: "≈" + Math.round(state.speed * MPH) + " mph", kind, range: rangeText("speed", time, MPH) + " mph" },
      { value: "≈" + Math.round(bearing) + "°", kind, range: "Bearing · north = 0°" },
      { value: state.speed > .5 ? "≈" + Math.round(direction) + "°" : "N/A", kind: state.speed > .5 ? kind : "Unavailable", range: "Independent from heading" },
      { value: "≈" + Math.round(state.yaw * RADIANS_TO_DEGREES) + "°/s", kind, range: rangeText("yaw", time, RADIANS_TO_DEGREES) + "°/s" },
      { value: state.beta === null ? "N/A" : "≈" + Math.round(state.beta * RADIANS_TO_DEGREES) + "°", kind: state.beta === null ? "Unavailable" : kind, range: state.beta === null ? "Undefined below 0.5 m/s" : rangeText("beta", time, RADIANS_TO_DEGREES, state.beta) + "°" },
      { value: "≈" + (state.bodyLateral / 9.80665).toFixed(1) + " g", kind, range: "Body frame · model derived" },
      { value: Math.round(state.x) + ", " + Math.round(state.y) + " m", kind, range: "Local east, north" },
      { value: row.wheel ? row.wheel.increment_deg.toFixed(1) + "°/f" : "N/A", kind: row.wheel ? "Estimated" : "Unavailable", range: "Image-plane patch rotation" },
    ];
  }
  [...byId("metrics").children].forEach((element, index) => {
    const metric = latestMetrics[index];
    element.dataset.kind = metric.kind;
    element.querySelector(".metric-value").textContent = metric.value;
    element.querySelector(".metric-state").textContent = metric.kind;
    element.querySelector(".metric-range").textContent = metric.range;
  });
  byId("telemetry-kind").textContent = view === "observed" ? "OBSERVED IMAGE EVIDENCE" :
    kind === "Simulated" ? "SIMULATED · MODEL BRIDGE / WHAT-IF" : "ESTIMATED · ASSUMPTION-LED";
}
const methods = [
  "Speed is the norm of the fitted ground-velocity spline derivative. Route geometry, event onset, grip and smoothing determine it. The range spans retained alternatives.",
  "Body heading is an independent fitted unwrapped angle. Rotation winding and end alignment are soft assumptions. A broad editable sideslip prior favors drifting over prolonged backward sliding. The competing rotation hypotheses remain available in the solution selector.",
  "Travel direction is atan2(vy, vx) from the position derivative. It is undefined near standstill. It can differ substantially from body heading during slip.",
  "Yaw rate is the analytic derivative of the fitted heading spline. Positive values are counterclockwise in the east/north ground frame.",
  "Sideslip is the wrapped difference between travel direction and body heading. It is undefined below 0.5 m/s. These estimates can include transient travel opposite to the body-forward direction.",
  "Body lateral acceleration is -sin(heading) × ax + cos(heading) × ay, divided by g. It differs from speed × yaw rate during changing sideslip. Total acceleration is checked against assumed friction.",
  "Ground position is a cubic spline fit to the owner's sketch as soft anchors, constrained by the manually outlined road and vehicle footprint. The map-registration residual is about 1.3 m at held-out controls.",
  "Wheel-patch increments are experimental apparent image-plane rotation after cabin-display correction. The rim plane, steering ratio and full-turn unwrapping remain unresolved. The wheel overlay shows actual tracked pixels.",
];
function inspect(name) {
  const index = metricNames.indexOf(name);
  const metric = latestMetrics[index];
  if (!metric || !reconstruction) return;
  const solution = currentSolution();
  const state = stateAt(clock());
  byId("inspector-title").textContent = name;
  byId("inspector-kind").textContent = metric.kind;
  const peers = comparisonStates(clock());
  const numericRange = (key, scale = 1, digits = 0) => {
    const values = peers.map((row) => row[key]).filter((value) => value !== null).map((value) => value * scale);
    return values.length ? Math.min(...values).toFixed(digits) + " to " + Math.max(...values).toFixed(digits) : "Undefined";
  };
  const uncertainties = [
    numericRange("speed", MPH) + " mph across alternatives",
    rangeText("heading",clock(),RADIANS_TO_DEGREES,state.heading) + "° unwrapped local heading",
    numericRange("direction", RADIANS_TO_DEGREES) + "° relative to east; circular direction",
    numericRange("yaw",RADIANS_TO_DEGREES) + "°/s",
    numericRange("beta",RADIANS_TO_DEGREES) + "° signed sideslip",
    numericRange("bodyLateral",1/9.80665,1) + " g",
    "East " + numericRange("x") + " m; north " + numericRange("y") + " m, plus approximately 1.3 m map-registration sensitivity",
    "Uncalibrated apparent wheel-patch rotation. No validated angular error interval is available.",
  ];
  const entries = [
    ["Current value", metric.value + " · " + metric.range],
    ["Method", view === "observed" ? "Actual image-space output from the original CV data. Physical model outputs are hidden in Observed mode. Tracking validity is limited to the documented tests." : methods[index]],
    ["Assumptions", "Onset " + solution.config.onset.toFixed(1) + " s; friction μ " + solution.config.mu.toFixed(2) +
      "; settled exit-speed prior " + solution.config.exitSpeed + " m/s; payload " + solution.config.payload + " kg; peak slip prior " + solution.config.slipTargetDeg + "°; rotation hypothesis " + solution.config.spin + ". These are Assumed."],
    ["Uncertainty", uncertainties[index] + ". Ranges are a model-alternative plausibility envelope with map error, without a statistical confidence claim. Body rotation and route timing are strongly assumption dependent."],
    ["Video support", evidenceAt(clock()).status + (state.kind === "Simulated" ? " The 7.4–10.6 s trajectory is a Simulated bridge." : "")],
    ["Provenance", "Factory dimensions and mass are published reference observations. Weak image-activity and early quiet-wheel priors aid timing and initial orientation stability. Their weight is editable and their metric calibration is unresolved. The original CV detections and failed validations remain available in Original CV diagnostics. No calibrated video-to-ground metric pose residual is available."],
  ];
  if (index === 1) entries.splice(3, 0, ["Heading alternatives", rangeText("heading", clock(), RADIANS_TO_DEGREES, state.heading) + "° in the local east/north convention, unwrapped near this solution"]);
  const details = byId("inspector-details");
  details.replaceChildren();
  for (const [term, value] of entries) {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = value;
    details.append(dt, dd);
  }
  byId("inspector").showModal();
}

function drawMap(time) {
  if (!reconstruction) return;
  byId("map-animation").style.display = view === "observed" || !sourceMatches ? "none" : "";
  if (view === "observed" || !sourceMatches) return;
  const state = stateAt(time);
  const position = mapPoint([state.x, state.y]);
  byId("pose").setAttribute("transform", "translate(" + position.join(" ") + ")");
  const forward = mapPoint([state.x + Math.cos(state.heading), state.y + Math.sin(state.heading)]);
  const left = mapPoint([state.x - Math.sin(state.heading), state.y + Math.cos(state.heading)]);
  const a = forward[0] - position[0], b = forward[1] - position[1];
  const c = left[0] - position[0], d = left[1] - position[1];
  byId("heading").setAttribute("transform", "matrix(" + [a,b,c,d,0,0].join(" ") + ")");
  const velocityLength = Math.max(3, Math.min(10, state.speed * .7));
  const endpoint = mapPoint([state.x + Math.cos(state.direction) * velocityLength, state.y + Math.sin(state.direction) * velocityLength]);
  const velocity = byId("velocity");
  velocity.setAttribute("x2", endpoint[0] - position[0]);
  velocity.setAttribute("y2", endpoint[1] - position[1]);
  velocity.style.display = state.speed > .5 ? "" : "none";
  const headingAngle = Math.atan2(b, a);
  const travelAngle = Math.atan2(endpoint[1] - position[1], endpoint[0] - position[0]);
  const delta = wrap(travelAngle - headingAngle);
  const radius = 48;
  const start = [Math.cos(headingAngle) * radius, Math.sin(headingAngle) * radius];
  const end = [Math.cos(travelAngle) * radius, Math.sin(travelAngle) * radius];
  byId("slip-arc").setAttribute("d", state.beta === null ? "" :
    "M" + start.join(" ") + " A48 48 0 0 " + (delta >= 0 ? 1 : 0) + " " + end.join(" "));
  const points = currentSolution().states.filter((row) => row.t <= time).map((row) => mapPoint([row.x, row.y]));
  byId("trail").setAttribute("d", pathString(points));
  const comparison = comparisonStates(time);
  const radiusM = Math.max(...comparison.map((row) => Math.hypot(row.x-state.x, row.y-state.y))) + reconstruction.input.mapErrorM;
  const ring = Array.from({length:49}, (_, index) => {
    const angle = index / 48 * Math.PI * 2;
    return mapPoint([state.x + radiusM * Math.cos(angle), state.y + radiusM * Math.sin(angle)]);
  });
  byId("uncertainty-envelope").setAttribute("d", pathString(ring) + "Z");
  byId("map-kind").textContent = kindAt(state) + (state.kind === "Simulated" ? " · occlusion bridge" : " · assumption-led");
  for (const id of ["speed-cursor", "yaw-cursor"]) {
    const cursor = byId(id);
    if (cursor) {
      const x = 42 + time / duration * 444;
      cursor.setAttribute("x1", x);
      cursor.setAttribute("x2", x);
    }
  }
}

function drawOverlay(time) {
  const visible = mode !== "none" && sourceMatches;
  overlay.toggleAttribute("hidden", !visible);
  byId("overlay-label").hidden = !visible;
  overlay.setAttribute("viewBox", "0 0 540 960");
  if (!visible || !observations) {
    overlay.replaceChildren();
    byId("overlay-note").textContent = "Original footage · overlay off";
    return;
  }
  const row = evidenceAt(time);
  const initialFrame = row.frame === 1;
  const tracks = initialFrame ? observations.frames[1].exterior : row.exterior;
  overlay.replaceChildren();
  const scene = ["exterior", "flow", "combined"].includes(mode);
  const wheel = ["steering", "combined"].includes(mode);
  const definitions = svgElement("defs", {});
  for (const [name, color] of [["inlier", "#00e1ff"], ["outlier", "#ff765c"]]) {
    const marker = svgElement("marker", {
      id: "cv-flow-" + name, viewBox: "0 0 8 8", refX: 7, refY: 4,
      markerWidth: 4, markerHeight: 4, orient: "auto",
    });
    marker.append(svgElement("path", {
      d: "M0 0 8 4 0 8 2 4Z", fill: color, stroke: "#07151e", "stroke-width": .8,
    }));
    definitions.append(marker);
  }
  overlay.append(definitions);
  if (scene) {
    for (const track of tracks) {
      const color = track.inlier ? "#00e1ff" : "#ff765c";
      const point = initialFrame ? track.from : track.to;
      if (!initialFrame && (mode === "flow" || mode === "combined")) {
        // Enlarge displacement for legibility while keeping the arrow tip
        // anchored to the actual current-frame detection.
        const tail = point.map((value, axis) => value - 3 * (track.to[axis] - track.from[axis]));
        const path = "M" + tail.join(" ") + "L" + point.join(" ");
        overlay.append(svgElement("path", {
          d: path, stroke: "#07151e", "stroke-width": 5.5,
          "stroke-linecap": "round", fill: "none",
        }));
        overlay.append(svgElement("path", {
          d: path, stroke: color, "stroke-width": 2.5, fill: "none",
          "marker-end": "url(#cv-flow-" + (track.inlier ? "inlier" : "outlier") + ")",
        }));
      }
      overlay.append(svgElement("circle", {
        cx: point[0], cy: point[1], r: 4.2, fill: color,
        stroke: "#07151e", "stroke-width": 1.8,
      }));
    }
  }
  if (wheel && row.wheel) {
    for (const point of row.wheel.points) overlay.append(svgElement("circle", {
      cx: point[0], cy: point[1], r: 4.5, fill: "#ffdc42",
      stroke: "#201706", "stroke-width": 2,
    }));
  }
  const flow = !initialFrame && ["flow", "combined"].includes(mode);
  byId("overlay-label").textContent = flow ? "Observed · flow vectors ×3" : "Observed · image-space points";
  const available = scene && tracks.length > 0 || wheel && row.wheel;
  byId("overlay-note").textContent = available
    ? "Cyan scene · gold wheel · red outliers" + (flow ? " · vectors ×3" : "")
    : "Unavailable · " + row.status;
}

function graph(id, key, scale) {
  const svg = byId(id);
  svg.replaceChildren();
  if (view === "observed") {
    const note = svgElement("text", {x:42,y:70,class:"trace-tick"});
    note.textContent = "Physical reconstruction is hidden in Observed mode.";
    svg.append(note);
    return;
  }
  const states = currentSolution().states;
  const alternatives = reconstruction.solutions.filter((solution) => solution.summary.feasible);
  if (view === "whatif") alternatives.push(working);
  const lows = states.map((_, index) => Math.min(...alternatives.map((solution) => solution.states[index][key] * scale)));
  const highs = states.map((_, index) => Math.max(...alternatives.map((solution) => solution.states[index][key] * scale)));
  const lower = Math.min(0, ...lows), upper = Math.max(...highs,1);
  const pad = (upper-lower) * .08;
  const yMin = lower-pad, yMax = upper+pad;
  const x = (time) => 42 + time / duration * 444;
  const y = (value) => 142 - (value-yMin) / (yMax-yMin) * 126;
  const band = states.map((state,index) => [x(state.t), y(highs[index])])
    .concat([...states].reverse().map((state, index) => [x(state.t),y(lows[states.length-1-index])]));
  svg.append(svgElement("rect", {x:x(7.4),y:10,width:x(10.6)-x(7.4),height:140,class:"trace-bridge"}));
  for (let tick = 0; tick < 4; tick++) {
    const value = lower + tick / 3 * (upper-lower);
    svg.append(svgElement("line", {x1:42,x2:486,y1:y(value),y2:y(value),class:"trace-gridline"}));
    const label = svgElement("text",{x:35,y:y(value)+3,"text-anchor":"end",class:"trace-tick"});
    label.textContent = Math.round(value);
    svg.append(label);
  }
  for (const time of [0,5,10,14.97]) {
    const label = svgElement("text",{x:x(time),y:163,"text-anchor":"middle",class:"trace-tick"});
    label.textContent = time === 14.97 ? "15 s" : time + " s";
    svg.append(label);
  }
  svg.append(svgElement("path",{d:pathString(band)+"Z",class:"trace-band"}));
  svg.append(svgElement("path",{d:pathString(states.map((state) => [x(state.t),y(state[key]*scale)])),class:"trace-line"}));
  svg.append(svgElement("line",{id:key === "speed" ? "speed-cursor" : "yaw-cursor",x1:42,x2:42,y1:10,y2:147,class:"trace-cursor"}));
}

function refreshSolution() {
  if (!reconstruction) return;
  const solution = currentSolution();
  const points = solution.states.map((state) => mapPoint([state.x,state.y]));
  byId("route").setAttribute("d",pathString(points));
  byId("route-outline").setAttribute("d",pathString(points));
  byId("bridge-route").setAttribute("d",pathString(solution.states.filter((state) => state.t>=7.4 && state.t<=10.6).map((state) => mapPoint([state.x,state.y]))));
  byId("road-envelope").setAttribute("d",pathString(reconstruction.input.road.map(mapPoint))+"Z");
  byId("road-envelope").toggleAttribute("hidden", view !== "whatif");
  byId("road-envelope").style.display = view === "whatif" ? "" : "none";
  byId("anchors").toggleAttribute("hidden", view !== "whatif");
  byId("anchors").style.display = view === "whatif" ? "" : "none";
  drawAnchors();
  graph("speed-graph","speed",MPH);
  graph("yaw-graph","yaw",RADIANS_TO_DEGREES);
  const summary = solution.summary;
  byId("model-summary").textContent = view === "observed"
    ? "Observed mode · actual image-space tracks only. See Original CV diagnostics for the preserved validation failures."
    : (summary.feasible ? "Passes assumed aggregate limits" : "Outside assumed aggregate limits") +
      " · peak speed ≈" + Math.round(summary.maxSpeedMps*MPH) + " mph" +
      " · peak acceleration " + summary.maxAccelerationG.toFixed(2) + " g" +
      " · minimum footprint clearance " + summary.minClearanceM.toFixed(1) + " m" +
      " · sketch deviation RMS " + summary.pathRmsM.toFixed(1) + " m" +
      " · total body rotation ≈" + Math.round(summary.netRotationDeg) + "°";
  byId("model-status").dataset.warning = String(!summary.feasible);
  byId("model-status").textContent = view === "observed" ? "Observed · image-space evidence" :
    view === "whatif" ? "Simulated · editable assumptions" : "Estimated · conditional reconstruction";
  byId("model-context").textContent = view === "observed"
    ? "Actual CV candidate detections and validity tests. The map shows the source reference. Physical vehicle outputs are hidden."
    : "Opening hold through 4.5 s and a steady exit-speed prior follow the playback review. The route sketch, timing, grip and body rotation are soft assumptions. Bands show the spread across plausible alternatives. The amber path section bridges the excluded 7.4–10.6 s interval. CV contributes weak timing cues, with camera-motion contamination. Ground pose remains assumption-led.";
  render();
}

function render(time = clock()) {
  const bounded = Math.min(duration,Math.max(0,time));
  scrubber.value = bounded;
  byId("time").value = formatTime(bounded);
  scrubber.setAttribute("aria-valuetext",formatTime(bounded));
  shownFrame = observations ? evidenceAt(bounded).frame : null;
  byId("frame").textContent = shownFrame === null ? "Frame —" : "Frame " + String(shownFrame).padStart(3,"0");
  drawMap(bounded);
  drawOverlay(bounded);
  updateMetrics(bounded);
}

function renderTicks() {
  scrubber.max = duration;
  byId("ticks").replaceChildren(...Array.from({length: 6}, (_, index) => {
    const tick = document.createElement("span");
    tick.textContent = index === 5 ? formatTime(duration) : `${Math.round(duration * index / 5)}s`;
    return tick;
  }));
}

function seek(time) {
  const target = Math.min(duration, Math.max(0, time));
  if (mediaReady) video.currentTime = target;
  else demoTime = target;
  render(target);
}

function updatePlayButton() {
  const playing = mediaReady ? !video.paused && !video.ended : demoPlaying;
  play.textContent = playing ? "❚❚" : "▶";
  play.setAttribute("aria-label", playing ? "Pause" : "Play");
}

function schedule() {
  if (animation !== null) return;
  if (mediaReady) {
    if (video.paused || video.ended) return;
    if ("requestVideoFrameCallback" in video) {
      animation = video.requestVideoFrameCallback((_now, frame) => {
        animation = null;
        if (!video.seeking) render(frame.mediaTime);
        schedule();
      });
      return;
    }
  } else if (!demoPlaying) return;

  animation = requestAnimationFrame((now) => {
    animation = null;
    if (!mediaReady && demoPlaying) {
      demoTime = Math.min(duration, demoTime + (now - previousTick) / 1000 * Number(rate.value));
      previousTick = now;
      if (demoTime >= duration) demoPlaying = false;
    }
    render();
    updatePlayButton();
    schedule();
  });
}

function cancelAnimation() {
  if (animation === null) return;
  if (mediaReady && "cancelVideoFrameCallback" in video) video.cancelVideoFrameCallback(animation);
  else cancelAnimationFrame(animation);
  animation = null;
}

async function togglePlay() {
  if (mediaReady) {
    if (!video.paused) {
      video.pause();
      return;
    }
    if (video.ended) seek(0);
    try {
      await video.play();
    } catch {
      mediaStatus.hidden = false;
      mediaStatus.textContent = "Playback could not start. Try opening the local video again.";
    }
    return;
  }
  demoPlaying = !demoPlaying;
  if (demoPlaying && demoTime >= duration) seek(0);
  previousTick = performance.now();
  if (demoPlaying) schedule();
  else cancelAnimation();
  updatePlayButton();
}

function setSource(url, fps) {
  sourceMatches = false;
  cancelAnimation();
  video.pause();
  source = url;
  mediaReady = false;
  demoPlaying = false;
  demoTime = 0;
  duration = 15;
  nominalFps = fps;
  mediaStatus.hidden = false;
  mediaStatus.textContent = "Loading local footage…";
  video.src = url;
  renderTicks();
  render();
  updatePlayButton();
}

video.addEventListener("loadedmetadata", () => {
  if (!Number.isFinite(video.duration) || video.duration <= 0) return;
  cancelAnimation();
  mediaReady = true;
  duration = video.duration;
  sourceMatches = nominalFps === 30 && Math.abs(duration - 14.97) < .1 && ((video.videoWidth === 2160 && video.videoHeight === 3840) || (video.videoWidth === 1080 && video.videoHeight === 1920));
  if (!sourceMatches) byId("model-status").textContent = "Unavailable · this source differs from the analysed clip";
  portrait.style.setProperty("--video-ratio", `${video.videoWidth} / ${video.videoHeight}`);
  video.playbackRate = Number(rate.value);
  renderTicks();
  render();
});
video.addEventListener("loadeddata", () => { mediaStatus.hidden = true; });
video.addEventListener("playing", () => {
  mediaStatus.hidden = true;
  updatePlayButton();
  schedule();
});
video.addEventListener("waiting", () => {
  if (!mediaReady || video.paused || video.seeking) return;
  mediaStatus.hidden = false;
  mediaStatus.textContent = "Buffering footage…";
});
video.addEventListener("seeked", () => {
  if (video.readyState >= 2) mediaStatus.hidden = true;
  render();
});
for (const event of ["pause", "ended"]) {
  video.addEventListener(event, () => {
    if (!mediaReady) return;
    cancelAnimation();
    render();
    updatePlayButton();
  });
}
video.addEventListener("error", () => {
  cancelAnimation();
  mediaReady = false;
  nominalFps = 0;
  duration = 15;
  mediaStatus.hidden = false;
  mediaStatus.textContent = source.startsWith("blob:")
    ? "This video could not be played. Choose a supported local file. Demo timeline available."
    : "Original footage unavailable. Open the local video to use it as the clock.";
  renderTicks();
  render();
  updatePlayButton();
});

byId("file").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (fileUrl) URL.revokeObjectURL(fileUrl);
  fileUrl = URL.createObjectURL(file);
  setSource(fileUrl, file.name.toLowerCase() === "img_1375.mov" ? 30 : 0);
  event.target.value = "";
});
for (const button of modeButtons) {
  button.addEventListener("click", () => {
    mode = button.dataset.overlay;
    for (const option of modeButtons) option.setAttribute("aria-pressed", String(option === button));
    drawOverlay(clock());
  });
}
play.addEventListener("click", togglePlay);
rate.addEventListener("change", () => { video.playbackRate = Number(rate.value); });
scrubber.addEventListener("input", () => seek(Number(scrubber.value)));
const step = (direction) => {
  if (mediaReady) video.pause();
  demoPlaying = false;
  cancelAnimation();
  seek(clock() + direction / (nominalFps || 30));
  updatePlayButton();
};
byId("back").addEventListener("click", () => step(-1));
byId("next").addEventListener("click", () => step(1));
byId("audio").addEventListener("click", (event) => {
  video.muted = !video.muted;
  event.currentTarget.setAttribute("aria-pressed", String(video.muted));
  event.currentTarget.setAttribute("aria-label", video.muted ? "Unmute audio" : "Mute audio");
  event.currentTarget.textContent = video.muted ? "Muted" : "Audio";
});
document.addEventListener("keydown", (event) => {
  if (byId("inspector").open || event.altKey || event.ctrlKey || event.metaKey || !event.target.matches("body, main")) return;
  if (event.code === "Space") {
    event.preventDefault();
    if (!event.repeat) togglePlay();
  } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    step(event.key === "ArrowLeft" ? -1 : 1);
  }
});


const controlDefinitions = [
  ["onset","Motion onset",4.5,5.8,.1,"s"],
  ["settle","Heading recovery",10.5,13,.1,"s"],
  ["exitSpeed","Settled exit speed",2,8,.5,"m/s"],
  ["mu","Friction μ",.45,1.1,.05,""],
  ["payload","Payload",0,300,25,"kg"],
  ["visualWeight","Image activity weight",0,.4,.05,"×"],
  ["efficiency","Power efficiency",.7,.95,.05,"×"],
  ["loopScale","Loop scale",.7,1.3,.05,"×"],
  ["sketchWeight","Sketch weight",.4,2,.1,"×"],
  ["headingBias","Heading bias",-35,35,5,"°"],
  ["slipTargetDeg","Peak slip prior",0,100,5,"°"],
  ["slipWeight","Slip prior weight",0,2,.1,"×"],
  ["yawInertiaFactor","Yaw inertia factor",.8,1.6,.1,"×"],
  ["entryX","Entry east offset",-6,6,.5,"m"],
  ["entryY","Entry north offset",-6,6,.5,"m"],
  ["loopX","Loop east offset",-6,6,.5,"m"],
  ["loopY","Loop north offset",-6,6,.5,"m"],
  ["exitX","Exit east offset",-6,6,.5,"m"],
  ["exitY","Exit north offset",-6,6,.5,"m"],
];
let refitTimer;
const controlInputs = new Map();
function recordEdit(reason) {
  editCount++;
  byId("edit-history").textContent = editCount + " local assumption edits";
  try {
    const history = JSON.parse(localStorage.getItem("rcf-hybrid-edits") || "[]");
    history.push({at:new Date().toISOString(),reason,solution:selected.name,parameters:{...config}});
    localStorage.setItem("rcf-hybrid-edits",JSON.stringify(history.slice(-100)));
  } catch {
    byId("edit-history").textContent += " · session history";
  }
}
function syncControls() {
  if (!config) return;
  for (const [key,, , , ,unit] of controlDefinitions) {
    const {input,output} = controlInputs.get(key);
    input.value = config[key];
    output.textContent = Number(config[key]).toFixed(key === "mu" ? 2 : 1) + " " + unit;
  }
  byId("spin-assumption").value = config.spin;
}
for (const [key,label,min,max,step,unit] of controlDefinitions) {
  const wrapper = document.createElement("label");
  const title = document.createElement("span");
  const name = document.createElement("span");
  name.textContent = label;
  const output = document.createElement("output");
  const input = document.createElement("input");
  input.type = "range";
  input.min = min; input.max = max; input.step = step;
  input.dataset.assumption = key;
  input.setAttribute("aria-label",label+" (Assumed)");
  title.append(name,output);
  wrapper.append(title,input);
  byId("assumption-controls").append(wrapper);
  controlInputs.set(key,{input,output});
  input.addEventListener("input",() => {
    config[key] = Number(input.value);
    output.textContent = config[key].toFixed(key === "mu" ? 2 : 1) + " " + unit;
    drawAnchors();
    queueRefit("Changed "+label);
  });
}
const spinLabel = document.createElement("label");
spinLabel.textContent = "Assumed body rotation";
const spinSelect = document.createElement("select");
spinSelect.id = "spin-assumption";
for (const [value,label] of [[-1,"Clockwise turn"],[0,"Partial turn"],[1,"Counterclockwise turn"]]) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  spinSelect.append(option);
}
spinLabel.append(spinSelect);
byId("assumption-controls").append(spinLabel);
spinSelect.addEventListener("change",() => {
  config.spin = Number(spinSelect.value);
  queueRefit("Changed body-rotation hypothesis");
});
function queueRefit(reason) {
  clearTimeout(refitTimer);
  byId("model-status").textContent = "Assumed edits · preparing refit";
  refitTimer = setTimeout(() => runRefit(reason),350);
}
async function runRefit(reason = "Refit assumptions") {
  clearTimeout(refitTimer);
  if (!reconstruction || view !== "whatif") return;
  const generation = ++fitGeneration;
  byId("refit").disabled = true;
  byId("model-status").textContent = "Fitting trajectory…";
  const parameters = {...config};
  try {
    const result = await fit(reconstruction.input,parameters,{
      iterations:32,
      yield:async () => {
        await new Promise((resolve) => setTimeout(resolve,0));
        if (generation !== fitGeneration) throw new Error("Superseded fit");
      },
    });
    if (generation !== fitGeneration) return;
    working = {...result,name:"Custom What-if"};
    recordEdit(reason);
    refreshSolution();
  } catch (error) {
    if (generation === fitGeneration) byId("model-status").textContent = "Refit failed. The preceding solution is still available.";
  } finally {
    if (generation === fitGeneration) byId("refit").disabled = false;
  }
}
byId("refit").addEventListener("click",() => runRefit());
byId("reset-model").addEventListener("click",() => {
  fitGeneration++;
  clearTimeout(refitTimer);
  byId("refit").disabled = false;
  config = {...selected.config};
  working = selected;
  syncControls();
  recordEdit("Reset to selected solution");
  refreshSolution();
});
byId("export-model").addEventListener("click",() => {
  const blob = new Blob([JSON.stringify({
    kind:"Simulated",scenario:working,provenance:reconstruction.input.provenance,
    uncertainty:reconstruction.uncertainty,
  },null,2)],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "rcf-what-if.json";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
});

function anchorPositions() {
  const prior = targets(reconstruction.input,config);
  const middleTime = config.onset + (duration-config.onset)*.5;
  const middleIndex = reconstruction.input.times.reduce((best,time,index) =>
    Math.abs(time-middleTime) < Math.abs(reconstruction.input.times[best]-middleTime) ? index : best,0);
  return [
    {name:"Entry",key:"entry",point:prior[0]},
    {name:"Loop",key:"loop",point:prior[middleIndex]},
    {name:"Exit",key:"exit",point:prior.at(-1)},
  ];
}
function drawAnchors() {
  if (!reconstruction || !config) return;
  const group = byId("anchors");
  group.replaceChildren();
  for (const anchor of anchorPositions()) {
    const position = mapPoint(anchor.point);
    const handle = svgElement("g",{class:"anchor-handle","data-anchor":anchor.key,tabindex:"0",role:"button","aria-label":anchor.name+" assumed anchor. Arrow keys shift by half a metre."});
    handle.append(svgElement("circle",{cx:position[0],cy:position[1],r:18}));
    const label = svgElement("text",{x:position[0]+23,y:position[1]-14});
    label.textContent = anchor.name;
    handle.append(label);
    handle.addEventListener("keydown",(event) => {
      const delta = {ArrowLeft:[-.5,0],ArrowRight:[.5,0],ArrowUp:[0,.5],ArrowDown:[0,-.5]}[event.key];
      if (!delta) return;
      event.preventDefault();
      config[anchor.key+"X"] = Math.max(-6,Math.min(6,config[anchor.key+"X"]+delta[0]));
      config[anchor.key+"Y"] = Math.max(-6,Math.min(6,config[anchor.key+"Y"]+delta[1]));
      syncControls();
      queueRefit("Keyboard edit to "+anchor.name);
    });
    group.append(handle);
  }
}
function inverse(matrix) {
  const [[a,b,c],[d,e,f],[g,h,i]] = matrix;
  const determinant = a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g);
  return [
    [(e*i-f*h)/determinant,(c*h-b*i)/determinant,(b*f-c*e)/determinant],
    [(f*g-d*i)/determinant,(a*i-c*g)/determinant,(c*d-a*f)/determinant],
    [(d*h-e*g)/determinant,(b*g-a*h)/determinant,(a*e-b*d)/determinant],
  ];
}
let dragging;
const map = byId("map");
function pointerWorld(event) {
  const point = new DOMPoint(event.clientX,event.clientY).matrixTransform(map.getScreenCTM().inverse());
  return project([point.x,point.y],inverse(reconstruction.input.worldToApple));
}
map.addEventListener("pointerdown",(event) => {
  const handle = event.target.closest("[data-anchor]");
  if (view !== "whatif" || !handle) return;
  event.preventDefault();
  const key = handle.dataset.anchor;
  dragging = {key,start:pointerWorld(event),x:config[key+"X"],y:config[key+"Y"]};
  map.setPointerCapture(event.pointerId);
});
map.addEventListener("pointermove",(event) => {
  if (!dragging) return;
  const position = pointerWorld(event);
  config[dragging.key+"X"] = Math.max(-6,Math.min(6,dragging.x+position[0]-dragging.start[0]));
  config[dragging.key+"Y"] = Math.max(-6,Math.min(6,dragging.y+position[1]-dragging.start[1]));
  syncControls();
  drawAnchors();
});
for (const eventName of ["pointerup","pointercancel"]) {
  map.addEventListener(eventName,(event) => {
    if (!dragging) return;
    const name = dragging.key;
    dragging = null;
    if (map.hasPointerCapture(event.pointerId)) map.releasePointerCapture(event.pointerId);
    queueRefit("Dragged "+name+" anchor");
  });
}
for (const button of document.querySelectorAll("[data-view]")) {
  button.addEventListener("click",() => {
    view = button.dataset.view;
    for (const candidate of document.querySelectorAll("[data-view]")) candidate.setAttribute("aria-pressed",String(candidate === button));
    byId("whatif-panel").hidden = view !== "whatif";
    byId("solution").disabled = view === "observed";
    refreshSolution();
  });
}
byId("solution").addEventListener("change",() => {
  fitGeneration++;
  clearTimeout(refitTimer);
  selected = reconstruction.solutions[Number(byId("solution").value)];
  working = selected;
  config = {...selected.config};
  byId("refit").disabled = false;
  syncControls();
  refreshSolution();
});

byId("map-image").addEventListener("load",() => {
  byId("map-status").hidden = true;
  byId("map-attribution").hidden = false;
  byId("map-animation").removeAttribute("visibility");
});
byId("map-image").addEventListener("error",() => {
  byId("map-status").textContent = "Map reference unavailable.";
});
{
  byId("map-image").setAttribute("href","reference-map.webp");
  setSource("source-video.mp4",30);
}
Promise.all([
  fetch("hybrid-reconstruction.json").then((response) => {if (!response.ok) throw new Error(); return response.json();}),
  fetch("observations.json").then((response) => {if (!response.ok) throw new Error(); return response.json();}),
]).then(([model,evidence]) => {
  reconstruction = model;
  observations = evidence;
  selected = reconstruction.solutions.find((solution) => solution.name === reconstruction.bestName);
  working = selected;
  config = {...selected.config};
  reconstruction.solutions.forEach((solution,index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = solution.name + (solution.summary.feasible ? "" : " · outside limits");
    byId("solution").append(option);
  });
  byId("solution").value = reconstruction.solutions.indexOf(selected);
  syncControls();
  refreshSolution();
  window.rcfHybrid = {get solution(){return currentSolution();},get mode(){return view;},get data(){return reconstruction;}};
}).catch(() => {
  byId("model-status").textContent = "Reconstruction data unavailable. Check the local analysis output.";
});
