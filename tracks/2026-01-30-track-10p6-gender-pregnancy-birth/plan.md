# Track 10.6 — Plan

## Recon Summary
- (To fill during build runs as needed.)

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
- [ ] Update createCreatures() to assign sex with exact per-species 50/50 split.
- [ ] Ensure child creation assigns sex as well.
- [ ] Update /context/repo-map.md if files/roles change.

Files touched:
- src/sim/creatures/index.js
- context/repo-map.md (if needed)

Verification checklist:
- [ ] Tests for sex split are added and pass.
- [ ] Deterministic spawn ordering preserved.

Stop point:
- Pause after sex assignment changes for review.

## Phase 3 — Pregnancy + conception + birth pipeline
Tasks:
- [ ] Add gestationMultiplier trait default + clamping.
- [ ] Update readiness rules to block pregnant females.
- [ ] Implement conception chance and pregnancy state.
- [ ] Add gestation ticking, miscarriage checks, and birth events.
- [ ] Apply newborn meter tradeoffs based on gestation multiplier.
- [ ] Add pregnancy/miscarriage metrics.
- [ ] Add deterministic tests for pregnancy start and births.
- [ ] Update /context/repo-map.md if files/roles change.

Files touched:
- src/sim/creatures/reproduction.js
- src/sim/creatures/traits.js
- tests/creatures.test.js
- context/repo-map.md (if needed)

Verification checklist:
- [ ] Pregnancy clears on birth and miscarriage.
- [ ] Gestation ticks down regardless of cooldown.
- [ ] Newborn sex assignment exists for births.
- [ ] Metrics increments match events per tick.

Stop point:
- Pause after pregnancy/birth pipeline changes for review.

## Phase 4 — Mate seeking + adjusted ranges
Tasks:
- [ ] Add mate selection helper with rangeSq scanning.
- [ ] Set mate-seeking intent with commit timer and invalidation rules.
- [ ] Update movement to support intent.type === "mate".
- [ ] Use reproduction range while seeking for pairing checks.
- [ ] Add tests for mate-seeking intent selection.
- [ ] Update /context/repo-map.md if files/roles change.

Files touched:
- src/sim/creatures/reproduction.js
- src/sim/creatures/index.js
- tests/creatures.test.js
- context/repo-map.md (if needed)

Verification checklist:
- [ ] Mate intent does not override eat/drink unless configured.
- [ ] Commit timer prevents thrashing.
- [ ] Mate target invalidation resets intent safely.
- [ ] Range while seeking applied only to seeking pairs.

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
- [ ] Mate intent does not permanently override drink/eat unless configured.
- [ ] Commit timer prevents target thrashing.
- [ ] Mate target invalidation resets intent safely.
- [ ] Seeking range does not apply globally.
- [ ] Performance: scanning uses rangeSq and skips non-candidates early.
