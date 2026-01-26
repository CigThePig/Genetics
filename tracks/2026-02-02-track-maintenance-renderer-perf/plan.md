# Plan — Renderer Perf Micro-optimizations

## Recon Summary

- Files likely to change: src/render/renderer-enhanced.js for terrain cache layers; src/ui/index.js for perf timer ordering.
- Invariants: render must remain read-only; perf timers must remain intact and snapshot order should include new timers.
- Risks: cache invalidation on resize or world changes, visual regressions, grass refresh cadence.

## Phase 1 — Cache viewport sizes + background gradient

### Tasks

- [x] Add cached viewportWidth/viewportHeight in createRenderer and update inside resizeToContainer.
- [x] Replace getBoundingClientRect reads in drawTerrain and drawCreatures with cached viewport size.
- [x] Add getBackgroundGradient(w, h) cache and reuse unless size changes.
- [x] Verify perf timers and snapshot logic remain unchanged.
- [x] Reminder: update /context/repo-map.md if files/roles change.

### Files touched

- src/render/renderer-enhanced.js

### Verification checklist

- [ ] Manual: resize window and confirm canvas scales and visuals remain consistent.
- [ ] Optional: npm test

### Stop point

- Stop after Phase 1 verification and update active-track.md with current phase/task.

## Phase 2 — Terrain cache layers for PASS 1–4

### Tasks

- [x] Add terrain cache layers (base/detail/grass) with layer builders and cache metadata.
- [x] Replace per-frame PASS 1–4 tile loops with cached layer blits and grass refresh timer.
- [x] Add new perf timers for cache build/update and keep existing pass timers alive.
- [x] Update RENDER_TIMER_ORDER to include new cache timers.
- [x] Reminder: update /context/repo-map.md if files/roles change.

### Files touched

- src/render/renderer-enhanced.js
- src/ui/index.js

### Verification checklist

- [ ] Manual: confirm terrain visuals match prior output (except static water detail) and grass refreshes.
- [ ] Optional: npm test

### Stop point

- Stop after Phase 2 verification and update active-track.md with current phase/task.

## Deviation Note (2026-02-02)

- Added viewport-cropped cache blits, grass dirty tracking, and frame-level perf timers to address new performance profiling requirements.
- Scope expanded beyond Phase 2; see Phase 3 for implementation and verification.

## Phase 3 — Cropped terrain blits + grass dirty throttling + frame timers

### Tasks

- [x] Replace full-surface cache blits with viewport-cropped drawImage blits and keep PASS 1/2/4 timers scoped to blit work.
- [x] Add grassDirtyCounter to world state and increment only when grass values change (growth, consumption, seeding).
- [x] Throttle grass cache updates to 250ms and skip refresh when dirty counter is unchanged.
- [x] Add frame.delta and frame.wait perf timers and include them in UI ordering.
- [ ] Reminder: update /context/repo-map.md if files/roles change.

### Files touched

- src/render/renderer-enhanced.js
- src/sim/world-grid.js
- src/sim/plants/grass.js
- src/sim/plant-generator.js
- src/main.js
- src/ui/index.js

### Verification checklist

- [ ] Manual: confirm terrain blits scale with viewport and grass cache updates are throttled/dirty-only.
- [ ] Manual: confirm frame.delta and frame.wait appear in perf snapshot ordering.
- [ ] Optional: npm test

### Stop point

- Stop after Phase 3 verification and update active-track.md with current phase/task.
