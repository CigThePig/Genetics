# Publication status

This draft currently contains diagnostic evidence only. The implementation and regression tests were completed and validated locally, but the execution environment went offline before their source files could be uploaded.

The source changes are not yet in this pull request. Local validation results below apply to the prepared implementation, not to this evidence-only branch. The branch should remain a draft until the source is recovered, uploaded and checked by CI.

## Completed investigation

Corrected main was pinned at `4fab12610d42b03dc9dc9570cbb1b93a7dbb220e`. Ten paired seeds ran for at least 72,000 ticks at 60 ticks per second: 1, 2, 3, 7, 19, 42, 73, 101, 1337 and 2026. Seed 1 also ran for 144,000 ticks on both revisions.

Predators primarily failed to replace aging founders. Across the ten twenty-minute baseline runs, 80 predator founders produced 11 offspring; 77 predator deaths were age and 14 thirst. Both predator species disappeared in all ten seeds.

The implemented resource-arbitration fix lets animals finish an available meat meal or drink toward near-full existing capacity while still yielding to emergency competing needs. It repairs premature switching caused by relative hunger/thirst scores. Additional prepared changes address visible mating opportunities, bounded observations of potential mates, actual capped food-energy counters and explicit predation accounting.

Initial populations, hunting parameters, food nutrition/yield, reproductive eligibility, gestation, cooldowns and lifespan were retained. No population floor, respawning or guaranteed reproduction was added.

## Measured outcomes of the prepared implementation

At twenty simulated minutes:

- Triangle census extinction: 10 of 10 baseline runs versus 5 of 10 revised runs.
- Octagon census extinction: 10 of 10 versus 3 of 10.
- Predator births: 11 versus 112.
- Both herbivore species survived every run.
- Sampled living descendant generation reached four for triangles and six for octagons.
- Only two triangle populations and one octagon population retained both sexes.

These results do not establish long-term equilibrium. In the forty-minute seed-1 run, octagons disappeared at 1,023.28 seconds and the last triangle died of age at 1,231.12 seconds. Many twenty-minute census survivors were already reproductively stranded.

## Local verification, pending source publication

The prepared implementation passed `npm ci`, `npm run verify` with 215 tests, lint, formatting and production build, and `npm run test:soak -- --ticks=36000` across seeds 1, 42 and 1337. Independent final diagnostics and soaks matched complete creature/summary hashes exactly.

Real Chromium checks covered observed-contact movement, finite-resource recovery, read-only rendering and mobile controls. Separate Node measurements recorded initial 80- and 240-animal workloads. Failed threshold-only, founder-count/age, contact-only and other experiments are retained in the archives.

The archived `.jsonl.gz` files contain compressed telemetry and can be read with `gzip -dc FILE.jsonl.gz`. Scripts, source patches, full interpretation, regression tests and the detailed report remain in the offline workspace and still need publication.

## Recovery location

Prepared workspace: `/workspace/scratch/261fc0bb0819/Genetics`.

Local branch: `feat/predator-ecology-investigation`.

Validated staged tree: `b7a89c63e9ac103b82bd847cb8298d039178d66a`.

Detailed local report: `tracks/2026-10-21-predator-ecology/evidence.md`.

No merge or deployment was performed.
