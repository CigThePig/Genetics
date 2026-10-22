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

## Pre-Track 12 behavioural foundation (2026-10-20)

Survival intent selects needs, resources, reproduction and hunting. Local herding/pack decisions then supply social information and search destinations; `locomotion.js` retains individual wander/graze/rejoin goals only when survival and danger permit. Behaviour integration owns pacing; movement owns all heading, velocity, collision and arrival. The major tick order is unchanged. New goal arbitration runs after pack decisions, before behaviour integration/movement. Start-of-tick spatial data are used consistently for decisions; the post-movement rebuild before reproduction remains intact. Interim catches resolve against the previous completed positions before the new movement step.

Both legacy herd-mode flags now select one authoritative local engine. Species-wide anchors and the unused asynchronous boids worker are removed. Groups have creature-owned IDs and leader IDs, acquisition/retention distance hysteresis and bounded size (24 herbivores / 8 predators); they are reconstructed from live actors with deterministic ordering. IDs survive ordinary membership changes while their local leader survives; leader loss elects a live local member. They are social labels, not centrally controlled formations. Membership can split/merge; no group contains live entity references.

Personal space tapers to zero outside the comfort radius. Actual velocity identifies moving neighbours; movement contagion can wake a paused animal and select an observed travel goal, without continuously aligning every heading. A goal is suspended by urgent intent, completed on arrival or abandoned on expiry. Search commitments account for distance/speed. Predator members choose persistent local scouting destinations around a shared objective; no rotating formation slots remain. Recent visited sites (16) and decaying observed prey positions bound search memory. Search samples land geometry but never reads unseen prey locations.

Direct threat detection retains Track 11 visibility and inherited senses. Warnings read a previous-tick snapshot, cross at most one edge per tick, carry bounded hops and cannot extend the original expiry through a warning loop. Escape routes score each animal's safety against perceived threats and retain short directional commitments. Alert duration still reflects individual alertness; immediate close danger bypasses the pause. Charging can interrupt slow stalking when visible prey velocity demonstrates escape. Sprinting is reserved for pursuit/danger, not ordinary wandering.

`navigation.js` owns world-local, terrain-versioned, LRU-bounded land-distance fields (24); compact retained routes belong to individual motion state. World reset replaces caches. Water collisions brake; they cannot snap heading/velocity through the old alternative-angle search. Arrival brakes at the destination. Speed remains tiles/second; heading rate uses seconds, while the existing acceleration/drag/angular smoothing settings remain documented per-tick blends.

Runtime diet identity is retained, with an explicit feeding-priority change: meat-first predators use plants below half their individual appetite threshold, with a small recovery band while eating. They begin seeking/hunting at appetite rather than waiting for starvation reserves; rest has a satiation gap. Herbivores retain water memories by default. Water rendezvous now shares observed/remembered water within geographical groups rather than sampling remote sites around a species centroid. Legacy force/anchor/retarget knobs remain importable but are labelled inactive/advanced in the editor. See the foundation track's configuration/tooling/evidence documents.

## Predator ecology investigation (2026-10-21)

Resource arbitration distinguishes initiating a need from finishing an available resource episode. Previous drinking/meat-eating intent can continue toward the configured recovery ratio (at least the inherited need threshold) while the competing reserve exceeds half its inherited need threshold. Any positive meat residue can finish an existing meal; initiation still requires the configured minimum. Resource loss and emergency competing needs yield back to ordinary arbitration. The explicit mating-priority override takes precedence over recovery only when the animal is eligible to seek mates. Actual actions still own all consumption and meter caps. Grass/berry feeding, reproductive eligibility and major tick order are unchanged.

Start-of-tick intent records bounded visible opposite-sex contacts once per second in creature-owned `reproduction.contacts`. Healthy mate search may revisit a reachable copied observation before random exploration. Contact travel uses a distinct `mate-contact` search goal, cleared before random search when the observation expires, is disabled, is visited or becomes unreachable. Four contacts, configurable expiry, visited-location removal and zero-disable bound memory; live mate acquisition/conception still require actual visibility/eligibility and honor commitments. Physically eligible animals below appetite can court a visible partner when no immediate meal/drink is available; this does not allow blind hungry mate search.

Action metrics distinguish actual capped food energy from consumption and feeding ticks. Combat marks explicit lethal predation; death accounting gives that event precedence over simultaneous age, otherwise retains age/injury/thirst/starvation order. UI species/global summaries include predation. See the dated investigation for exact before/after experiments and remaining demographic limits; none of these mechanisms maintains a population floor.

## Geographical world generation (2026-10-21)

This supersedes the Track 11 regional-site generator described above. The public generator now creates continuous domain-warped multiscale relief, rainfall and temperature; biomes compete on environmental suitability, with prevalence weights as biases rather than guaranteed assigned cores. Feature scale caps at a 160-tile shorter dimension, so larger maps add territory without proportionately increasing every geographical distance.

A cardinal priority flood computes basin storage/spill levels. Actual runoff follows strictly descending raw relief, accumulates rainfall and terminates at closed-basin storage or the map edge. Lake contours follow basin depth; perennial channels follow runoff, while shallow headwaters remain traversable riparian substrate. No rivers are stamped, no pond is assigned to a region and no water-distance quota adds resources. Small maps can have dry, degenerate catchments.

`deriveSeed(seed, label)` uses a stable FNV-1a label and integer avalanche. The labels `vegetation`, `creatures`, `bushes` and `runtime` isolate stochastic orchestration streams. Terrain has an explicit seed-only API, `generateTerrain({ world, config })`: `config.seed` (default 1) derives independent `geography` and `climate` field seeds. There is no terrain RNG argument or unused orchestration stream. Hydrology itself consumes no randomness. Terrain suitability can still change accepted spawn positions; changing initialization RNG consumption cannot advance sibling streams. Historical seeded trajectories intentionally change; equal seed/config/tick sequences replay.

The terrain cache stores one opaque canvas pixel and one RGBA CPU-buffer pixel per cell (8 bytes total), scaled with nearest-neighbor sampling. Geography/vegetation colours are the same shared habitat samples used for camouflage, quantized to 8-bit display RGB. Vegetation refresh is time sliced with a 2 ms row-processing budget and 250 ms spacing between completed passes; upload/compositing costs are additional, and no hard total-frame or refresh-latency bound is claimed. Immediate paused renders flush the raster. Sparse contour marks and bush sprites remain cosmetic. Resets release old canvas storage and replace world-owned ecological/navigation caches.

Camera viewport/bounds changes re-clamp the current zoom against the new fit-dependent minimum and preserve the viewed world point before positional edge clamping. A larger viewport or smaller rebuilt world cannot retain an obsolete below-minimum zoom.

## Spatial population ecology (2026-10-22)

Initial communities are ecological starting conditions, never permanent population identities. `creatureFounderGroups` defaults to two; a minimum of twelve founders per requested species/community keeps four-member predator species together. Opposite-sex founder pairs are allocated together. Additional placement draws use `founding-community:<group>` and `founder-position:<id>` streams while preserving the original founding genomes. Small/unsuitable worlds may not produce separated sites. No count increase, region-specific genomes or travel/mating restriction is imposed.

Shared herd-water destinations yield to substantially nearer personally observed/remembered water when `creatureWaterPreferLocal` is enabled (default). A 15% distance margin suppresses trivial retargeting and can interrupt a stale social commitment. Existing Euclidean-distance conventions, resource searches and route navigation remain; this is not a shortest drinking-route solver.

`creatures/lineage.js` owns passive copied birthplace, parent IDs/birthplaces and sixteen unlinked diploid neutral loci. ID-scoped `neutral:<id>` seed derivation does not advance ecological RNG. Birth receives one allele from each parent at each locus; paternal neutral data are copied at conception and cleared after pregnancy. Markers have no mutation or phenotype mapping; they are instrumentation for segregation/drift/gene flow, distinct from blended phenotypic inheritance. Runtime records have constant size, no recursive ancestry and no entity references. Detailed histories belong only to offline tooling. `spatial-metrics.js` computes read-only sample-filtered descriptive G_ST; fixed spatial bins never enter simulation decisions. Inspector birthplace/displacement reads are passive. Major tick order is unchanged.
