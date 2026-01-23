# Track 10.6 — Blueprint

Purpose:

- Introduce sex, pregnancy/gestation, and mate-seeking so births are reliable and observable.

Systems touched:

- Config (new reproduction/pregnancy knobs).
- Creature creation (sex assignment per species).
- Reproduction system (pregnancy, conception, gestation, birth, mate selection).
- Movement intent handling (mate seeking intent).
- Metrics (pregnancy/miscarriage counters).
- Traits (gestation multiplier).

Files & responsibilities:

- src/sim/config.js
  - Add sex/pregnancy/mate-seeking config knobs with short comments.
- src/sim/creatures/index.js
  - Assign sex on initial spawn and on child creation.
  - Support mate intent movement heading updates.
- src/sim/creatures/reproduction.js
  - Pregnancy lifecycle + conception chance + birth event.
  - Ready-to-reproduce rule updated for females.
  - Mate selection helper with configurable ranges.
  - Metrics increments for pregnancies/miscarriages.
  - Trait-based gestation multiplier and newborn meter tradeoffs.
- src/sim/creatures/traits.js
  - Seed gestationMultiplier default and clamping.
- tests/creatures.test.js
  - Deterministic tests for sex split, pregnancy/birth, mate seeking intent.

Config knobs (new):

- Sex/pregnancy enablement, conception chance, gestation base ticks, gestation trait toggle.
- Pregnancy tradeoffs (metabolism/move speed), miscarriage thresholds/chance.
- Mate seeking toggles (range, commit ticks, seeking reproduction range).
- Newborn meter tradeoffs based on gestation multiplier thresholds.

Risks & mitigations:

- Intent thrashing → add commit timer and target invalidation checks.
- Needs overridden by mate seeking → gated by config override flag.
- Determinism → all random rolls via RNG; no Date/Math.random.
- File size → keep reproduction and creatures/index under 600 LOC.
