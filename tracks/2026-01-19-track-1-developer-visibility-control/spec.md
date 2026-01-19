# Track 1 — Developer Visibility & Control (Steps 1–5)

## Goal
Make iteration measurable and deterministic from day one.

## Includes (from Track Index)
1) FPS overlay + toggle
2) Minimal UI shell (play/pause/step/speed)
3) Seeded RNG module
4) Determinism smoke test (same seed => same summary)
5) Context pack + repo-map validation

## Acceptance
- FPS visible + toggle works on mobile and desktop.
- Seed is displayed and affects outcomes.
- Determinism check passes for N ticks.
- Repo-map updated for any new files.

## Risks
- Accidental nondeterminism (Math.random, time-based drift).

## Verification
- Manual: UI works on phone.
- Automated: determinism test passes.
