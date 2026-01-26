# Plan — Herd Anchor Stability + Wander Cohesion

## Recon Summary
- Files likely to change: src/sim/config.js (new config defaults/meta), src/sim/sim.js (herding call signature), src/sim/creatures/herding.js (anchor logic + pull integration), src/sim/creatures/movement.js (wander retarget bias), tests/sim.test.js (anchor sanity test).
- Invariants: determinism via RNG, tick order, predator behavior unchanged, no worker protocol changes.
- Risks: anchor too strong, nondeterminism, performance overhead.

---

## Phase 1 — Implement herd anchor + wander cohesion tuning

### Tasks
- [x] Update herding defaults and add new config keys + configMeta entries (anchor + wander-in-herd).
- [x] Pass world/tick/rng into herding update from sim orchestrator.
- [x] Implement herd anchor state, evaluation, and pull integration (sync + worker apply) with gating and deadzone adjustments.
- [x] Add herd-aware wander retarget bias + jitter/retarget multipliers.
- [x] Add anchor sanity test for bounds + land validity.
- [x] Update /context/repo-map.md if any file roles change. (checkbox)
- [x] Update /context/active-track.md with current phase + next task.

### Files touched
- src/sim/config.js
- src/sim/sim.js
- src/sim/creatures/herding.js
- src/sim/creatures/movement.js
- tests/sim.test.js
- context/active-track.md
- context/repo-map.md
- tracks/2026-02-04-track-maintenance-herd-anchor-stability/plan.md

### Verification
- [x] npm test
- [x] npm run lint
- [ ] npm run format:check (fails: existing formatting warnings)
- [x] npm run build
- [ ] Manual sim: herbivore herds remain cohesive without predators; worker on/off behavior similar.

### Stop point
- Stop after Phase 1 verification for review.

---

## Phase 2 — Herd water rendezvous + thirst hysteresis + mating mingle

### Tasks
- [x] Add world water coverage multiplier config and apply effective water/shore thresholds in terrain generation.
- [x] Add thirst concern hysteresis config and herd water rendezvous config/meta entries.
- [x] Implement herd water rendezvous selection and herd-core mating mingle rules in creature intent.
- [x] Add post-drink regroup timer in actions and apply regroup boosts in herding.
- [x] (Optional) Add water memory suppression in herds and movement blending tweaks if needed.
- [x] Add or update automated test if core determinism-sensitive logic changes. (checkbox)
- [x] Update /context/repo-map.md if any file roles change. (checkbox)
- [x] Update /context/active-track.md with current phase + next task.

### Files touched
- src/sim/config.js
- src/sim/terrain-generator-enhanced.js
- src/sim/creatures/intent.js
- src/sim/creatures/actions.js
- src/sim/creatures/herding.js
- src/sim/creatures/movement.js (optional)
- src/sim/creatures/memory.js (optional)
- tests/ (optional)
- context/active-track.md
- tracks/2026-02-04-track-maintenance-herd-anchor-stability/plan.md

### Verification
- [x] npm test
- [ ] npm run verify (or lint/format/build as defined) (fails: format check warnings)
- [ ] Manual sim: herds rally to shared water, regroup after drink, and mate within herd.

### Stop point
- Stop after Phase 2 verification for review.
