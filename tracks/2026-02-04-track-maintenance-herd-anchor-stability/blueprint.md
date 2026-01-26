# Blueprint — Herd Anchor Stability + Wander Cohesion

## Summary
- Tune herding defaults to reduce diffusion and keep subtle steering effects.
- Add new movement tuning for herd-aware wander correlation.
- Add intelligent herd anchors evaluated on the main thread with low-frequency sampling, hysteresis, and drift.
- Apply anchor influence consistently for sync and worker flow without changing worker protocol.
- Add a small test that validates anchor state stays in-bounds and on land.

## Files
- src/sim/config.js
  - Update herding defaults and add new config keys + configMeta entries.
- src/sim/sim.js
  - Pass world/tick/rng into herding updates for anchor evaluation.
- src/sim/creatures/herding.js
  - Implement anchor state, evaluation, and main-thread pull integration.
- src/sim/creatures/movement.js
  - Add herd-aware wander retarget tuning and bias.
- tests/sim.test.js (or new test file)
  - Add anchor sanity check.

## Data & State
- New per-species anchor state stored in a module map (pos, target, softRadius, cooldown, scores, threatHeat).
- World debug snapshot for anchors stored on world.herdAnchors.

## Logic
- Anchor evaluation uses seeded RNG when available, sampled candidates around herd centroid, and lightweight scoring for food, water proximity, threats, crowding, and boundary bias.
- Anchor pulls are gentle, distance-clamped, and disabled for urgent needs/threatened creatures and small herds.
- Wander retargeting in herds biases headings toward herding offset and reduces jitter/retarget frequency.

## Risks & Mitigations
- Risk: anchor dominates behavior.
  - Mitigation: soft radius + max influence distance + urgent-need gating + low pull strength.
- Risk: nondeterminism.
  - Mitigation: use central RNG passed to herding update; deterministic fallback when RNG absent.
- Risk: performance.
  - Mitigation: evaluate every N seconds and sample a small candidate set only.

## Verification
- npm test
- Manual sim run: verify cohesive herds, smooth movement, and worker consistency.
