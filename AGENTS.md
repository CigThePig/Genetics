# Agent guidance

## Scope and context

- Follow the user's current request. The roadmap supplies default scope; explicit maintenance, review fixes and multi-phase requests can override its order.
- Start with `context/active-track.md` and `context/repo-map.md`, then read the relevant source, tests and design documents. Read `context/architecture.md` before simulation changes and `context/product.md` for product decisions. Read active track files when working on that track.
- This file is the canonical agent guidance. `context/workflow.md`, `context/planning-checklist.md` and `context/code-style.md` expand it. Completed track plans, old prompt files and dated reports are historical evidence, not additional standing rules. Check current code before relying on their claims.
- Inspect the working tree before editing; preserve unrelated user changes. Keep changes within the requested scope.

## Plan and execute

- Scale planning to the work. Small fixes can use a concise task/verification checklist in the PR; substantial features or cross-system work should use a track with spec, blueprint and phased plan. Do not create duplicate documents for routine follow-ups.
- A request specifically for planning or creating track documents stays planning-only unless implementation is also requested.
- Keep `context/active-track.md` accurate for substantial work: identify the track or maintenance scope, current phase and next task. Update at meaningful checkpoints and clear it at closeout.
- Verify each phase, record progress and continue through the authorized scope. Pause only for a real blocker, an explicit review checkpoint requested by the user, or a decision outside that scope. A phase boundary alone does not require a new conversation.
- If evidence changes the approach, update the affected plan/design and explain the material deviation. Avoid unrelated refactors.
- Routine reversible edits, including removing obsolete files within scope, do not require separate approval. Ask before destructive actions outside the request, discarding user work, merging or deploying unless already authorized. Explain broad refactors or behavior changes with their purpose and validation.

## Code organization

- Choose module boundaries by responsibility, state ownership, coupling and testability. Extract a module when it improves these properties; extend an existing cohesive module when appropriate. There are no file-length caps or size-triggered split requirements.
- Keep entrypoints focused on initialization and wiring. Simulation orchestration belongs in `src/sim/sim.js`, rendering in `src/render/`, and gestures in `src/input/`; app lifecycle helpers live in `src/app/`.
- Follow `context/code-style.md`. Prefer data-driven species differences and per-creature traits over duplicated engines.

## Simulation correctness

- Seed + initial configuration + the same tick sequence must replay identically. Simulation randomness comes from the passed seeded RNG; no wall clock or `Math.random()` in authoritative logic.
- Preserve the major tick order: Sense → Decide → Act → Costs → LifeHistory → Regen → Metrics. Changes require an explicit design rationale, regression coverage and documentation of behavioral impact.
- Rendering reads simulation state without mutating it. State and caches belong to their simulation/world; avoid hidden mutable singletons and cross-instance coupling.
- Current herding decisions are synchronous. A worker design must preserve deterministic tick boundaries and state ownership; asynchronous completion order must not affect outcomes.
- Respect units, configured meter bases and trait-first lookup. Keep config defaults, editor metadata, validation and runtime resolvers consistent. See `context/architecture.md` for details and known design/runtime differences.
- Preserve metrics and inspector explanations; add or update observability when needed to understand changed behavior.

## UI and verification

- Support touch, usable tap targets, drag/pinch controls and narrow screens. Avoid hover-only interactions. Measure performance before adding concurrency or restructuring hot paths.
- Add meaningful regression coverage for bug fixes and determinism-sensitive changes, including core formulas, targeting and trait mapping. Documentation-only edits need consistency/link checks, not artificial tests.
- Install with `npm ci`; develop with `npm run dev`. `npm run verify` runs tests, lint, formatting checks and production build. Use `npm run format` for formatting and `npm run test:soak -- --ticks=N` for seeded simulation checks when relevant.
- Exercise affected UI/lifecycle flows in a browser when available. Report exact checks and limitations; distinguish local results from hosted CI and short smoke runs from long-run balance evidence.

## Closeout

- Update `context/repo-map.md` for meaningful new modules or changed responsibilities, and `context/tech-stack.md` when tools/dependencies change.
- Record substantial completed work and verification in `context/history.md`; keep detailed evidence in the track or a dated report when useful. Preserve historical results as snapshots, clearly labeled when superseded.
- Summarize what changed, why, verification and remaining limitations. Keep the active-work pointer consistent with the final status.
