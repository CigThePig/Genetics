# Reproduction and measurement definitions

Start from the PR source. The baseline is c1163f6dc5c17fecc5bf3672346735abf7941801.

```sh
npm ci
git worktree add --detach ../Genetics-baseline c1163f6dc5c17fecc5bf3672346735abf7941801
node scripts/investigate-demography.mjs --root=../Genetics-baseline --ticks=72000 > baseline.jsonl
node scripts/investigate-demography.mjs --ticks=72000 > revised.jsonl
python scripts/archive-demography.py baseline.jsonl.gz --ticks=72000 --expect-seeds=1,2,3,7,19,42,73,101,1337,2026 baseline.jsonl
python scripts/summarize-demography.py baseline.jsonl.gz
node scripts/controlled-demography.mjs ../Genetics-baseline > controlled-baseline.jsonl
node scripts/controlled-demography.mjs . > controlled-final.jsonl
node scripts/investigate-demography.mjs --seeds=1 --ticks=144000 --checkpoints=72000 > extended.jsonl
npm run verify
python -m unittest discover -s tests -p 'test_demography_report.py'
npm run test:soak -- --ticks=36000
node scripts/benchmark-demography.mjs ../Genetics-baseline .
```

The predefined seeds are 1,2,3,7,19,42,73,101,1337,2026. A checkpoint emits a complete observed cohort/trajectory record without restarting the RNG. The recorder accepts a JSON config override and a separately seeded diagnostic founder-age fraction. Source/recorder fingerprints, revision, resolved config and a final creature/summary hash accompany each record.

Birth, death, parentage, conception transition and maturation observations are per tick. Opportunity exposure is sampled every 60 ticks: maturity, adequate reserves, readiness after pregnancy/cooldown, an eligible opposite-sex partner anywhere, proximity, actual visibility and mating intent. That global census is never available to animals. Euclidean proximity is not a path-distance measurement. Static topology reconstruction separately checks birth land components.

A live immature offspring is right censored, not a juvenile death. Live adults have incomplete reproductive careers. Mature daughters per founding female are observed founding-cohort output, not an intrinsic biological R0. One-second animal-time rate denominators are approximate; raw deaths are never labelled mortality rates. Brief contacts may fall between samples.

The report reconstructs the last post-tick census with both mature sexes from maturity/death events. This is a global potential pair, not proof of simultaneous reserves, access or perception. Juveniles may restore a temporarily absent pair. A surviving one-sex census with no active pregnancy cannot produce a future opposite-sex pair in this closed sexual model; the converse does not guarantee viability.

The stationary assay uses actual metabolism, aging, conception, gestation, inheritance, costs and death while bypassing movement/perception. Favorable treatments explicitly replenish reserves; limited treatment supplies neither resource. Counts 2/4/12 are nested prefixes of one twelve-founder genome/sex pool. Travel and resource competition are removed, while additional founders still offer more local partners. This does not isolate field density from population size or predict predator/prey carrying capacity. Separated founders remain beyond interaction range; same-sex controls retain normal sex rules.

Mixed-age founders draw independently from 0–65% of genetic lifespan. This changes residual lifetime and initial overlap as well as synchrony, so it is not a clean synchronization coefficient. Founding age randomization is not adopted.

To create the passive-counter ablation, make another baseline worktree and replace exactly the two newborn assignments from parental cooldown to zero. Then run:

```sh
node scripts/check-demographic-replay.mjs ../Genetics-newborn-only .
```

The replay compares serializable world/creature state, including navigation Map/Set contents, after removing only the added counters. The direct regression also compares next RNG output with metrics disabled.

The completed hosted recovery regenerated the full predefined matrix, assays, canonical soaks, replay, browser and performance records. Its publisher audited birth/death and pregnancy conservation, checked all expected seeds/horizons and committed compact archives/manifests to this PR branch. Raw records are source-pinned; do not relabel the recovered local snapshot as hosted output. The one-off recovery/browser workflows were removed after publication. The reusable scripts and source-pinned manifests remain. Browser output uses `ECOLOGY_BROWSER_OUT`; run `node scripts/verify-ecology-browser.cjs` with Chromium available.

Node benchmark windows use identical initial actors at 80/240/480 animals, three alternating-order trials, 120 warmup plus 600 measured ticks. Actor hashes must match between revisions. These early windows precede reproduction and measure engine overhead at equal population, not total cost of different later growth. Cloud Chromium/viewport results do not certify a physical phone.

## Publication validation after Codex review

Run `python scripts/publish-demographic-evidence.py incoming <final-source-commit> <workflow-run-url>` from the repository root with both baseline and final commit objects available locally. The publisher computes expected source fingerprints from committed `src` paths/bytes, then checks every ecological and controlled row before writing outputs. Correct seeds and horizons alone are insufficient. New controlled recordings embed revision and source fingerprints; historical controls lacking those fields are rejected by the new publisher rather than silently relabelled.

Exactly one incoming copy of each diagnostic is required: `performance.jsonl`, `browser-results.json`, `replay.jsonl` and `soaks.jsonl`. Missing or duplicate diagnostics fail preflight even when an old output exists. The manifest lists explicit publication products, not arbitrary files remaining in the evidence directory. See [review dispositions](review.md) for historical provenance limits and regression evidence.
