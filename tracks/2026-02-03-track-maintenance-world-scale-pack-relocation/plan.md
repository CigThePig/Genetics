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
