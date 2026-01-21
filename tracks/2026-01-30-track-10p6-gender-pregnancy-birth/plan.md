# Track 10.6 — Plan

## Recon Summary
- Lower reproduction readiness mins to align with eat/drink thresholds so readiness can activate.
- Expose pregnancies/miscarriages metrics in the UI for runtime validation.

## Phase 1 — Add configuration knobs (no behavior changes)
Tasks:
- [x] Add sex/pregnancy config keys with brief comments in src/sim/config.js.
- [x] Add mate-seeking config keys with brief comments in src/sim/config.js.
- [x] Confirm existing reproduction keys remain intact.
- [x] Update /context/repo-map.md if files/roles change.

Files touched:
- src/sim/config.js
- context/repo-map.md (if needed)

Verification checklist:
- [x] Config file loads without syntax errors.
- [x] No behavioral changes introduced.

Stop point:
- Pause after config changes for review.

## Phase 2 — Sex assignment at spawn (exact 50/50 per species)
Tasks:
- [x] Update createCreatures() to assign sex with exact per-species 50/50 split.
- [x] Ensure child creation assigns sex as well.
- [x] Update /context/repo-map.md if files/roles change.

Files touched:
- src/sim/creatures/index.js
- context/repo-map.md (if needed)

Verification checklist:
- [x] Tests for sex split are added and pass.
- [x] Deterministic spawn ordering preserved.

Stop point:
- Pause after sex assignment changes for review.

## Phase 3 — Pregnancy + conception + birth pipeline
Tasks:
- [x] Add gestationMultiplier trait default + clamping.
- [x] Update readiness rules to block pregnant females.
- [x] Implement conception chance and pregnancy state.
- [x] Add gestation ticking, miscarriage checks, and birth events.
- [x] Apply newborn meter tradeoffs based on gestation multiplier.
- [x] Apply pregnancy move-speed and metabolism tradeoffs.
- [x] Add pregnancy/miscarriage metrics.
- [x] Add deterministic tests for pregnancy start and births.
- [x] Update /context/repo-map.md if files/roles change.

Files touched:
- src/sim/creatures/reproduction.js
- src/sim/creatures/traits.js
- src/sim/creatures/index.js
- src/sim/sim.js
- tests/creatures.test.js
- context/repo-map.md (if needed)

Verification checklist:
- [x] Pregnancy clears on birth and miscarriage.
- [x] Gestation ticks down regardless of cooldown.
- [x] Newborn sex assignment exists for births.
- [x] Metrics increments match events per tick.

Stop point:
- Pause after pregnancy/birth pipeline changes for review.

## Phase 4 — Mate seeking + adjusted ranges
Tasks:
- [x] Add mate selection helper with rangeSq scanning.
- [x] Set mate-seeking intent with commit timer and invalidation rules.
- [x] Update movement to support intent.type === "mate".
- [x] Use reproduction range while seeking for pairing checks.
- [x] Add tests for mate-seeking intent selection.
- [x] Update /context/repo-map.md if files/roles change.

Files touched:
- src/sim/creatures/reproduction.js
- src/sim/creatures/index.js
- tests/creatures.test.js
- context/repo-map.md (if needed)

Verification checklist:
- [x] Mate intent does not override eat/drink unless configured.
- [x] Commit timer prevents thrashing.
- [x] Mate target invalidation resets intent safely.
- [x] Range while seeking applied only to seeking pairs.

Stop point:
- Pause after mate seeking changes for review.

## Preempt checklists (before Phases 3 and 4)
Phase 3 (pregnancy/birth):
- [ ] Pregnancy state clears on birth and miscarriage.
- [ ] Females cannot become pregnant twice.
- [ ] Cooldown does not block gestation ticking.
- [ ] Newborn sex assignment exists for spawn + birth.
- [ ] Metrics increments do not double-count per tick.
- [ ] Gestation multiplier defaults to 1.0 and clamps correctly.

Phase 4 (activation layer):
- [x] Mate intent does not permanently override drink/eat unless configured.
- [x] Commit timer prevents target thrashing.
- [x] Mate target invalidation resets intent safely.
- [x] Seeking range does not apply globally.
- [x] Performance: scanning uses rangeSq and skips non-candidates early.

## Phase 5 — Closeout patch (readiness thresholds + UI metrics + guard test)
Tasks:
- [x] Lower reproduction readiness thresholds to match eat/drink intent thresholds.
- [x] Add pregnancy and miscarriage metrics rows to the UI panel.
- [x] Add a guard test ensuring readiness thresholds stay <= eat/drink thresholds.
- [x] Update /context/history.md with Track 10.6 closeout summary.
- [x] Clear /context/active-track.md for Track 10.6 closeout.
- [x] Confirm /context/repo-map.md does not need updates for file/role changes.

Files touched:
- src/sim/config.js
- src/ui/index.js
- tests/sim.test.js
- tracks/2026-01-30-track-10p6-gender-pregnancy-birth/plan.md
- context/history.md
- context/active-track.md

Verification checklist:
- [x] npm test
- [ ] Manual: UI shows pregnancies/miscarriages metrics and births increase over time.

Stop point:
- Pause after verification and closeout updates for review.
