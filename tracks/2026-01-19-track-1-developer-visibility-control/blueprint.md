# Track 1 Blueprint — Developer Visibility & Control

## Scope

Deliver the Track 1 includes from the roadmap: FPS overlay + toggle, minimal UI shell controls, seeded RNG, deterministic smoke test, and context pack/repo-map validation.

## Proposed Files / Modules

- src/metrics/ (fps overlay + toggle, metrics snapshot)
- src/ui/ (play/pause/step/speed controls, seed display)
- src/sim/rng.js (central seeded RNG module)
- src/sim/sim.js (wire rng, add deterministic summary function)
- tests/ (determinism smoke test)
- context/repo-map.md (update for new/updated files)
- context/active-track.md (current track pointer)

## Data / APIs (No Code)

- RNG module exports: createRng(seed), rng.nextFloat(), rng.nextInt(min, max)
- Sim summary: a stable, deterministic summary hash or metrics snapshot after N ticks
- UI controls: start/pause/step/speed + seed display + fps toggle state
- Metrics overlay: simple FPS + tick rate display with a toggle

## Determinism Plan

- Enforce use of the central RNG module (no Math.random in sim logic).
- Add a deterministic smoke test that runs N ticks with a fixed seed and compares a summary snapshot.

## Risks & Mitigations

- Risk: hidden nondeterminism via time-based values.
  - Mitigation: avoid Date/performance usage in sim logic; ensure summary uses only sim state.
- Risk: UI/metrics drawing causes mutation.
  - Mitigation: renderer/metrics read-only views; sim state mutation only in sim modules.

## Verification

- Manual: verify FPS overlay toggle on desktop + mobile.
- Automated: determinism test passes with a fixed seed.
