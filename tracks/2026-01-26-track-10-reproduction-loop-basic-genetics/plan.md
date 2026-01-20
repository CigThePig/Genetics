# Plan — Track 10: Reproduction Loop + Basic Genetics

## Recon Summary
- (To be completed during recon.)

---

## Phase 1 — Reproduction Loop (Step 45)

### Tasks
- [ ] Define reproduction readiness/cooldowns and mating trigger in creature state.
- [ ] Implement deterministic reproduction flow (select mate, spawn offspring, apply costs).
- [ ] Add observability: metrics or inspector fields for reproduction events.
- [ ] Add/confirm central RNG usage for any reproduction randomness.
- [ ] Reminder: update /context/repo-map.md if any files are added or roles change.

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
- [ ] Add genome data to creatures and seed from species defaults.
- [ ] Implement genome → traits mapping (traits derived from genome and defaults).
- [ ] Ensure determinism: stable iteration order when generating offspring genomes.
- [ ] Add/confirm inspector fields for genome/trait visibility where appropriate.
- [ ] Reminder: update /context/repo-map.md if any files are added or roles change.

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
- [ ] Implement deterministic mutation rules in genetics system.
- [ ] Add pleiotropy tradeoffs (e.g., improvement in one trait increases cost elsewhere).
- [ ] Add/update automated deterministic genetics smoke test.
- [ ] Surface mutation/trait drift metrics in metrics or inspector.
- [ ] Reminder: update /context/repo-map.md if any files are added or roles change.

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
