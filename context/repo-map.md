# Repo Map (Master Context Index)

Purpose:

- One-page index of important files and how they connect.
- Keeps planning accurate without dumping the whole repo into prompts.

Rules:

- Keep entries short (2–6 bullets).
- Update when files are added or roles change.

## Top-level

- AGENTS.md
  - Role: canonical agent guidance, correctness invariants and proportional workflow
- README.md
  - Role: repo landing page + quickstart + deployment summary
- LICENSE
  - Role: licensing terms (MIT)
- package.json
  - Role: npm scripts + dependencies
- package-lock.json
  - Role: dependency lockfile for npm ci
- vite.config.js
  - Role: Vite config with env-configured base path
- index.html
  - Role: app shell entry for Vite
- .gitignore
  - Role: ignore build output + node modules
- .editorconfig
  - Role: consistent whitespace + line endings across editors
- .eslintrc.cjs
  - Role: lint rules for catching bugs + unused code early
- .prettierrc.json, .prettierignore
  - Role: formatting defaults + excluded paths

## GitHub

- .github/workflows/deploy.yml
  - Role: GitHub Pages build + deploy pipeline
- .github/workflows/verify.yml
  - Role: CI gate for tests + build + lint/format checks

## Context

- context/README.md
  - Role: project overview, pillars, and workflow summary
- context/track-index.md
  - Role: the ordered roadmap packaged into track definitions
  - Used by: planning to create tracks consistently
- context/planning-checklist.md
  - Role: proportional scope, design and verification checklist for substantial tracks
- context/repo-map.md
  - Role: canonical index of modules/files and their interactions
- context/product.md
  - Role: pillars, goals, scope boundaries
- context/architecture.md
  - Role: invariants (determinism, tick order, config, iteration order)
- context/workflow.md
  - Role: lifecycle rules (Track Index → Recon → Spec → Blueprint → Plan → Build → Verify → GC)
- context/tech-stack.md
  - Role: tools, build, deploy
- context/code-style.md
  - Role: cohesive module boundaries, state ownership and implementation conventions
- context/active-track.md
  - Role: pointer to current track folder + current phase/task
- context/history.md
  - Role: append-only track summaries + verification notes
- context/UI-FIX
  - Role: historical UI config panel prompts; current workflow is in AGENTS.md

## Tracks

- tracks/YYYY-MM-DD-track-N-<slug>/
  - Contains: spec.md, blueprint.md, plan.md
  - Rule: scope must match Track Index for Track N unless explicitly overridden
- tracks/2026-01-19-track-0-repo-bootstrap/
  - Contains: Track 0 spec/blueprint/plan (Repo Bootstrap)
- tracks/2026-01-19-track-1-developer-visibility-control/
  - Contains: Track 1 spec/blueprint/plan (Developer Visibility & Control)
- tracks/2026-01-19-track-2-canvas-camera-inspection-skeleton/
  - Contains: Track 2 spec/blueprint/plan (Canvas + Camera + Inspection Skeleton)
- tracks/2026-01-21-track-3-world-grid-terrain-foundations/
  - Contains: Track 3 spec/blueprint/plan (World Grid & Terrain Foundations)
- tracks/2026-01-19-track-4-plant-economy-grass-stress-bushes-berries/
  - Contains: Track 4 spec/blueprint/plan (Plant Economy: Grass, Stress, Bushes, Berries)
- tracks/2026-01-19-track-5-plant-economy-recovery-rendering-metrics/
  - Contains: Track 5 spec/blueprint/plan (Plant Economy: Recovery, Rendering, Metrics)
- tracks/2026-01-19-track-6-creature-core-meters-stages-movement/
  - Contains: Track 6 spec/blueprint/plan (Creature Core: Meters, Stages, Movement)
- tracks/2026-01-19-track-6p5-canon-lock/
  - Contains: Track 6.5 spec/blueprint/plan (Canon Lock + Species Retrofit)
- tracks/2026-01-19-track-7-survival-actions-sprinting-death/
  - Contains: Track 7 spec/blueprint/plan (Survival Actions + Sprinting + Death)
- tracks/2026-01-24-track-8-food-web-perception-memory/
  - Contains: Track 8 spec/blueprint/plan (Food Web + Perception + Memory)
- tracks/2026-01-25-track-9-predation-chase-dynamics/
  - Contains: Track 9 spec/blueprint/plan (Predation + Chase Dynamics)
- tracks/2026-01-26-track-10-reproduction-loop-basic-genetics/
  - Contains: Track 10 spec/blueprint/plan (Reproduction Loop + Basic Genetics)
- tracks/2026-01-29-track-10p5-timebase-survival-visibility-map-scale/
  - Contains: Track 10.5 spec/blueprint/plan (Timebase + Survival + Visibility + Map Scale)
- tracks/2026-01-30-track-10p6-gender-pregnancy-birth/
  - Contains: Track 10.6 spec/blueprint/plan (Gender + Pregnancy + Birth)
- tracks/2026-02-01-track-maintenance-per-species-metrics/
  - Contains: Maintenance spec/blueprint/plan (Per-species metrics expansion)
- tracks/2026-02-02-track-maintenance-renderer-perf/
  - Contains: Maintenance spec/blueprint/plan (Renderer perf micro-optimizations)
- tracks/2026-02-03-track-maintenance-world-scale-pack-relocation/
  - Contains: Maintenance spec/blueprint/plan (World scale + resource scarcity + pack relocation)
- tracks/2026-02-04-track-maintenance-herd-anchor-stability/
  - Contains: Maintenance spec/blueprint/plan (Herd anchor stability + wander cohesion)
- tracks/2026-01-27-track-maintenance-touch-gesture-guardrails/
  - Contains: Maintenance spec/blueprint/plan (Touch gesture guardrails)
- tracks/2026-01-28-track-maintenance-camera-change-callback/
  - Contains: Maintenance spec/blueprint/plan (Camera change callback)
- tracks/2026-01-22-track-maintenance-creature-render-pass/
  - Contains: Maintenance spec/blueprint/plan (Creature render pass)
- tracks/2026-01-23-track-maintenance-metrics-population/
  - Contains: Maintenance spec/blueprint/plan (Metrics population display)
- tracks/2026-01-28-track-maintenance-ui-fix/
  - Contains: Maintenance spec/blueprint/plan (UI config panel fixes)
- tracks/.gitkeep
  - Role: placeholder to keep the tracks directory in git

## Source

- src/main.js
  - Role: app entry; wires sim + renderer + UI
- src/app/settings.js
  - Role: settings persistence (seed, speed, toggles)
- src/sim/config.js
  - Role: public defaults, category metadata and presets for simulation, ecology and presentation
- src/sim/rng.js
  - Role: seeded RNG module for deterministic randomness
- src/sim/sim.js
  - Role: simulation/world ownership, seeded lifecycle orchestration and bounded colour-history sampling
- src/sim/world-grid.js
  - Role: world grid data structure + terrain/grass/stress accessors
- src/sim/terrain-generator.js
  - Role: public geographical terrain entry point; obsolete blob export removed
- src/sim/terrain-effects.js
  - Role: terrain effects lookup table (friction, perception, plant cap)
- src/sim/species.js
  - Role: canonical species identifiers + deterministic spawn assignment
- src/sim/plants/grass.js
  - Role: grass regrowth update logic + summary stats
- src/sim/plants/bushes.js
  - Role: bush entity placement and berry pool summary updates
- src/sim/plants/carcasses.js
  - Role: carcass spawning, meat consumption, and decay updates
- src/sim/plants/index.js
  - Role: plant system orchestrator for sim ticks
- src/sim/plant-generator.js
  - Role: seeds initial grass patches for world generation
- src/sim/worker.js
  - Role: worker-ready sim stub interface for future worker-backed loop
- src/sim/metrics-factory.js
  - Role: creates default metrics objects for sim initialization and reset
- src/sim/utils/resolvers.js
  - Role: shared config resolver utilities (clampMeter, resolveRatio, resolveTicksPerSecond, etc.)
  - Used by: creatures/_, plants/_, intent, actions
- src/sim/utils/config.js
  - Role: safe deep-clone + deep-merge helpers for simulation config
  - Used by: sim/sim.js, main.js (config reset)
- src/sim/utils/config.js
  - Role: deep-clone + deep-merge helpers for sim config
  - Used by: sim.js, main.js
- src/sim/creatures/index.js
  - Role: re-export hub for all creature subsystems
- src/sim/creatures/death.js
  - Role: creature death conditions and removal
- src/sim/creatures/metabolism.js
  - Role: basal metabolism drains, sprint decisions, stamina regen
- src/sim/creatures/movement.js
  - Role: creature position updates, terrain collision, water avoidance
- src/sim/creatures/intent.js
  - Role: priority selection and intent decision-making
- src/sim/creatures/actions.js
  - Role: eating and drinking action execution
- src/sim/creatures/spawn.js
  - Role: initial creature creation, positioning, sex assignment
- src/sim/creatures/traits.js
  - Role: per-creature trait defaults derived from config
- src/sim/creatures/genetics.js
  - Role: genome defaults, inheritance, and genome-to-trait multipliers
- src/sim/creatures/food.js
  - Role: canonical diet preferences, food properties, and efficiency helpers
- src/sim/creatures/perception.js
  - Role: perception scanning for nearby food/water with terrain modifiers
- src/sim/creatures/alertness.js
  - Role: alertness and reaction delay updates driven by perception changes
- src/sim/creatures/memory.js
  - Role: memory records for food/water locations with decay and selection helpers
- src/sim/creatures/targeting.js
  - Role: deterministic predator target scoring helpers
- src/sim/creatures/chase.js
  - Role: chase state updates, stamina gating, and loss rules
- src/sim/creatures/combat.js
  - Role: predator attack execution and carcass spawning
- src/sim/creatures/herding.js
  - Role: flocking/herding behavior for herbivore creatures
- src/sim/creatures/reproduction.js
  - Role: deterministic reproduction loop + offspring spawning
- src/sim/creatures/life-stages.js
  - Role: shared life stage definitions and resolution (juvenile/adult/elder)
  - Used by: creatures/index.js, creatures/reproduction.js
- src/render/renderer.js
  - Role: canvas renderer that draws the view using camera state
- src/render/camera.js
  - Role: camera state + pan/zoom helpers for renderer/input
- src/input/index.js
  - Role: input system entry point with touch pan/pinch camera controls
- src/metrics/index.js
  - Role: metrics system entry point (FPS overlay + toggle support)
- src/metrics/perf.js
  - Role: lightweight perf sampler with windowed timing rollups
- src/metrics/perf-registry.js
  - Role: global registry for active perf sampler to avoid circular imports
- src/ui/index.js
  - Role: touch-first UI shell (FPS toggle + status updates)
- src/ui/config-panel.js
  - Role: runtime config editor panel with category groupings
- src/ui/live-inspector.js
  - Role: creature inspection panel with real-time state display
- src/styles.css
  - Role: global styles with modern CSS design system

## Tests

- tests/sim.test.js
  - Role: Vitest smoke test for sim scaffold
- tests/genetics.test.js
  - Role: deterministic genetics mutation smoke test
- tests/creatures.test.js
  - Role: validates basal metabolism drains, life stages, reproduction, pregnancy
- tests/targeting.test.js
  - Role: validates predator target scoring determinism
- tests/carcasses.test.js
  - Role: validates carcass spawning, consumption, and decay
- tests/hunting.test.js
  - Role: validates combat mechanics and carcass spawning on kill

## Repository audit maintenance (2026-10-19)

- context/repository-audit-2026-10-19.md
  - Section-by-section findings, repairs, validation evidence and product limitations.
- tracks/2026-10-19-maintenance-repository-audit/
  - Single authorized maintenance phase: spec, blueprint and verified plan.
- src/app/bootstrap.js
  - Application initialization, UI wiring and lifecycle; imported by the small main entrypoint.
- src/sim/config-defaults.js, src/sim/config-meta/\*.js
  - Default values and category-based editor metadata; config.js preserves public exports and presets.
- src/sim/summary.js
  - Read-only population/genome and UI metric summary construction.
- src/sim/creatures/behavior-helpers.js, behavior-integration.js
  - State definitions/transitions and intent-to-state/movement integration.
- src/sim/creatures/herding.js, herding-simple.js
  - Authoritative local social information and finite threats; old complex anchors/forces were removed by the pre-Track 12 foundation.
- src/sim/creatures/herding-simple-helpers.js
  - Local-neighbour/visibility queries, active configuration resolvers and state defaults.
- src/sim/creatures/intent-helpers.js, water-rendezvous.js
  - Shared intent/search helpers and world-owned drinking rendezvous planning.
- src/sim/creatures/movement-helpers.js, pack-helpers.js, reproduction-helpers.js
  - Cohesive resolvers, state helpers and selection functions extracted from each subsystem.
- src/render/terrain-cache.js, terrain-view.js
  - Renderer-owned terrain/grass caching and read-only world-layer drawing.
- src/ui/config-storage.js, config-values.js, config-sections.js
  - Best-effort preferences, preset/value helpers and configuration controls.
- tests/audit-simulation.test.js, audit-app.test.js, audit-rendering.test.js
  - Lifecycle, determinism, behavior, app-boundary and render-cache regression scenarios.
- scripts/verify-simulation.mjs
  - Reusable three-seed finite-state, bounds, ID and population-accounting soak; npm run test:soak.

## Unfinished-phase completion (2026-10-19)

- tracks/2026-10-19-unfinished-phase-completion/
  - Scope, blueprint, phased execution and verification checkpoints for historical open items.
- context/phase-completion-2026-10-19.md
  - Evidence and disposition for every historical unfinished phase, plus limits of verification.
- src/ui/config-validation.js
  - Shared primitive/domain validation for structured drawers and preset imports.
- src/ui/config-panel.js, config-sections.js, config-values.js
  - Live pinned Favorites, structured drawers, cloned resets and validated preset values.
- src/app/timebase.js
  - Fixed-step wall-clock accumulator used by bootstrap, independently testable across display rates.
- src/sim/creatures/herding-simple.js, herding.js
  - Regroup/countdown in both modes; threat steering takes priority over stale herd forces.
- tests/config-validation.test.js, phase-completion.test.js
  - Unsafe config/import regressions; timebase, pregnancy, pack, grazing, rendezvous and regroup scenarios.
- scripts/verify-simulation.mjs
  - Adds first-minute mortality and median death timing to existing seeded soak evidence.

## Review follow-up for PRs #135 / #136

- src/app/loop.js
  - Owns timer/RAF lifecycle, fixed-step clock integration and per-frame view updates.
- src/app/config-controller.js
  - Connects config panel callbacks to world rebuilds, inspector rate and loop clock updates.
- src/app/bootstrap.js
  - Initializes modules and wires camera/input/view dependencies; loop and config ownership are delegated.
- src/sim/creatures/behavior-hunting.js
  - Hunting phase transitions extracted from behavior-state; common state helpers remain shared.
- tests/review-followup.test.js
  - Charging-only catches, scaled meter decisions, fallback prey parity, threat-distance threshold and regroup invalidation regressions.
- tracks/2026-10-19-pr-review-followup/, context/pr-review-followup-2026-10-19.md
  - Authorized review fixes, per-comment dispositions and updated verification evidence.

## Newest review and guidance refresh

- context/review-guidance-refresh-2026-10-19.md
  - Latest review dispositions, standing-rule audit and current verification evidence.
- src/sim/creatures/behavior-state.js, behavior-helpers.js
  - Per-creature assessed-threat memory avoids repeated distant alerts while retaining closer-danger reassessment.
- tests/review-followup.test.js, config-validation.test.js
  - Multi-tick alert reassessment in both herd modes; anchor radius metadata/import/runtime agreement.

## Track 11 — Regional colour ecology

- tracks/2026-10-19-track-11-regional-colour-evolution/
  - Expanded spec, architecture, seven-phase plan, measurements and browser evidence.
- src/sim/regional-terrain.js, habitat-analysis.js
  - Continuous environmental biomes, relief/climate fields, connected components and land-path water access.
- src/sim/habitat-colours.js, colour.js
  - Shared substrate/vegetation sampling, RGB contrast, circular hue math and statistics; no DOM.
- src/sim/creatures/visibility.js, mate-preference.js
  - Contextual detection and soft reciprocal preference; used by acquisition, chase, both herd modes and mating.
- src/sim/colour-metrics.js, src/ui/colour-evolution.js
  - World-lifetime founding snapshot plus bounded 10-second samples; per-species hue histograms and earlier/latest comparison.
- src/sim/config-meta/colour-ecology.js
  - Region scale/prevalence/borders, biome view and independent colour-effect switches.
- tests/regional-terrain.test.js, colour-ecology.test.js
  - Multi-seed topology, circular genetics, causal hunting/choice, lifecycle, indexed parity and replay.
- scripts/verify-track11.mjs, verify-track11-browser.cjs
  - Repeatable map/ablation batches and optional real-browser evidence with test-only app-handle instrumentation.

## Pre-Track 12 behavioural foundation

- tracks/2026-10-20-pre-track12-foundation/
  - Design, phased progress, configuration, reproducible evidence and combat integration readiness.
- src/sim/creatures/local-groups.js, locomotion.js
  - Bounded geographical membership and persistent individual travel/graze/rejoin goals.
- src/sim/creatures/herding.js, herding-simple.js, herding-simple-helpers.js
  - One authoritative local herd/finite-alarm engine, individual escape scoring and real movement contagion; both legacy mode values use it.
- src/sim/creatures/pack.js, pack-helpers.js, navigation.js
  - Committed local search/scouting, bounded observed memory and world-owned terrain routes.
- scripts/behaviour-scenarios.mjs, verify-behaviour.mjs, behaviour-playback.html
  - Deterministic controlled cohorts, per-tick motion metrics and compressed temporal baseline/final playback.
- scripts/verify-behaviour-browser.cjs, plot-behaviour.py; tests/behaviour-foundation.test.js
  - Optional browser/matplotlib observation tools and causal movement/group/escape regressions.
- Removed obsolete species-anchor/force/config implementation and src/workers/herding-worker.js; historical track documents describe their original snapshots only.

## Predator extinction investigation

- tracks/2026-10-21-predator-ecology/
  - Specification, mechanism design, phased progress, exact experiments, source variants, paired ecological evidence and limits; review.md records PR #139 corrections and separate validation.
- src/sim/creatures/mate-memory.js
  - Creature-owned observed social contacts; bounded retention, visits and reachable last-location selection without hidden live tracking.
- src/sim/creatures/intent.js, actions.js, combat.js, death.js, metrics-factory.js
  - Safe continuation of available drink/meat episodes, visible mating opportunity arbitration, actual food-energy counters and explicit predation attribution.
- scripts/investigate-ecology.mjs, controlled-ecology.mjs, check-founder-cohorts.mjs
  - Observational long-run diagnostics and controlled nutrition/demography/founder experiments.
- scripts/summarize-ecology.py, compact-ecology.py, benchmark-ecology.mjs, verify-ecology-browser.cjs
  - Complete paired aggregation, optional static figures, compact trait archives, equal-workload performance and optional real-browser inspection.
- tests/ecology.test.js
  - Causal recovery/urgency/finite-energy, observed contact, mating eligibility, accounting and ownership regressions.

## Procedural world generation and map scale

- `src/sim/regional-terrain.js`, `hydrology.js`: continuous warped relief/climate, suitability-based biomes, priority-flood basin storage and downhill runoff trees.
- `src/render/terrain-cache.js`: one pixel per tile, shared ecological colour raster and bounded vegetation update slices; `terrain-view.js` adds sparse zoom-dependent cosmetic marks.
- `src/sim/rng.js`: stable named initialization streams; terrain, initial vegetation, creatures, bushes and runtime cannot consume one another's random sequences.
- `scripts/verify-world.mjs`, `world-atlas.py`, `verify-world-browser.cjs`: baseline-selectable seed/scale/ecology diagnostics, optional Pillow atlases and optional Playwright performance/visual evidence.
- `tracks/2026-10-21-world-generation/`: scope, architecture, validation and default-size decision. Legacy generator implementation removed; public enhanced import path remains a facade.


## Geographical world generation (2026-10-21)

- src/sim/regional-terrain.js, hydrology.js
  - Warped relief/climate, biome suitability, priority-flood storage, strict-downhill runoff and lake/channel classification.
- src/render/terrain-cache.js, terrain-view.js; src/sim/habitat-colours.js
  - Compact per-cell shared-colour raster, sliced vegetation updates/paused flush and cosmetic zoom detail.
- src/sim/rng.js, creatures/spawn.js
  - Stable named initialization streams and map-size-independent physical founder cohort separation.
- scripts/verify-world.mjs, verify-world-browser.cjs, verify-world-app.cjs
  - Seed maps/ecology, production-loop profiling and actual UI lifecycle checks; optional Python atlas/trajectory tools.
- tracks/2026-10-21-world-generation/evidence.md, measurements.md
  - Default-size decision, 120 stable Node JSON records, regenerated PNG atlases, observed software-browser summaries and exact artifact/measurement limitations.
