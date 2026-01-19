# Blueprint — Track 7: Survival Actions + Sprinting + Death

## Overview
Implement survival actions (drink/eat), stamina + sprinting, death conditions, and population counters while preserving determinism, tick order, and observability.

## Scope (from Track Index)
- Drinking behavior
- Grass eating
- Stamina + sprinting
- Death conditions
- Population counters

## Systems & Files (expected)
- src/sim/creatures/index.js
  - Extend creature state to include action intents (drink/eat/sprint) and stamina meter handling.
- src/sim/sim.js
  - Wire new creature action updates into tick phases (Sense → Decide → Act → Costs → LifeHistory → Regen → Metrics).
- src/sim/world-grid.js
  - Provide water/grass accessors for drink/eat actions (if missing).
- src/sim/plants/grass.js
  - Expose consumption hooks or updates for grass eating.
- src/metrics/index.js
  - Add population counters and death causes to metrics output.
- src/ui/index.js
  - Display population counters and death causes in UI panel.
- tests/
  - Add deterministic test if core formula changes touch metabolism/movement costs.

## Data Model Changes
- Creature meters:
  - stamina (0..1) with drain on sprint and regen during rest.
- Creature state:
  - action intent (drink/eat/sprint)
  - deathCause (starvation/thirst/age/other) for metrics.
- Metrics:
  - population counts per species
  - deaths by cause

## Tick Order Alignment
- Sense: detect nearby water/grass availability.
- Decide: choose drink/eat/sprint based on meters/needs.
- Act: move or consume resources.
- Costs: apply stamina drain, energy/water changes.
- LifeHistory: handle death conditions and remove dead creatures.
- Regen: stamina recovery where applicable.
- Metrics: update population/death counters.

## Determinism & RNG
- All randomness (if any for targeting/selection) must use central RNG.
- Keep iteration order stable; avoid object key iteration for sim-critical loops.

## Observability
- Metrics panel shows population counts and deaths by cause.
- Inspector includes current action intent and meters.

## Risks & Mitigations
- Death spiral: keep tuning conservative; expose metrics for feedback.
- Sprint dominance: cap sprint usage with stamina cost + regen constraints.

## Open Questions
- Whether to model sprint as speed multiplier or discrete action.
- How to attribute death cause if multiple meters are zero.
