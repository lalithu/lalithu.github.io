# Hybrid reconstruction — local review

The owner explicitly authorized a hybrid physics-informed reconstruction, editable soft route constraints, inferred telemetry, alternative hypotheses and local integration on November 17, 2026. The revised direction permits model-assisted continuity across occlusions. Publication still requires owner review.

## Parameter assessment

| Input | Category | How it enters the reconstruction |
|---|---|---|
| Decoded video timestamps | Observed | Master playback clock and original frame alignment |
| Scene feature tracks and validity | Observed image-space candidates | Original overlays, weak normalized image-activity timing cue and visibility context |
| Early wheel-patch increments | Estimated image-plane proxy | Approximate visible steering behavior and a weak early quiet-wheel orientation-stability prior |
| Map transform | Estimated | Converts screenshot pixels to local ground metres with exploratory map-registration uncertainty |
| Ground road boundary | Assumed | Manually outlined drivable envelope, checked against the rotated 4.705 × 1.845 m vehicle footprint |
| Owner's route sketch | Assumed | Editable soft position anchors, with nominal 3.5 m residual scale |
| Motion onset and heading recovery | Assumed | Timing priors, varied across solutions and editable |
| Body rotation winding | Assumed | Clockwise, counterclockwise and partial-turn alternatives |
| Peak sideslip prior | Assumed | Broad 45° target with approximately 46° residual scale; editable weight including zero |
| Payload, grip, yaw inertia and efficiency | Assumed | Aggregate force, yaw-moment and power bounds |
| Fitted position, velocity, heading, yaw, sideslip, lateral acceleration | Estimated | Analytic spline state and derivatives, conditional on the assumptions |
| Trajectory over 7.4–10.6 seconds | Simulated | Continuous model prediction through the excluded interval |
| What-if outputs | Simulated | Refit after changes to assumptions |
| Event torque and calibrated road-wheel angle | Unavailable | Factory peak engine torque remains a separate reference |

Original image tracks and failed validation results are preserved unchanged and remain accessible at /review.

## Model and objective

The state consists of independent cubic B-splines for x(t), y(t) and unwrapped body heading ψ(t), with 10 free coefficients each after merging the opening basis columns to enforce a stationary hold through 4.5 s. Velocity, acceleration, jerk, yaw rate and yaw acceleration use analytic derivatives. Lateral slip is unrestricted by a no-slip kinematic relation.

The optimizer uses damped Gauss–Newton least squares with numerical Jacobians. Objective terms include soft route anchors, a broad heading/turn prior, a broad sideslip prior, low initial motion, final heading/travel alignment, position jerk, yaw jerk, road footprint, friction, yaw moment and positive mechanical-power checks.

The reported rotation contributes a soft magnitude prior of 360° with a 120° residual scale. Endpoint alignment and independent heading can yield a different total clip rotation. The selected solution yields approximately +439° across the complete clip. Alternatives include clockwise totals near −270° and a partial-turn total near +120°. These are model hypotheses requiring review.

The sideslip prior was added after initial aggregate-force fits admitted prolonged backward sliding. A zero-weight alternative is retained in the selector. Every candidate is ranked under the same reference cue and slip weights, so removing a residual in a sensitivity experiment does not automatically improve its selection score.

### Weak visual cues

Scene median image displacement is normalized by the 95th percentile of accepted image displacements. It is compared weakly with v/12 + |r|/2. The 12 m/s and 2 rad/s normalization factors are assumed. The cue weight defaults to 0.15 and is editable. Camera motion contaminates this cue. It provides no calibrated metric pose residual.

Early small apparent wheel-patch increments weakly favor initial heading stability. This is an explicit assumption. Wheel-plane geometry, steering ratio and road-wheel angles remain unresolved. Actual wheel-patch points and increments remain separately inspectable.

### Aggregate feasibility screen

- Total inertial acceleration is compared with μg.
- A shape-based yaw inertia Izz = factor × mass × (length² + width²) / 12 is assumed.
- Yaw moment is bounded by mass × μg × wheelbase / 2.
- Positive kinetic power is compared with the assumed efficiency times factory peak engine power.
- All four body corners are checked against the manually outlined road.
- Acceleration checks include spline knot times, where acceleration-vector extrema can occur between regular output samples.
- The post-fit screen permits a 1% numerical tolerance on force, moment and power bounds and requires nonnegative sampled footprint clearance.

These are aggregate necessary checks. Individual tire forces, force/moment coupling at each tire, transient tire relaxation, drivetrain controls, pitch, roll and road banking remain outside the fitted model.

## Selected solution and alternatives

Nine alternatives are provided. The selected conditional solution is Counterclockwise rotation under the common reference objective.

| Quantity | Selected assumption or model output |
|---|---|
| Opening hold / motion onset | Assumed hold through 4.5 s, following the owner's playback correction |
| Settled exit-speed prior | Assumed 5 m/s, with a penalty against late acceleration |
| Heading recovery | Assumed 11.5 s |
| Friction coefficient | Assumed 0.90 |
| Payload | Assumed 150 kg, giving model mass 1,945 kg |
| Peak slip prior | Assumed 45°, broad and editable |
| Power efficiency | Assumed 0.85 |
| Peak speed | Estimated approximately 21 mph |
| Peak total acceleration | Estimated approximately 0.90 g |
| Peak absolute yaw rate | Estimated approximately 101°/s |
| Sketch displacement RMS | Approximately 5.0 m |
| Minimum model footprint clearance | Approximately 0.3 m under the assumed road outline |

The approximately 1.3 m held-out map-registration discrepancy exceeds the minimum model clearance. Actual curb clearance is unresolved. The screen describes consistency with the assumed geometry.

The other solutions vary rotation direction, timing, loop size, friction, visual-cue weight and slip-prior weight. Their envelope is a plausibility/sensitivity range. It carries no statistical coverage claim. The position envelope also expands by the held-out map-registration discrepancy. Dynamic telemetry bands span the tested model alternatives.

## Interface

Observed mode hides the model car and physical telemetry, showing actual image-space evidence and documented validity. Best Estimate shows the selected conditional reconstruction. What-if permits live edits and browser-side refitting.

Body heading, velocity direction, a sideslip arc, motion trail, alternative-position envelope and simulated bridge are synchronized to the original HTML video. The complete bottom telemetry rail includes speed, heading, travel direction, yaw, sideslip, body lateral acceleration, ground position and wheel-patch behavior. Each field opens its method, assumptions, range and provenance.

What-if exposes route-anchor offsets, loop scale, onset, heading recovery, heading bias, rotation hypothesis, slip prior, friction, payload, inertia, power efficiency and visual-cue weight. Entry, Loop and Exit handles can be dragged or edited by keyboard. Completed edits are recorded in browser-local storage. The scenario can be exported as JSON.

The supplied artwork is retained as a visual proxy and scaled against published RC F body dimensions. The artwork depicts a racing vehicle, so its roof, body details and wing differ from the standard production model.

## Validation and artifacts

Python checks passed for timestamp ordering, spline partition of unity, derivative consistency, speed/acceleration identities, sideslip definition, model-bridge provenance and aggregate screens. Eight of nine candidate screens passed for the assumed geometry and parameters. The lower-grip alternative exceeds the acceleration tolerance and remains available with an explicit warning.

Chrome checks passed for the three modes, actual CV overlay toggles, source playback, telemetry provenance, simulated interval, graphs, live browser refits, anchor dragging and mobile width. Safari remains unverified.

Content hashes in analysis/outputs/hybrid-validation.json record the unchanged original observations, validation, tracking summary and calibration. Those files match the preserved project copies.

Reproduce the fit with:

```sh
analysis/.venv/bin/python analysis/prepare_hybrid.py
node analysis/fit_hybrid.mjs
analysis/.venv/bin/python analysis/diagnose_hybrid.py
```

The private local review is at http://127.0.0.1:4173/. All generated results remain under gitignored analysis/outputs.

- hybrid-reconstruction.json contains all fitted alternatives and shared model inputs.
- best-estimate.json contains time-indexed values, units, categories and alternative ranges.
- hybrid-diagnostics.png shows trajectory, velocity and yaw sensitivity.
- hybrid-validation.json records mathematical checks and original evidence hashes.

## Manufacturer source

The published 2016 Lexus reference supplies 4,705 mm length, 1,845 mm width, 2,730 mm wheelbase, 1,795 kg curb mass, RWD, an eight-speed automatic, 467 hp and 389 lb-ft peak engine torque. Equipment and event load remain uncertain. [Lexus Canada 2016 RC F specifications](https://media.lexus.ca/content/dam/media-lexus/general/spec-sheets/16RCF_E.pdf)

## Review requested

Review the selected trajectory and its phase relative to the footage, then compare body-rotation and grip alternatives. Confirm or adjust the assumed entry, loop, exit and timing before accepting this as the local reconstruction. Publication remains pending owner review.

## Playback timing refinement

The owner identified opening creep and a late speed increase. The opening spline basis now shares its first five cubic coefficients, making position, velocity and body heading constant through 4.5 seconds with continuous derivatives at departure. A front-loaded route timing prior, a settled exit-speed prior of 5 m/s, and a penalty against positive tangential acceleration after 12 seconds remove the late surge.

The selected exit speed decreases from approximately 12 mph at 12 seconds to approximately 11 mph at the end. These are model values conditional on visually supplied timing constraints. Regression checks assert the opening hold and the absence of a late acceleration surge. The trajectory was refitted under the existing force and road constraints, so the revised soft-sketch RMS is approximately 5 m.
