# Plan — Track 8: Food Web + Perception + Memory

## Recon Summary
- (pending)

---

## Phase 1 — Canonical Food Logic (Steps 36–38)

Tasks:
- [ ] Implement canonical diet ranking + fallback rules for all species.
- [ ] Define food properties (nutrition/handling/risk) for canonical resources.
- [ ] Add digestive efficiency biases aligned to canon anti-omnivore rules.
- [ ] Update creature traits/species tables for any new diet-related traits (if needed).
- [ ] Expose diet-related summaries in inspector/metrics if behavior is opaque.
- [ ] Update /context/repo-map.md if files/roles change.

Files touched (expected):
- src/sim/creatures/ (food logic modules)
- src/sim/config.js
- src/ui/ (inspector fields)
- src/metrics/ (summary additions)

Verification:
- Manual: observe basic foraging choices align with canonical diet rules.

Stop point:
- Pause after diet logic + efficiency biases are implemented and observable.

---

## Phase 2 — Perception + Alertness (Steps 39–40)

Tasks:
- [ ] Implement perception v1 (sight + terrain modifiers) respecting tick order.
- [ ] Add alertness + reaction delay mechanism.
- [ ] Add deterministic test for perception/alertness behavior (seeded scenario).
- [ ] Update inspector/metrics to expose alertness/perception hints.
- [ ] Update /context/repo-map.md if files/roles change.

Files touched (expected):
- src/sim/creatures/ (perception + alertness modules)
- src/sim/config.js
- src/ui/
- src/metrics/
- tests/

Verification:
- Automated: perception/alertness deterministic test passes.
- Manual: perception responds to terrain modifiers.

Stop point:
- Pause after perception/alertness are implemented and tested.

---

## Phase 3 — Memory + Emergent Foraging Styles (Steps 41–42)

Tasks:
- [ ] Add memory records for food/water/danger/mate with decay/cap.
- [ ] Wire memory into behavior selection to enable scout vs route-runner emergence.
- [ ] Surface memory summary in inspector.
- [ ] Update /context/repo-map.md if files/roles change.

Files touched (expected):
- src/sim/creatures/ (memory modules)
- src/ui/
- src/metrics/ (if needed)

Verification:
- Manual: observe scouts vs route runners.
- Inspector: memory entries visible (summary).

Stop point:
- Pause after memory drives visible behavior differences.
