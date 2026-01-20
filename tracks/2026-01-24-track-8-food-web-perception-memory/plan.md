# Plan — Track 8: Food Web + Perception + Memory

## Recon Summary
- Files likely to change:
  - src/sim/creatures/index.js (intent/behavior flow will need to consume new diet, perception, alertness, memory outputs).
  - src/sim/creatures/traits.js (new diet/perception/alertness traits seeded from species defaults).
  - src/sim/config.js (new tunables for food properties, perception, alertness, memory limits).
  - src/sim/species.js (species tables for canonical diet rankings/fallbacks).
  - src/metrics/index.js + src/ui/index.js (expose new summaries for observability).
  - tests/ (deterministic scenario test for perception/alertness).
- Key modules/functions involved:
  - updateCreatureIntent/applyCreatureActions (diet decisions and resource consumption).
  - createCreatures/createCreatureTraits (species/trait seeding).
  - sim tick in src/sim/sim.js (must respect tick order).
  - world-grid/terrain-effects (terrain modifiers for perception).
- Invariants to respect:
  - Determinism (all randomness through rng module).
  - Tick order: Sense → Decide → Act → Costs → LifeHistory → Regen → Metrics.
  - No new system logic in src/main.js; add new modules under src/sim/creatures/.
- Cross-module side effects:
  - New diet/food logic touches plants (grass/bushes) and metrics; ensure renderer/UI reads remain intact.
  - Perception/memory additions may require new inspector fields to keep behavior explainable.
- Tick order impact:
  - Perception should run in Sense stage before intent selection.
  - Alertness/reaction delay should affect Decide stage timing without changing the global tick order.
- Observability impact:
  - Add minimal inspector summary for memory entries and alertness state; metrics if behavior is opaque.
- File rules impact:
  - New system modules (food logic, perception, memory, alertness) should be new files in src/sim/creatures/.
  - Ensure no file exceeds 600 LOC; split if index.js grows too large.
- Risks/regressions:
  - Over-strong perception can destabilize movement; keep tunables in config.
  - Memory lists can grow too large; cap length and decay deterministically.
- Verification commands/checks:
  - Automated: add/extend a deterministic test in tests/ (vitest) for perception/alertness if implemented.
  - Manual: run npm run dev and verify diet behavior + inspector memory entries visually.

---

## Phase 1 — Canonical Food Logic (Steps 36–38)

Tasks:
- [x] Implement canonical diet ranking + fallback rules for all species.
- [x] Define food properties (nutrition/handling/risk) for canonical resources.
- [x] Add digestive efficiency biases aligned to canon anti-omnivore rules.
- [x] Update creature traits/species tables for any new diet-related traits (if needed).
- [x] Expose diet-related summaries in inspector/metrics if behavior is opaque.
- [x] Update /context/repo-map.md if files/roles change.

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
- [x] Implement perception v1 (sight + terrain modifiers) respecting tick order.
- [x] Add alertness + reaction delay mechanism.
- [x] Add deterministic test for perception/alertness behavior (seeded scenario).
- [x] Update inspector/metrics to expose alertness/perception hints.
- [x] Update /context/repo-map.md if files/roles change.

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
- [x] Add memory records for food/water/danger/mate with decay/cap.
- [x] Wire memory into behavior selection to enable scout vs route-runner emergence.
- [x] Surface memory summary in inspector.
- [x] Update /context/repo-map.md if files/roles change.

Files touched (expected):
- src/sim/creatures/ (memory modules)
- src/ui/
- src/metrics/ (if needed)

Verification:
- Manual: observe scouts vs route runners.
- Inspector: memory entries visible (summary).

Stop point:
- Pause after memory drives visible behavior differences.
