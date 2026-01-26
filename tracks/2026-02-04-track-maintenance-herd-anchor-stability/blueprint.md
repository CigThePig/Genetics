# Blueprint — Herd Anchor Stability + Wander Cohesion

## Summary
- Tune herding defaults to reduce diffusion and keep subtle steering effects.
- Add new movement tuning for herd-aware wander correlation.
- Add intelligent herd anchors evaluated on the main thread with low-frequency sampling, hysteresis, and drift.
- Apply anchor influence consistently for sync and worker flow without changing worker protocol.
- Add a small test that validates anchor state stays in-bounds and on land.
- Add herd-level water rendezvous targeting with thirst hysteresis and post-drink regrouping.
- Reduce world water coverage via a multiplier-driven effective threshold/river count.

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
- src/sim/terrain-generator-enhanced.js
  - Apply water coverage multiplier to effective water/shore thresholds and river count.
- src/sim/creatures/intent.js
  - Add herd-level water rendezvous selection and herd-core mate mingling rules.
- src/sim/creatures/actions.js
  - Add post-drink regroup timer.

## Data & State
- New per-species anchor state stored in a module map (pos, target, softRadius, cooldown, scores, threatHeat).
- World debug snapshot for anchors stored on world.herdAnchors.
- New per-species water rendezvous state stored in module map with world.herdWaterTargets snapshot.

## Logic
- Anchor evaluation uses seeded RNG when available, sampled candidates around herd centroid, and lightweight scoring for food, water proximity, threats, crowding, and boundary bias.
- Anchor pulls are gentle, distance-clamped, and disabled for urgent needs/threatened creatures and small herds.
- Wander retargeting in herds biases headings toward herding offset and reduces jitter/retarget frequency.
- Water rendezvous uses low-frequency sampling around herd anchor/centroid, hysteresis, and cooldowns to stabilize shared targets.
- Thirst hysteresis keeps herds committed to water until drink concern clears; post-drink regroup temporarily strengthens anchor pull.
- Herbivore mating keeps herd members mingling near core; isolated members rally to anchor.
- Water coverage multiplier preserves shoreline thickness while reducing effective water/river generation.

## Risks & Mitigations
- Risk: anchor dominates behavior.
  - Mitigation: soft radius + max influence distance + urgent-need gating + low pull strength.
- Risk: nondeterminism.
  - Mitigation: use central RNG passed to herding update; deterministic fallback when RNG absent.
- Risk: performance.
  - Mitigation: evaluate every N seconds and sample a small candidate set only.
- Risk: rendezvous logic thrashes or adds overhead.
  - Mitigation: commit windows + eval cooldown + small candidate count.

## Verification
- npm test
- Manual sim run: verify cohesive herds, smooth movement, and worker consistency.
- Manual sim run: verify shared water rendezvous, post-drink regroup, and herbivore mating mingling.
