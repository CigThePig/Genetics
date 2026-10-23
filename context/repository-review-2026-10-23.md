# Bug and behaviour review — 2026-10-23

Baseline: `0b9fa92` (main after PR #142). No open PRs were present at review start.

## Review scope

Reviewed simulation orchestration, movement/navigation, exploration, perception/visibility,
chase/combat, feeding and carcasses, reproduction/commitments, mortality, pack/locomotion,
spatial indexing, and app configuration/loop and terrain-cache boundaries. This is a targeted
correctness review, not a claim that every line or ecological outcome is verified. Existing
baseline tests passed: 296 tests in 22 files.

## Confirmed defects and repairs

| Area         | Reproduction and impact                                                                                                                                                                                                                             | Repair                                                                                                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Navigation   | At `(1.8, 1.8)` with water at `(2, 1)`, a route toward `(3.5, 2.5)` discards the necessary `(1.5, 2.5)` corner because it is within 0.9 tiles. The next segment crosses water, so routing returns null repeatedly and movement brakes indefinitely. | Only skip waypoints after verifying the bypass is traversable. Cover both fresh and cached routing and 600 movement ticks around the obstacle.                                             |
| Exploration  | Random food/water/mate exploration checks destination terrain, but not connectivity. On a divided test map, 40 of 100 sampled goals were unreachable; the old commitment remained until arrival, which could never happen.                          | Validate sampled land goals with the existing world-owned navigation system before retaining them. Rejected samples return no goal and the next decision advances the exploration heading. |
| Reproduction | Eligible animals on opposite banks can conceive when Euclidean distance is within mating range, even though water prevents contact. This occurs with and without active commitments.                                                                | Require a clear land segment at conception. Keep observation/target acquisition separate and preserve valid partner commitments while contact is obstructed.                               |
| Predation    | A charging predator can catch and kill nearby prey diagonally through a water corner despite movement rejecting that crossing.                                                                                                                      | Require a clear land segment before recording a successful catch; retain pursuit while the animals remain visible.                                                                         |

These fixes reuse the existing terrain traversal rule and do not change the tick order,
random-stream ownership, population settings, reproductive probabilities, diets or survival
parameters. Historical seeded trajectories can change because corrected decisions affect
subsequent behaviour. Equal seeds/configuration/ticks must still replay identically.

## Verification

The five new cases in `tests/maintenance-behaviour.test.js` all failed against baseline
production code and pass with the repairs. Positive controls verify movement arrives around
the obstacle and that mating/capture work after the obstruction is removed.

- `npm run verify`: 301 JavaScript tests in 23 files, lint, formatting and production build passed.
- `python -m unittest discover -s tests -p 'test_demography_report.py'`: 12 tests passed.
- `npm run test:soak -- --ticks=3600`: seeds 1, 42 and 1337 passed finite-state,
  bounds, unique-ID and population-accounting checks (10,800 total ticks).
- Existing equal-seed replay tests passed. The older mate-contact regression now waits
  for a reachable replacement sample before checking retention; it previously asserted
  retention of the unreachable destination being repaired.

| Seed | Ticks | Final population | Kills | Deaths | Births |
| ---- | ----- | ---------------- | ----- | ------ | ------ |
| 1    | 3,600 | 80               | 0     | 0      | 0      |
| 42   | 3,600 | 80               | 0     | 0      | 0      |
| 1337 | 3,600 | 78               | 2     | 2      | 0      |

Each soak covers 60 simulated seconds. The controlled reproduction tests provide the
mating regression evidence; no births occurred in these short default-world runs.

## Limits

The seeded checks are short correctness smoke runs, not multi-generational population-balance
evidence. No UI/rendering code changed; no new browser visual validation was performed.
Exploration uses the existing bounded navigation cache; no mobile performance improvement is
claimed. This review does not implement Track 12 or solve all possible causes of blocked
resource pursuit, demographic decline or spatial isolation.
