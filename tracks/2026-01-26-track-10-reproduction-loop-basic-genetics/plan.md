# Plan — Track 10: Reproduction Loop + Basic Genetics

## Recon Summary
- Files likely to change: src/sim/creatures/index.js (creature state + exports), src/sim/sim.js (tick wiring), src/sim/config.js (reproduction tunables), src/ui/index.js + sim summary (metrics visibility), context/repo-map.md (new module entry), src/sim/creatures/reproduction.js (new system).
- Key modules/functions: createCreatures, updateCreatureLifeStages, applyCreatureDeaths, sim tick order, UI metrics renderer.
- Invariants to respect: determinism via rng, tick order (LifeHistory slot), central RNG usage only, new system in new file, no file > 600 LOC.
- Cross-module side effects: sim summary feeds UI metrics; reproduction metrics must be surfaced in getSummary.
- Tick order impact: insert reproduction step in LifeHistory after age updates.
- Observability impact: add reproduction metrics (births per tick/total) to summary + UI.
- File rules impact: new system requires src/sim/creatures/reproduction.js; ensure no file exceeds 600 LOC.
- Risks/regressions: nondeterministic mate selection or offspring ordering; runaway births if thresholds too low.
- Verification: manual fixed-seed run to confirm deterministic births and metrics update.

---

## Phase 1 — Reproduction Loop (Step 45)

### Tasks
- [x] Define reproduction readiness/cooldowns and mating trigger in creature state.
- [x] Implement deterministic reproduction flow (select mate, spawn offspring, apply costs).
- [x] Add observability: metrics or inspector fields for reproduction events.
- [x] Add/confirm central RNG usage for any reproduction randomness.
- [x] Reminder: update /context/repo-map.md if any files are added or roles change.

### Files Touched
- src/sim/creatures/reproduction.js (new)
- src/sim/creatures/index.js
- src/sim/sim.js
- src/metrics/index.js
- src/ui/index.js
- context/repo-map.md (if files/roles change)

### Verification
- Manual: observe births occurring deterministically with a fixed seed.

### Stop Point
- Pause after reproduction loop is in place and observable.

---

## Phase 2 — Genome + Inheritance (Step 46)

### Tasks
- [x] Add genome data to creatures and seed from species defaults.
- [x] Implement genome → traits mapping (traits derived from genome and defaults).
- [x] Ensure determinism: stable iteration order when generating offspring genomes.
- [x] Add/confirm inspector fields for genome/trait visibility where appropriate.
- [x] Reminder: update /context/repo-map.md if any files are added or roles change.

### Files Touched
- src/sim/creatures/genetics.js (new)
- src/sim/creatures/traits.js
- src/sim/creatures/index.js
- src/ui/index.js
- context/repo-map.md (if files/roles change)

### Verification
- Manual: offspring show inherited traits from parents.

### Stop Point
- Pause after genome/trait inheritance is implemented and visible.

---

## Phase 3 — Mutation + Pleiotropy Tradeoffs (Step 47)

### Tasks
- [x] Implement deterministic mutation rules in genetics system.
- [x] Add pleiotropy tradeoffs (e.g., improvement in one trait increases cost elsewhere).
- [x] Add/update automated deterministic genetics smoke test.
- [x] Surface mutation/trait drift metrics in metrics or inspector.
- [x] Reminder: update /context/repo-map.md if any files are added or roles change.

### Files Touched
- src/sim/creatures/genetics.js
- src/sim/creatures/traits.js
- src/metrics/index.js
- tests/genetics.test.js (new)
- context/repo-map.md (if files/roles change)

### Verification
- Automated: deterministic genetics smoke test passes.
- Manual: observe trait drift over time with fixed seed.

### Stop Point
- Pause after mutation rules, tradeoffs, and tests are in place.
