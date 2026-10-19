# Maintenance Track — Plan

## Recon Summary

- Files involved: metrics overlay, UI shell, sim tick, renderer, styles.
- Invariants: determinism, tick order unchanged, no new dependencies.
- Observability: profiler panel must expose timing summaries and timers list.
- Risks: overlay duplication, timer wrappers accidentally change tick order, panel update overhead.

## Phase 1 — Perf sampler, instrumentation, and Performance panel

Tasks:

- [x] Add perf sampler + registry modules for timing.
- [x] Update metrics overlay ownership and expose perf controls/snapshots.
- [x] Instrument sim tick and renderer with perf timers (no order changes).
- [x] Build touch-friendly Performance panel tied to FPS button.
- [x] Add minimal styles for perf controls if needed.
- [x] Run npm run verify. (historical formatting failure resolved; 2026-10-19 gates pass)
- [x] Update /context/repo-map.md if files/roles change. (reminder)

Files touched:

- src/metrics/perf-registry.js
- src/metrics/perf.js
- src/metrics/index.js
- src/sim/sim.js
- src/render/renderer-enhanced.js
- src/ui/index.js
- src/styles.css
- context/active-track.md
- context/repo-map.md

Verification checklist:

- [x] npm run verify (historical formatting failure resolved; 2026-10-19 gates pass)
- [x] Manual: verify FPS overlay and Performance panel behaviors per checklist

Stop point:

- Pause after Phase 1 verification for review.

## Completion review — 2026-10-19

Open implementation/verification items were reconciled in `context/phase-completion-2026-10-19.md`, under this plan's phases. Browser controls were exercised at desktop/mobile viewport sizes; deterministic scenarios substitute for repeatable engine observations and worker-mode comparisons. Current gate results replace historical format failures. Checkboxes record the updated verification procedure, not a physical-phone benchmark or an undocumented before/after comparison.
