# Plan — World Scale + Resource Scarcity + Pack Relocation

## Recon Summary
- Files likely to change: src/sim/config.js (world/terrain/plant/AI defaults), src/sim/creatures/pack.js (pack state + patrol logic).
- Invariants: determinism, tick order, pack logic must not override urgent needs.
- Risks: over-scarcity, relocation conflicting with intent/chase behavior.

---

## Phase 1 — Config tuning + pack relocation behavior

### Tasks
- [x] Update world/terrain/plant config defaults per maintenance goals.
- [x] Add pack relocation config keys.
- [x] Extend pack leader state with staleness tracking and relocation logic.
- [x] Ensure relocation is gated by idle behavior and uses deterministic RNG sampling.
- [x] Update /context/repo-map.md if any file roles change. (checkbox)

### Files touched
- src/sim/config.js
- src/sim/creatures/pack.js
- context/active-track.md
- context/repo-map.md
- tracks/2026-02-03-track-maintenance-world-scale-pack-relocation/plan.md

### Verification
- [ ] Manual sim run: confirm map height doubled, water/plant scarcity visible.
- [ ] Manual observation: pack leader relocates after staleness threshold when idle.

### Stop point
- Stop after completing Phase 1 tasks and verification for review.

---

## Phase 2 — Herding + Grazing realism

### Tasks
- [x] Add Movement category to config UI so movement sliders render.
- [x] Expose movement + herding tuning keys in configMeta (wander jitter, herding range/comfort, smoothing, graze controls).
- [x] Update movement defaults to calmer cadence and add graze duty-cycle movement handling.
- [x] Smooth herding offsets + make separation multiplier configurable in sync + worker paths.
- [x] Add graze intent selection for herbivores with healthy meters.
- [x] Update /context/repo-map.md if any file roles change. (checkbox)

### Files touched
- src/ui/config-panel.js
- src/sim/config.js
- src/sim/creatures/movement.js
- src/sim/creatures/herding.js
- src/workers/herding-worker.js
- src/sim/creatures/intent.js
- context/active-track.md
- tracks/2026-02-03-track-maintenance-world-scale-pack-relocation/plan.md
- context/history.md

### Verification
- [ ] npm run verify (fails: prettier check reports existing formatting issues)
- [ ] Manual sim observation: herbivores align and move cohesively with less jitter.
- [ ] Manual sim observation: herds idle/graze instead of constant pacing, but flee instantly on threat.
- [ ] Manual UI check: Movement category shows wander retarget/jitter controls.

### Stop point
- Stop after completing Phase 2 tasks and verification for review.

---

## Phase 3 — Herd regroup + spawn separation

### Tasks
- [x] Add spawn anchor separation for predators vs herbivores; keep deterministic land validation.
- [x] Add long-range regroup assist for scattered herbivores (main-thread compute; worker-safe apply).
- [x] Gate grazing when herd size is too small or threatened.
- [x] Expose new spawn/herding/graze config keys in configMeta + config UI.
- [ ] Update /context/repo-map.md if any file roles change. (checkbox)

### Files touched
- src/sim/creatures/spawn.js
- src/sim/creatures/herding.js
- src/sim/creatures/intent.js
- src/sim/creatures/movement.js
- src/sim/config.js
- context/active-track.md
- context/history.md
- tracks/2026-02-03-track-maintenance-world-scale-pack-relocation/plan.md

### Verification
- [ ] npm run verify (fails: prettier check reports existing formatting issues)
- [ ] Manual sim: predators spawn away from herbivore clusters.
- [ ] Manual sim: scattered herbivores regroup over time after predator disruption.
- [ ] Manual sim: lone herbivores wander (no idle graze) until they rejoin.
- [ ] Manual sim: worker mode on/off behaves similarly.

### Stop point
- Stop after completing Phase 3 tasks and verification for review.
