# AGENTS.md — Rules for AI coding help (Codex, etc.)

## 0) Bootstrap commands (update if you change tooling)
- Install: npm install
- Dev: npm run dev
- Build: npm run build
- Preview: npm run preview
- Tests: npm test
- Lint: npm run lint
- Format: npm run format

## 1) Required reading order (before any work)
1) /context/track-index.md
2) /context/repo-map.md
3) /context/product.md
4) /context/architecture.md
5) /context/workflow.md
6) /context/planning-checklist.md
7) /context/active-track.md
8) Active track files (spec/blueprint/plan)

## 2) Track-index rule (the roadmap is the boss)
- /context/track-index.md defines the official track order and scope.
- When asked to "Create Track N":
  - Do NOT write code.
  - Create the track folder and generate spec.md, blueprint.md (no code), plan.md.
  - The track’s scope must match Track Index:
    - Goal, Included Steps, Acceptance, Risks, Verification.
  - Do not add extra scope unless explicitly requested.

## 3) Workflow gates (must follow)
- Do not modify code unless an active track exists with:
  - spec.md
  - blueprint.md (required unless the change is tiny)
  - plan.md
- Work in phases. Implement ONE phase per run, then stop for review.
- If reality changes the approach: write a "Deviation Note" in plan.md and update blueprint/plan before continuing.

## 4) Repo Map rule (master context index)
- /context/repo-map.md is the canonical index of the codebase.
- Every time you add a file OR substantially change a file’s role, update repo-map.md in the same phase.
- Keep each entry short (2–6 bullets). No essays.

## 5) Your constraints (hard rules)

### New system = new file
- If you introduce a new system (new state + update logic + invariants), create a new module file for it.
  Examples: rng, genetics, metabolism, perception, color, memory, behavior, combat, reproduction, metrics, input, camera.
- Do not cram a new system into an existing file “because it’s nearby”.

### Max file length
- Hard cap: no source file may exceed 600 lines.
- Soft cap: when a file approaches ~450 lines, plan a split before adding more.

## App entrypoint rule (prevent app.js bloat)
- app.js (and/or main.js) may contain ONLY:
  - boot/config loading
  - module initialization (sim, renderer, ui, input, metrics)
  - wiring event handlers
  - lifecycle control (start/pause/step)
- app.js must NOT contain:
  - simulation system logic (genetics, metabolism, perception, combat, reproduction, etc.)
  - tick-order logic (that belongs in sim/sim.js)
  - rendering draw logic (belongs in render/*)
  - input gesture math (belongs in input/*)
- If you need new logic, create a new file/module for that system and import it.
- Stricter size cap for app.js: target < 300 lines. If it approaches 300, split wiring into app/* helper modules.

## 6) Simulation invariants (never break)
- Determinism: simulation must be deterministic with a seed.
- Central RNG: all randomness must go through a single rng module.
- Tick order invariant:
  Sense → Decide → Act → Costs → LifeHistory → Regen → Metrics → Render
- Observability is required: major system changes must expose at least one metric or inspector readout.

## 7) Mobile-first requirements
- Touch controls are priority: large tap targets, drag-to-pan, pinch-to-zoom.
- Avoid hover-only UX.
- Keep UI responsive under load (use a Web Worker for sim if needed).

## 8) Plan Lint (a plan is invalid unless it has this)
Each phase in plan.md must include:
- Tasks (checkboxes)
- Files touched
- Verification checklist
- Stop point (pause for review)
Also:
- Include a checkbox reminder to update /context/repo-map.md when files/roles change.

If a phase touches any core sim formula or determinism-sensitive logic (metabolism, friction, perception, targeting, genetics/phenotype mapping, color contrast, chase scoring):
- The plan must include a task to add/update an automated test.
- Acceptable tests:
  - unit test for the function(s), or
  - deterministic scenario test (seed + N ticks + expected summary/hash/metrics)

## 9) Risk gates (ask before doing)
HIGH RISK (must ask):
- deleting files
- changing tick order
- changing core formulas (metabolism, color contrast, targeting) without updating tests
- changing build/deploy (GitHub Pages), service worker/PWA
MEDIUM RISK (notify):
- wide refactors across many files
LOW RISK (auto):
- adding tests
- adding small pure helper functions
- adding inspector metrics / UI text

## 10) Closeout (GC)
When a track is done:
- Append a summary to /context/history.md (include Track N).
- Update /context/tech-stack.md if dependencies/tools changed.
- Clear /context/active-track.md.
