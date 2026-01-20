# Plan — Track 9: Predation + Chase Dynamics

## Recon Summary
- Files likely to change: src/sim/creatures/index.js (intent selection), new targeting module, config tunables, tests, inspector view in src/main.js.
- Key modules: creature intent/movement loop, species canon, config defaults.
- Invariants: determinism via seeded RNG only, tick order unchanged, new system in new file.
- Cross-module effects: intent targeting flows into movement; inspector displays new targeting data.
- Tick order impact: none (target scoring feeds existing Decide step).
- Observability: add inspector rows for target choice.
- File rules: new system -> new file; no files near 600 LOC.
- Risks: predator targeting feels random without stable tie-breakers; mitigated via scoring + deterministic ties.
- Verification: vitest unit test for target scoring; manual inspect target selection.

---

## Phase 1 — Target Scoring (Step 43)

Tasks:
- [x] Implement deterministic target scoring for predator species using canonical prey rules.
- [x] Add or update any species/trait tables needed for targeting weights.
- [x] Add deterministic test coverage for targeting logic (seeded scenario or unit test).
- [x] Expose target selection rationale in inspector/metrics if behavior is opaque.
- [x] Update /context/repo-map.md if files/roles change.

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
- [x] Implement chase loop with stamina gating and target loss rules.
- [x] Add metrics for chase attempts/outcomes.
- [x] Surface chase state/target in inspector for observability.
- [x] Update /context/repo-map.md if files/roles change.

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
