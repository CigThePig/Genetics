# Reproduction and interpretation

`npm ci`; `npm run verify`. Node tools require no additional application dependency. `verify-spatial-ecology.mjs` accepts `--root`, `--seeds`, `--ticks`, JSON `--config`, optional `--trails=true` and `--out`. It writes one JSON per completed seed plus periodic progress to stderr. Every report contains source revision, full tracked-src + runner SHA-256 fingerprint, overrides, deterministic outcome fingerprint and wall-clock measurements. Timing and heap values are excluded from the outcome hash. Do not compare wall-clock data from concurrent soaks as isolated performance.

```sh
# Recover exact local experimental Git objects from the incremental archive.
# The repository already contains prerequisite main 5740523.
git fetch tracks/2026-10-22-spatial-ecology/evidence/source-experiments.bundle refs/heads/feat/spatial-population-ecology:refs/heads/spatial-experiment-snapshots
# Passive baseline of main 5740523, instrumented without behavioral changes:
git worktree add /tmp/spatial-baseline 6c5027d
node scripts/verify-spatial-ecology.mjs --root=/tmp/spatial-baseline --seeds=1,42,1337 --ticks=108000 --out=/tmp/baseline
# Final behavior (default groups=2; group=1 disables multiple communities):
node scripts/verify-spatial-ecology.mjs --seeds=1,42,1337 --ticks=108000 --out=/tmp/final
# Short broad sample, same horizon on both roots:
node scripts/verify-spatial-ecology.mjs --seeds=2,3,7,19,73,101,2026 --ticks=36000 --out=/tmp/broad
# Explicit experimental revision d674d8f contains the rejected familiarity candidate.
# Reproduce old ablations with --root pointing to that revision. Its defaults use
# one founder community and familiarity=0; water preference defaults on.
node scripts/verify-spatial-ecology.mjs --root=/tmp/experimental --seeds=1,42,1337 --ticks=36000 --config='{"creatureFounderGroups":2,"creatureWaterPreferLocal":false}' --out=/tmp/founders-only
node scripts/verify-spatial-ecology.mjs --root=/tmp/experimental --seeds=1,42,1337 --ticks=36000 --config='{"creatureFamiliarityWeight":1,"creatureWaterPreferLocal":false}' --out=/tmp/familiarity-only
node scripts/analyze-spatial-ecology.mjs --inputs=/tmp/baseline,/tmp/final --out=/tmp/analysis.json
PLAYWRIGHT_MODULE=/path/to/playwright BROWSER_EXECUTABLE=/path/to/chromium node scripts/verify-spatial-browser.cjs --duration=12000 --out=/tmp/browser
```

Positions and distances are tiles; default timebase is 60 ticks/second. Path distance is accumulated every observed live tick; sampled home-range occupancy counts visited 4×4 tiles once per simulated second. That count is a sampled footprint, not a utilization-distribution estimate. Alive actors are right-censored, and death-tick movement after removal is omitted. Maximum/net natal displacement, habitat transitions and social group changes are descriptive. A social ID change does not necessarily mean a biological population merge. No arbitrary regional label is assigned to offspring.

Conceptions are observed on pregnancy transitions. Actual mating distance is measured from parental positions; natal mating distance uses copied birthplaces. The first three initial-baseline reports used a previous observer that measured paternal previous-tick positions and looked up the wrong herbivore group key; use their natal distances, movement and demographic metrics, but not precise physical mating distances or group-change counts. New reports use current paternal positions and `herding.groupId`. Initial runs were loaded before later behavioral edits; their module graph is the passive 6c5027d snapshot. Later reports fingerprint source files at launch. Source revision plus overrides, rather than output directory names, establish behavior.

Sixteen diploid marker loci use independent Mendelian segregation, whereas functional traits use existing blended inheritance with noise/mutation. Markers begin randomly per individual, never per region. No neutral mutation is modeled, so lost neutral diversity cannot regenerate. Neutral structure can reflect founder sampling, family groups and drift; it does not prove selection or speciation. G_ST partitions expected heterozygosity: (H_T − H_S) / H_T with size-weighted regional frequencies. Regions need at least five animals; fewer than two qualifying regions or monomorphism yields null. The offline analyzer shuffles complete marker vectors over positions fifty times, and repeats observed bins at 20/40 tiles. The shuffle is a descriptive finite-sample reference, not an independent-sample significance test. Results depend on bin placement/size, ancestry and sparse sampling. Neutral loci are not a biological realism claim.

Maximum pedigree depth is not completed non-overlapping generations. Reproducing descendants and unique parents of actual births supply stronger turnover evidence. The sex-ratio breeder proxy is explicitly not an effective-population-size estimator. Habitat trait means are occupancy associations, not proof of adaptation; controlled selection and reproductive-fitness evidence would be needed for that claim.

## Archive format and rejected range replay

`evidence/*/seed-*.json.gz` use `spatial-report-deduplicated-v1`. Immutable per-individual genome/neutral/birth metadata are factored into `individuals`; each frame retains current positions and habitat. `scripts/spatial-report.mjs` expands these observations transparently for the analyzer, which accepts both plain JSON and compressed archives. Tracked body-colour, mate-choice, speed, longevity and growth loci are retained; other cost loci are omitted after fingerprinting and can be recovered by exact-source replay. This reduces redundant evidence substantially. The manifest hashes the actual archived bytes. Original raw outcome fingerprints remain replay identifiers, not hashes of the normalized archive.

To replay the rejected persistent-success range, create a worktree at **6dcc903** (full UI/tool snapshot; authoritative model matches d82ed04). Use the current runner with `--root=/tmp/range-experiment --config='{"creatureResidencyWeight":1.2}'`. The near-zero directional-choice control uses weight 0.000001. The production application has neither this configuration key nor its implementation. Browser reproduction of that candidate requires running the archived app/worktree, with its own `npm ci`, rather than passing the removed key to production.

`benchmark-spatial.mjs --baseline-root=/tmp/original --experimental-root=/tmp/range-experiment` optionally includes that retired candidate. Create the original worktree at **5740523**. Omit `--experimental-root` for the production-only comparison. Run with `node --expose-gc`; negative GC deltas are noisy and not evidence of negative allocation. `plot-spatial-ecology.py` and `summarize-spatial.py` regenerate figures/tables from analyzer output; use the same archived cases and horizons when comparing variants.
