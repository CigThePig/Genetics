# Maintenance Track — Plan

## Recon Summary

- Files involved: sim metrics factory, reproduction/death/chase/combat/genetics systems, sim summary, UI metrics definitions, styles.
- Invariants: determinism, tick order unchanged, keep existing metrics keys intact.
- Observability: per-species metrics must be exposed in summary/UI.
- Risks: forgetting per-tick resets or mismatched UI labels.

## Phase 1 — Add per-species metrics, summary keys, and UI grouping

Tasks:

- [x] Add per-species metrics helpers and initialize new metrics fields.
- [x] Reset per-species last-tick metrics alongside existing resets.
- [x] Increment per-species metrics in reproduction, death, chase, combat, and genetics.
- [x] Expose flat per-species summary keys in sim.getSummary().
- [x] Group UI metrics by species with subheadings.
- [x] Style metrics subheadings.
- [x] Run tests.
- [x] Update /context/repo-map.md if any file roles change. (reminder)

Files touched:

- src/sim/metrics-factory.js
- src/sim/creatures/reproduction.js
- src/sim/creatures/death.js
- src/sim/creatures/chase.js
- src/sim/creatures/combat.js
- src/sim/creatures/genetics.js
- src/sim/sim.js
- src/ui/index.js
- src/styles.css
- context/active-track.md
- context/repo-map.md

Verification checklist:

- [x] npm test
- [ ] Manual: verify grouped metrics update during sim

Stop point:

- Pause after Phase 1 verification for review.
