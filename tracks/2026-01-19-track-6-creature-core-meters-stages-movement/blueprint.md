# Track 6 — Blueprint: Creature Core: Meters, Stages, Movement

## Overview

Introduce the first real creature loop: a creature data model with meters, life stage scaling, basal drains, terrain-friction movement, and simple thirst/hunger priority selection. This remains deterministic and observable via inspector/metrics.

## Systems & Data

- Creature state
  - Canonical species identifier (Square/Triangle/Circle/Octagon).
  - Core meters: energy, water, stamina, HP (exact fields defined in plan).
  - Life stage scale factors (e.g., juvenile/adult/elder) derived from age or growth.
  - Simple intent/state (wander vs seek water/food) driven by priority rules.
- Movement
  - Position updates use terrain friction modifiers from terrain effects.
  - Movement step size scaled by life stage.
- Metabolism
  - Basal drains applied per tick for energy/water/stamina.

## Files to Add/Update

- Add: `src/sim/creatures/` module(s) for creature data, update logic, and movement.
- Update: `src/sim/sim.js` to wire creature system into tick order.
- Update: `src/sim/config.js` for creature tunables.
- Update: `src/ui/index.js` or inspector UI to expose meters/life stage.
- Update: `src/metrics/index.js` if new summary metrics are added.
- Update: `tests/` for deterministic or unit tests tied to core formulas.

## Interfaces / APIs (No Code)

- Creature system entry: `updateCreatures(simState, rng)` or similar, called from sim tick.
- Movement helper: `applyMovement(creature, terrainEffects, config)`.
- Meter drains: `applyBasalMetabolism(creature, config)`.
- Priority selection: `chooseNeed(creature)`.

## Tick Order Impact

- Must respect the existing tick order invariant.
- Creature updates should align to Sense → Decide → Act → Costs → LifeHistory → Regen → Metrics.

## Observability

- Inspector should show per-creature species, meters, and life stage.
- Renderer should make species visually distinct (shape-based markers).
- Metrics may include aggregate averages for energy/water or counts by priority state.

## Risks & Mitigations

- Priority thrash: add hysteresis or thresholds to avoid rapid flipping.
- Jittery movement: smooth velocity or clamp step size to friction.
- Determinism: ensure all randomness uses central RNG and stable iteration order.

## Testing Strategy

- Deterministic scenario test: fixed seed, N ticks, expected creature summary hash.
- Unit test for basal metabolism drains or movement with friction if needed.
