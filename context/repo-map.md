# Repo Map (Master Context Index)

Purpose:
- One-page index of important files and how they connect.
- Keeps planning accurate without dumping the whole repo into prompts.

Rules:
- Keep entries short (2–6 bullets).
- Update when files are added or roles change.

## Top-level
- AGENTS.md
  - Role: agent rules + constraints + workflow gates
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

## GitHub
- .github/workflows/deploy.yml
  - Role: GitHub Pages build + deploy pipeline

## Context
- context/README.md
  - Role: project overview, pillars, and workflow summary
- context/track-index.md
  - Role: the ordered roadmap packaged into track definitions
  - Used by: planning to create tracks consistently
- context/planning-checklist.md
  - Role: the ritual + prompts for creating tracks and phases safely
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
  - Role: module boundaries + file rules (new system=new file, max 600 LOC)
- context/active-track.md
  - Role: pointer to current track folder + current phase/task
- context/history.md
  - Role: append-only track summaries + verification notes

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
- tracks/2026-01-22-track-maintenance-creature-render-pass/
  - Contains: Maintenance spec/blueprint/plan (Creature render pass)
- tracks/2026-01-23-track-maintenance-metrics-population/
  - Contains: Maintenance spec/blueprint/plan (Metrics population display)
- tracks/.gitkeep
  - Role: placeholder to keep the tracks directory in git

## Source
- src/main.js
  - Role: app entry; wires sim + renderer + UI
- src/app/settings.js
  - Role: settings persistence (seed, speed, toggles)
- src/sim/config.js
  - Role: centralized tunable config (terrain + plant scaffolding)
- src/sim/rng.js
  - Role: seeded RNG module for deterministic randomness
- src/sim/sim.js
  - Role: sim orchestration stub + RNG wiring
- src/sim/world-grid.js
  - Role: world grid data structure + terrain/grass/stress accessors
- src/sim/terrain-generator.js
  - Role: deterministic terrain blob generator for world grid initialization
- src/sim/terrain-effects.js
  - Role: terrain effects lookup table (friction, perception, plant cap)
- src/sim/species.js
  - Role: canonical species identifiers + deterministic spawn assignment
- src/sim/plants/grass.js
  - Role: grass regrowth update logic + summary stats
- src/sim/plants/bushes.js
  - Role: bush entity placement and berry pool summary updates
- src/sim/plants/index.js
  - Role: plant system orchestrator for sim ticks
- src/sim/plant-generator.js
  - Role: seeds initial grass patches for world generation
- src/sim/worker.js
  - Role: worker-ready sim stub interface for future worker-backed loop
- src/sim/creatures/index.js
  - Role: creature data model creation + basic inspection helpers
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
- src/sim/creatures/reproduction.js
  - Role: deterministic reproduction loop + offspring spawning
- src/render/renderer.js
  - Role: canvas renderer that draws the view using camera state
- src/render/camera.js
  - Role: camera state + pan/zoom helpers for renderer/input
- src/input/index.js
  - Role: input system entry point with touch pan/pinch camera controls
- src/metrics/index.js
  - Role: metrics system entry point (FPS overlay + toggle support)
- src/ui/index.js
  - Role: touch-first UI shell (FPS toggle + status updates)

## Tests
- tests/sim.test.js
  - Role: Vitest smoke test for sim scaffold
- tests/genetics.test.js
  - Role: deterministic genetics mutation smoke test
- tests/creatures.test.js
  - Role: validates basal metabolism drains per tick
- tests/targeting.test.js
  - Role: validates predator target scoring determinism
