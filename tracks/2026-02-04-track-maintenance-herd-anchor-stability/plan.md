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
