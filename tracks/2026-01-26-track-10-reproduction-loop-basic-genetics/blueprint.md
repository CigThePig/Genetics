# Blueprint — Track 10: Reproduction Loop + Basic Genetics

## Summary
Introduce deterministic reproduction, genomes, and mutation rules so offspring inherit traits with controlled drift and observable tradeoffs.

## Scope
- Reproduction loop: add mating/reproduction triggers and offspring creation flow.
- Genome + inheritance: model per-creature genome values that map to traits.
- Mutation + pleiotropy: apply deterministic mutation rules with explicit tradeoffs.

## Non-Goals
- Advanced mate preference systems (reserved for Track 11).
- New combat or perception mechanics.

## Systems & Data
### New/Updated State
- creature.genome: deterministic gene vector (0..1) per creature.
- creature.traits: derived values used by sim (existing; may add new traits if needed).
- reproduction state: cooldowns, mate selection, or readiness flags.

### New Modules (new system = new file)
- src/sim/creatures/reproduction.js — reproduction flow + offspring spawning.
- src/sim/creatures/genetics.js — genome storage, inheritance mapping, mutation rules.

### Updated Modules (expected)
- src/sim/creatures/index.js — create creature with genome + traits seeding.
- src/sim/creatures/traits.js — trait defaults + genome-to-trait mapping helpers.
- src/sim/sim.js — wire reproduction/genetics systems in tick order (Sense → Decide → Act → Costs → LifeHistory → Regen → Metrics).
- src/metrics/index.js + src/ui/index.js — expose reproduction/genetics metrics/inspector updates.
- tests/ (new test file) — deterministic genetics smoke test.

## Determinism & Tick Order
- All randomness routed through central RNG.
- Reproduction and mutation must execute in a deterministic order, anchored to tick order invariants.

## Observability
- Add at least one metric or inspector readout for reproduction/genetics (e.g., births per tick, trait distribution summaries).

## Risks & Mitigations
- Runaway mutation or reproduction loops → include configurable mutation rates and reproduction cooldowns.
- Nondeterminism from unordered iteration → ensure stable iteration order for mating/offspring creation.

## Open Questions
- Which traits are driven directly by genes vs derived from config defaults?
- What minimal pleiotropy tradeoff is acceptable for Track 10 without overlapping Track 11 color systems?
