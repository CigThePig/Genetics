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
- tracks/.gitkeep
  - Role: placeholder to keep the tracks directory in git

## Source
- src/main.js
  - Role: app entry; wires sim + renderer + UI
- src/app/settings.js
  - Role: settings persistence (seed, speed, toggles)
- src/sim/config.js
  - Role: centralized tunable config (stub)
- src/sim/rng.js
  - Role: seeded RNG module for deterministic randomness
- src/sim/sim.js
  - Role: sim orchestration stub + RNG wiring
- src/sim/world-grid.js
  - Role: world grid data structure + terrain accessors
- src/sim/worker.js
  - Role: worker-ready sim stub interface for future worker-backed loop
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
