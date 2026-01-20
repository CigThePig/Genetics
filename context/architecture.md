# Architecture

Determinism:
- The simulation must be deterministic given seed + initial config.
- All randomness must flow through a single RNG module.
- Avoid time-based nondeterminism in sim logic.

Deterministic iteration order:
- Prefer arrays with explicit ordering for entity iteration.
- Use stable sorting when ordering is required.
- Do not rely on object key ordering for sim-critical steps.

Tick order invariant:
Sense → Decide → Act → Costs → LifeHistory → Regen → Metrics

Rendering is a post-tick, read-only view step outside the sim tick. Render must never mutate sim state; it only reads from the latest metrics/state snapshot.

Tunable configuration:
- Centralize tunables in src/sim/config.js.
- Other systems should import from config rather than scattering constants.

Core entities (eventual):
- World grid:
  - terrain type
  - grass amount
  - overgrazing stress
  - background color reference
- Bush:
  - position
  - health (0..1)
  - berry pool
- Creature:
  - species
  - genome (genes [0..1])
  - phenotype (derived)
  - meters (energy, water, stamina, HP)
  - state (wander/forage/drink/hunt/flee/mate/rest/fight)
  - memory records
  - targets + cooldowns

## Canonical Ecosystem (Locked)
Species roster (baseline):
- Squares
- Triangles
- Circles
- Octagons

Resource/food entities (baseline):
- Grass (distributed on world grid cells)
- Bushes (discrete entities with health 0..1)
- Berries (stored on bushes as bush.berries, the berry pool; regeneration tied to bush health)
- Meat (produced by predation outcomes)

Food web + efficiency bias (authoritative):
- Squares prefer berries; fallback eat triangles only under severe hunger/berry scarcity.
- Triangles eat circles and octagons (predatory).
- Circles prefer grass; fallback eat bushes when grass scarce.
- Octagons prefer squares; fallback eat grass when squares scarce.
- Digestive bias: circles best at grass, squares best at berries, predators best at meat; fallback foods are less efficient and/or higher risk.

Observability (must remain intact):
- population counts per species
- deaths by cause
- trait distributions (rolling summaries)
- color summaries (body + mate preference)
- creature inspection shows why it’s doing what it’s doing

## State flow & system interfaces (determinism + maintainability)

Rule: Systems are Data-In / Data-Out by interface.
- A system must only read/write state that is passed in.
- Avoid module-level mutable singletons (no hidden global state).
- No Date.now(), performance.now(), or Math.random() in sim logic.

Allowed pattern (performance-friendly):
- Systems may mutate the passed-in state in place (arrays/objects) as long as:
  - all mutation happens through the state argument
  - no system reaches into unrelated modules via imports to mutate their state
  - the sim orchestrator owns the tick order and passes needed references explicitly

RNG:
- All randomness must come from the central RNG (passed as rng, or available via an explicit simContext argument).
