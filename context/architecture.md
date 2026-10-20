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

- Centralize defaults in src/sim/config-defaults.js and editor metadata in src/sim/config-meta/; src/sim/config.js exports the public configuration API.
- Systems use their passed configuration, with explicit defaults when needed, rather than scattering tunable constants.

## Creature Architecture: Engine vs Species Traits

Generic Creature Engine (shared logic for every creature):

- time step
- movement integration
- meters drain/recovery
- intent selection
- action execution (drink/eat/rest/etc)

Species + Traits Layer (data-driven differences):

- creature.species ∈ {square, triangle, circle, octagon}
- creature.traits (per-individual phenotype values)
- species defaults seed traits at spawn
- genes/mutation modify traits per creature, never globally

Non-negotiable rule:

- Once a trait exists in creature.traits, the simulation must read from creature.traits first,
  and treat config values only as defaults/fallbacks.

Examples:

- Speed affects cost per creature, not per species globally.
- Circles eating grass is a species rule, but efficiency is trait-driven.

Core entities:

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

Original design food web + efficiency bias (future design reference; runtime differences are documented below):

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

## Audited runtime notes (2026-10-19)

- Spatial indexes are owned by each simulation; anchor and water-rendezvous state by each world. Legacy global spatial helpers are compatibility APIs and are not used by the authoritative tick.
- Authoritative herding is synchronous. The simple-mode switch selects the simple implementation; asynchronous worker completion cannot drive seeded decisions.
- The behavior state machine is integrated after intent/herd/pack decisions and before movement. It supplies pauses and hunt pacing, while survival intent remains authoritative.
- Births preserve paternal genotype at conception and spawn beside the mother. Creature IDs increase monotonically within a world.
- The runtime food preferences are currently broader than the original locked canon above; see the audit report before implementing future food-web tracks. Existing fallback feeding tests and explicit config tables are preserved by this maintenance PR.

## Time and position units

- `ticksPerSecond` is fixed for a world's lifetime (default 60); UI rate changes rebuild the world. `speed` changes simulated seconds per wall-clock second, without changing tick duration.
- The app's fixed-step clock runs from the timer, independently of render RAF. Pause/resume and speed changes reset accumulated time; catch-up is capped at 250 ms and 240 ticks per timer callback.
- Duration config values are seconds. Resolvers convert them to integer tick counters once. Runtime `ageTicks`, `cooldownTicks`, gestation counters, and similar fields count simulation ticks.
- Drain, regeneration, movement and turn rates use per-second units with `1 / ticksPerSecond` applied by the consuming system. Per-tick smoothing/acceleration and probability settings are exceptions, not durations; the legacy miscarriage per-tick probability is a fallback for standalone callers without the per-second key.
- Distances/positions are tiles in the simulation; movement speed is tiles per simulated second. Render/input convert through `tileSize` (pixels per tile) and the camera. Meter thresholds are ratios against the corresponding base meter.
- Equal seeds and configuration replay identically. Different tick rates are different configurations; per-tick smoothing means they need not produce identical trajectories.

## Track 11 — Environment, colour and mating

The enhanced terrain entry point now delegates to regional-terrain.js. Stratified jittered region sites and bounded domain warp create primary habitat interiors; local ponds/orthogonally connected streams preserve land continuity. Water-access fields are static land-path data for generation/spawning. Initial creatures retain species clusters but start on connected vegetated land with accessible water. Legacy noise knobs are retained for preset compatibility and labeled inactive in the editor.

habitat-colours.js owns substrate HSL, deterministic local texture and bounded grass/stress appearance. Simulation and renderer share RGB samples. Decorative edges, bush sprites and water highlights are approximations outside the colour model; grass cache refresh can lag by 250 ms. Trait creation caches individual body RGB/CSS; rendering never changes phenotype.

Body H/S/L, preferred hue, choosiness and discrimination are direct normalized traits rather than multiplicative genes. Hue loci inherit along the shortest circular arc and wrap mutation. Exact antipodes take a positive half-turn from the first parent. Other colour loci clamp. Existing metabolic-gene mappings and costs remain in place. Better discrimination can strengthen both prey detection and mate-colour selectivity; choosiness incurs travel/opportunity costs through decisions.

Visibility uses inherited perception, observer terrain, weighted RGB/luminance contrast and movement. Detection range has a close-range floor; pursuit gets hysteresis and uses existing last-known-position grace. Uncoloured legacy actors retain colour-neutral visibility. The colour camouflage flag disables contrast attenuation while retaining ordinary senses/terrain. Social herd warnings propagate as information rather than new visual sightings.

Mate acquisition and conception share eligibility/ranking. Soft reciprocal mismatch competes with distance, with deterministic ID ties. Active commitments are honored by both parties at conception; a valid distant, hidden or nonreciprocal target causes waiting rather than substitution. Death, pregnancy or ineligibility allows reselection. Birth-tick pairing guards prevent immediate reconception. Saved paternal genotype and generation survive paternal death.

After regeneration, colour-metrics.js records one sample every ten simulated seconds, at most 120 samples plus the founding snapshot. Histograms/means are circular; undefined means are null for empty or directionless samples. Summaries and UI read this world-owned history. Reset replaces it. Tick ordering is otherwise unchanged.
