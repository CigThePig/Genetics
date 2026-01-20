# Plan — Track 9: Predation + Chase Dynamics

## Recon Summary
- 

---

## Phase 1 — Target Scoring (Step 43)

Tasks:
- [ ] Implement deterministic target scoring for predator species using canonical prey rules.
- [ ] Add or update any species/trait tables needed for targeting weights.
- [ ] Add deterministic test coverage for targeting logic (seeded scenario or unit test).
- [ ] Expose target selection rationale in inspector/metrics if behavior is opaque.
- [ ] Update /context/repo-map.md if files/roles change.

Files touched (expected):
- src/sim/creatures/ (target scoring module)
- src/sim/config.js
- src/ui/
- src/metrics/
- tests/

Verification:
- Automated: deterministic targeting test passes.
- Manual: observe consistent target choice logic.

Stop point:
- Pause after target scoring is implemented and observable.

---

## Phase 2 — Chase Loop (Step 44)

Tasks:
- [ ] Implement chase loop with stamina gating and target loss rules.
- [ ] Add metrics for chase attempts/outcomes.
- [ ] Surface chase state/target in inspector for observability.
- [ ] Update /context/repo-map.md if files/roles change.

Files touched (expected):
- src/sim/creatures/ (chase state/logic)
- src/sim/config.js
- src/ui/
- src/metrics/

Verification:
- Manual: observe chase arcs and target loss behavior.
- Metrics: chase attempts and outcomes recorded.

Stop point:
- Pause after chase loop is implemented and observable.
