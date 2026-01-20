# Track 10 — Reproduction Loop + Basic Genetics

## Goal
Enable reproduction with inheritance and mutation so traits drift over time in a deterministic, observable way.

## Includes (from Track Index)
45) Reproduction loop
46) Genome + inheritance
47) Mutation rules + pleiotropy tradeoffs

## Acceptance
- Reproduction creates viable offspring.
- Genetics and mutation produce visible trait drift.

## Risks
- Coupled genetics balance causes runaway behavior.

## Verification
- Manual: observe trait drift over time with fixed seed.
- Automated: deterministic genetics smoke test.

## Engine vs Traits Checklist
- Engine vs species/traits: reproduction flow is engine logic; genetic values live in creature.genome/traits and are seeded from species defaults.
- Traits: any new trait must be added to creature.traits and seeded from species defaults.
- Config values are defaults only; simulation must read from creature.traits first.
- Observability: trait/genetics changes must surface in metrics and/or inspector.
