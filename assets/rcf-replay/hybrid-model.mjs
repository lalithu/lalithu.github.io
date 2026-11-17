/* Shared offline/browser optimizer. State is a cubic spline in x, y and yaw. */
const G = 9.80665;
const TAU = 2 * Math.PI;
export const wrap = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
const clamp = (value, lower, upper) => Math.max(lower, Math.min(upper, value));
const smoothstep = (value) => {
  const u = clamp(value, 0, 1);
  return u * u * (3 - 2 * u);
};
const dot = (left, right) => left.reduce((sum, value, index) => sum + value * right[index], 0);

export function project(point, transform) {
  const [x, y] = point;
  const denominator = transform[2][0] * x + transform[2][1] * y + transform[2][2];
  return [
    (transform[0][0] * x + transform[0][1] * y + transform[0][2]) / denominator,
    (transform[1][0] * x + transform[1][1] * y + transform[1][2]) / denominator,
  ];
}

function routePoint(input, fraction) {
  const positions = input.route.progress;
  let upper = 1;
  while (upper < positions.length - 1 && positions[upper] < fraction) upper++;
  const weight = clamp((fraction - positions[upper - 1]) / (positions[upper] - positions[upper - 1]), 0, 1);
  return input.route.xy[upper - 1].map((value, axis) => value + weight * (input.route.xy[upper][axis] - value));
}

export function targets(input, config) {
  const center = routePoint(input, .5);
  return input.times.map((time) => {
    const phase = clamp((time - config.onset) / (input.duration - config.onset), 0, 1);
    const progress = phase + .45 * phase * (1 - phase);
    const position = routePoint(input, progress);
    const entryWeight = Math.max(0, 1 - progress * 3);
    const exitWeight = Math.max(0, (progress - .7) / .3);
    const loopWeight = Math.max(0, 1 - entryWeight - exitWeight);
    return position.map((value, axis) => {
      const suffix = axis === 0 ? "X" : "Y";
      return value + loopWeight * (value - center[axis]) * (config.loopScale - 1)
        + entryWeight * config["entry" + suffix]
        + loopWeight * config["loop" + suffix]
        + exitWeight * config["exit" + suffix];
    });
  });
}

export function roadClearance(point, polygon) {
  let inside = false;
  let distance = Infinity;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const a = polygon[previous];
    const b = polygon[index];
    if ((a[1] > point[1]) !== (b[1] > point[1]) &&
        point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const weight = clamp(((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / (dx * dx + dy * dy), 0, 1);
    distance = Math.min(distance, Math.hypot(point[0] - a[0] - weight * dx, point[1] - a[1] - weight * dy));
  }
  return inside ? distance : -distance;
}

function linearSolve(matrix, right) {
  const size = right.length;
  const a = matrix.map((row, index) => [...row, right[index]]);
  for (let column = 0; column < size; column++) {
    let pivot = column;
    for (let row = column + 1; row < size; row++) {
      if (Math.abs(a[row][column]) > Math.abs(a[pivot][column])) pivot = row;
    }
    [a[column], a[pivot]] = [a[pivot], a[column]];
    if (Math.abs(a[column][column]) < 1e-12) throw new Error("Singular trajectory system");
    for (let row = column + 1; row < size; row++) {
      const factor = a[row][column] / a[column][column];
      for (let item = column; item <= size; item++) a[row][item] -= factor * a[column][item];
    }
  }
  const result = Array(size).fill(0);
  for (let row = size - 1; row >= 0; row--) {
    let value = a[row][size];
    for (let column = row + 1; column < size; column++) value -= a[row][column] * result[column];
    result[row] = value / a[row][row];
  }
  return result;
}

function initialControls(input, target, headings) {
  const n = input.n;
  const basis = input.basis[0];
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  for (const row of basis) {
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) matrix[i][j] += row[i] * row[j];
  }
  for (let i = 0; i < n; i++) matrix[i][i] += 1e-5;
  return [target.map((p) => p[0]), target.map((p) => p[1]), headings].flatMap((values) => {
    const right = Array(n).fill(0);
    for (let row = 0; row < basis.length; row++) {
      for (let i = 0; i < n; i++) right[i] += basis[row][i] * values[row];
    }
    return linearSolve(matrix, right);
  });
}

export function evaluate(input, controls, dense = false, config = input.defaults) {
  const basis = dense ? input.denseBasis : input.basis;
  const times = dense ? input.denseTimes : input.times;
  const n = input.n;
  const coefficients = [controls.slice(0, n), controls.slice(n, 2 * n), controls.slice(2 * n)];
  const mass = input.vehicle.curbMassKg + config.payload;
  return times.map((time, index) => {
    const derivatives = basis.map((order) => coefficients.map((values) => dot(order[index], values)));
    const [[x, y, heading], [vx, vy, yaw], [ax, ay, yawAcceleration], [jx, jy, yawJerk]] = derivatives;
    const speed = Math.hypot(vx, vy);
    const direction = Math.atan2(vy, vx);
    const acceleration = Math.hypot(ax, ay);
    const bodyLateral = -Math.sin(heading) * ax + Math.cos(heading) * ay;
    const pathNormal = speed > .5 ? (vx * ay - vy * ax) / speed : null;
    const halfLength = input.vehicle.lengthM / 2;
    const halfWidth = input.vehicle.widthM / 2;
    const corners = [[1,1], [1,-1], [-1,1], [-1,-1]].map(([lengthSign, widthSign]) => [
      x + lengthSign * halfLength * Math.cos(heading) - widthSign * halfWidth * Math.sin(heading),
      y + lengthSign * halfLength * Math.sin(heading) + widthSign * halfWidth * Math.cos(heading),
    ]);
    return {
      t: time, x, y, heading, vx, vy, speed, direction, yaw, yawAcceleration,
      ax, ay, acceleration, bodyLateral, pathNormal, jx, jy, yawJerk,
      beta: speed > .5 ? wrap(direction - heading) : null,
      powerW: Math.max(0, mass * (vx * ax + vy * ay)),
      clearance: Math.min(...corners.map((point) => roadClearance(point, input.road))),
      kind: time >= input.bridge[0] && time <= input.bridge[1] ? "Simulated" : "Estimated",
    };
  });
}

function objective(input, config) {
  const target = targets(input, config);
  const start = target[1].map((_, axis) => input.route.xy[10][axis] - input.route.xy[0][axis]);
  const end = input.route.xy.at(-1).map((value, axis) => value - input.route.xy.at(-10)[axis]);
  const startHeading = Math.atan2(start[1], start[0]);
  const endHeading = Math.atan2(end[1], end[0]);
  const delta = wrap(endHeading - startHeading) + config.spin * TAU;
  const headings = input.times.map((time) =>
    startHeading + delta * smoothstep((time - config.onset) / (config.settle - config.onset))
    + config.headingBias * Math.PI / 180 * Math.sin(Math.PI * clamp((time - config.onset) / (input.duration - config.onset), 0, 1)));
  const mass = input.vehicle.curbMassKg + config.payload;
  const inertia = mass * (input.vehicle.lengthM ** 2 + input.vehicle.widthM ** 2) / 12 * config.yawInertiaFactor;
  const maxYawMoment = mass * config.mu * G * input.vehicle.wheelbaseM / 2;
  const maxPower = input.vehicle.powerHp * 745.7 * config.efficiency;
  const priorSigma = 3.5 / Math.sqrt(config.sketchWeight);

  function residuals(controls) {
    const states = evaluate(input, controls, false, config);
    const result = [(Math.abs(states.at(-1).heading - states[0].heading) - TAU) / (120 * Math.PI / 180)];
    for (let i = 0; i < states.length; i++) {
      const state = states[i];
      result.push((state.x - target[i][0]) / priorSigma, (state.y - target[i][1]) / priorSigma);
      result.push((state.heading - headings[i]) / 1.0);
      const slipPhase = clamp((state.t - config.onset) / (input.duration - config.onset), 0, 1);
      const slipPrior = -config.spin * config.slipTargetDeg * Math.PI / 180 * Math.sin(Math.PI * slipPhase) ** 2;
      result.push(state.beta === null ? 0 : config.slipWeight * wrap(state.beta - slipPrior) / .8);
      result.push(state.beta === null ? 0 : config.slipWeight * Math.max(0, Math.abs(state.beta) - 110 * Math.PI / 180) / .4);
      const activity = input.imageActivity[i];
      const modelActivity = state.speed / 12 + Math.abs(state.yaw) / 2;
      result.push(config.visualWeight * Math.sqrt(activity.weight) * (modelActivity - activity.value));
      result.push(config.visualWeight * activity.wheelQuiet * state.yaw / .5);
      result.push(state.jx / 12, state.jy / 12, state.yawJerk / 3);
      result.push(Math.max(0, state.acceleration - config.mu * G) / .08);
      result.push(Math.max(0, Math.abs(inertia * state.yawAcceleration) - maxYawMoment) / 1500);
      result.push(Math.max(0, state.powerW - maxPower) / 20000);
      result.push(Math.max(0, .3 - state.clearance) / .25);
      result.push(Math.max(0, state.speed - 18) / .5);
      if (state.t < config.onset - .6) {
        result.push(state.vx / .25, state.vy / .25, state.yaw / .1);
      }
      if (state.t >= 12) {
        const tangentialAcceleration = state.speed > .5 ? (state.vx * state.ax + state.vy * state.ay) / state.speed : 0;
        result.push((state.speed - config.exitSpeed) / .8);
        result.push(Math.max(0, tangentialAcceleration) / .08);
      }
      if (state.t > config.settle + 1) {
        result.push(wrap(state.direction - state.heading) / .3);
      }
    }
    return result;
  }
  return { target, headings, residuals };
}

export async function fit(input, supplied = {}, options = {}) {
  const config = { ...input.defaults, ...supplied };
  const { target, headings, residuals } = objective(input, config);
  let controls = options.initial ? [...options.initial] : initialControls(input, target, headings);
  let residual = residuals(controls);
  let loss = dot(residual, residual);
  let damping = .03;
  let accepted = 0;
  const limit = options.iterations || 28;
  for (let iteration = 0; iteration < limit; iteration++) {
    const n = controls.length;
    const jacobian = [];
    for (let column = 0; column < n; column++) {
      const delta = column < 2 * input.n ? .002 : .0002;
      const perturbed = [...controls];
      perturbed[column] += delta;
      const next = residuals(perturbed);
      jacobian.push(next.map((value, row) => (value - residual[row]) / delta));
    }
    const normal = Array.from({ length: n }, () => Array(n).fill(0));
    const gradient = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      gradient[i] = -dot(jacobian[i], residual);
      for (let j = 0; j <= i; j++) normal[i][j] = normal[j][i] = dot(jacobian[i], jacobian[j]);
      normal[i][i] += damping * (1 + normal[i][i]);
    }
    const step = linearSolve(normal, gradient);
    const candidate = controls.map((value, index) => value + step[index]);
    const candidateResidual = residuals(candidate);
    const candidateLoss = dot(candidateResidual, candidateResidual);
    if (candidateLoss < loss) {
      const improvement = loss - candidateLoss;
      controls = candidate;
      residual = candidateResidual;
      loss = candidateLoss;
      damping = Math.max(1e-6, damping * .45);
      accepted++;
      if (improvement < .0001 * (1 + loss)) break;
    } else {
      damping = Math.min(1e6, damping * 5);
    }
    if (options.yield) await options.yield(iteration);
  }
  const states = evaluate(input, controls, true, config);
  const mass = input.vehicle.curbMassKg + config.payload;
  const inertia = mass * (input.vehicle.lengthM ** 2 + input.vehicle.widthM ** 2) / 12 * config.yawInertiaFactor;
  const yawMomentLimit = mass * config.mu * G * input.vehicle.wheelbaseM / 2;
  const summary = {
    loss, acceptedSteps: accepted,
    pathRmsM: Math.sqrt(evaluate(input, controls, false, config).reduce((sum, state, index) =>
      sum + (state.x - target[index][0]) ** 2 + (state.y - target[index][1]) ** 2, 0) / target.length),
    maxSpeedMps: Math.max(...states.map((state) => state.speed)),
    maxAccelerationG: Math.max(...states.map((state) => state.acceleration)) / G,
    minClearanceM: Math.min(...states.map((state) => state.clearance)),
    maxYawDegS: Math.max(...states.map((state) => Math.abs(state.yaw))) * 180 / Math.PI,
    netRotationDeg: (states.at(-1).heading - states[0].heading) * 180 / Math.PI,
    maxYawMomentUtilization: Math.max(...states.map((state) => Math.abs(inertia * state.yawAcceleration))) / yawMomentLimit,
    maxPowerKw: Math.max(...states.map((state) => state.powerW)) / 1000,
  };
  summary.feasible = summary.maxAccelerationG <= config.mu * 1.01 && summary.minClearanceM >= 0 && summary.maxYawMomentUtilization <= 1.01
    && summary.maxPowerKw <= input.vehicle.powerHp * 745.7 * config.efficiency / 1000 * 1.01;
  return { config, controls, summary, states };
}

export function comparisonScore(input, solution) {
  // Rank every candidate under the same cue and slip weights. Removing a
  // residual for sensitivity exploration must not automatically win selection.
  const config = {
    ...solution.config,
    slipWeight: input.defaults.slipWeight,
    visualWeight: input.defaults.visualWeight,
  };
  const residual = objective(input, config).residuals(solution.controls);
  return dot(residual, residual)
    + ((config.onset - input.defaults.onset) / .8) ** 2
    + ((config.mu - input.defaults.mu) / .2) ** 2
    + ((config.loopScale - 1) / .2) ** 2;
}
