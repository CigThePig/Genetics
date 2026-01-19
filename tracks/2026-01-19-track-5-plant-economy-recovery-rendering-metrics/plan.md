# Track 5 — Plan

## Recon Summary
- Files likely to change: src/sim/plants/bushes.js (add recovery + berry regen), src/sim/config.js (tuning knobs), src/sim/plants/index.js (metrics wiring already present). 
- Key modules/functions: updateBushes (bush placement + per-tick updates), simConfig (tunable values). 
- Invariants: determinism via seeded rng, tick order unchanged, render remains read-only. 
- Cross-module side effects: plant metrics (bushAverageHealth, berryTotal) rely on updateBushes output. 
- Tick order impact: none (still in plant update phase). 
- Observability impact: existing metrics use average health + berry total; no new metric required for Phase 1. 
- File rules impact: no new system; file sizes remain under limits. 
- Risks/regressions: regen too fast or health never recovers if caps missed; ensure clamping. 
- Verification: manual observation of bush health/berries increasing over time.

---

## Phase 1 — Bush recovery + berry regeneration (Steps 21–22)

### Tasks
- [x] Review current bush/berry state and identify needed recovery fields.
- [x] Implement bush recovery logic with tunable caps.
- [x] Tie berry regeneration rate to bush health.
- [x] Update config values for recovery/regen tuning.
- [x] Update plant system orchestration if needed.
- [x] ☐ Reminder: update /context/repo-map.md if files/roles change.

### Files touched
- src/sim/plants/bushes.js
- src/sim/plants/index.js
- src/sim/config.js

### Verification
- [ ] Manual: observe bush health recovering and berry pools regenerating over time.

### Stop point
- Pause after verifying recovery/regen behavior.

---

## Phase 2 — Plant rendering (Step 23)

### Tasks
- [ ] Extend renderer to visualize grass levels.
- [ ] Render bushes with visuals keyed to health/berries.
- [ ] Ensure renderer remains read-only.
- [ ] ☐ Reminder: update /context/repo-map.md if files/roles change.

### Files touched
- src/render/renderer.js

### Verification
- [ ] Manual: plant visuals update as sim runs.

### Stop point
- Pause after validating plant rendering.

---

## Phase 3 — Plant metrics + known seed validation (Steps 24–25)

### Tasks
- [ ] Add/extend plant metrics aggregation.
- [ ] Surface metrics in metrics panel with clear labels.
- [ ] Document or set known seed for hotspot validation.
- [ ] ☐ Reminder: update /context/repo-map.md if files/roles change.

### Files touched
- src/metrics/index.js
- src/sim/plants/grass.js
- src/sim/plants/bushes.js
- src/sim/config.js
- context/active-track.md (phase tracking)

### Verification
- [ ] Manual: hotspot seed yields repeatable visible hotspots.
- [ ] Metrics: berry totals and bush health change over time.

### Stop point
- Pause after metrics + known seed validation.
