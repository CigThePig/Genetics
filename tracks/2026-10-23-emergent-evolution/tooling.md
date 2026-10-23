# Reproduce the investigation

Install with `npm ci`. Baseline main is `b0985754ef70fd4bc6517bafa16e522bbb134000`; production candidate is `da9764494cb015f8257dcc4c7d326b02224de2cc`. The incremental `evidence/source.bundle` preserves that exact experimental commit on top of baseline main; fetch it before recreating the candidate worktree. Later changes in this track are verification/tooling/documentation unless explicitly noted. The recorder refuses to overwrite existing outputs and uses an exclusive output lock.

```sh
git worktree add --detach ../Genetics-baseline b0985754ef70fd4bc6517bafa16e522bbb134000
node scripts/investigate-evolution.mjs --root=../Genetics-baseline --seed=1 --ticks=72000 --out=/tmp/baseline-1.json.gz
git fetch tracks/2026-10-23-emergent-evolution/evidence/source.bundle HEAD
git worktree add --detach ../Genetics-candidate da9764494cb015f8257dcc4c7d326b02224de2cc
node scripts/investigate-evolution.mjs --root=../Genetics-candidate --seed=1 --ticks=72000 --out=/tmp/final-1.json.gz
node scripts/controlled-evolution.mjs --out=/tmp/controlled.json.gz
node scripts/controlled-evolution.mjs --energyBudget=1 --deadline=20 --out=/tmp/controlled-weak.json.gz
node scripts/evolution-mechanisms.mjs /tmp/mechanisms.json
```

Use the full **predefined** seed set 1, 42, 1337, 2, 7, 19 for wild pairs. Longer canonical records have separate filenames and horizons; never pool their endpoints with the 72,000-tick sample. Runs record the full resolved config, seed, tick duration, source commit, Node/platform, final actor SHA-256, distributions every 1,800 ticks and copied lifetime records. Offline observations never modify agents or RNG. Measurements taken during concurrent experiments are not performance benchmarks.

`birthTick=0` denotes founders. `generation` is maximum pedigree depth, not a synchronized generation count. `matureTick` uses the actual inherited effective-age reproductive threshold, not displayed adult movement stage. Children are completed births; mature children reached reproductive maturity. Living immature careers and living adult careers are censored. Founding careers are complete at 1,200 seconds in the default model. Sex loss may leave a census that cannot reproduce. Reproductive output counts each real parent once per child; an individual with offspring is not necessarily a persisting lineage. Founder-weighted differentials are descriptive associations, not proof of selective causation. Activity is sampled each second, so brief episodes can be missed.

Controlled populations have 1,000 organisms and 30 non-overlapping externally sampled generations, ten seeds (1, 42, 1337, 2, 7, 19, 73, 101, 2026, 3). Exactly matched founder draws precede each treatment. Production genetic/trait functions are used. Selection weights represent the remaining energy or deadline margin for a 30-tile traversal; they are **imposed only in this offline assay**, never production fitness bonuses. Reversal changes deadline to energy halfway through. Neutral treatment gives equal reproductive weights. Mutation-off also removes inheritance noise. These tests distinguish hereditary response and drift, not natural ecosystem adaptation. Once treatments diverge, random mating/genetic draws do not guarantee paired individuals or random-number parity.

The 96 engine fixtures isolate existing causal mechanisms using actual production metabolism/movement, eligibility, conception, birth and inheritance. Species share three seeds and deterministic favorable conditions; the 12 cases per cell are not 12 independent ecological replicates. One-tick gestation, probability-one conception and external opportunity times are explicit fixture assumptions. No environmental resources, reproductive success or adaptive traits are supplied to normal worlds.

```sh
python scripts/plot-evolution.py tracks/2026-10-23-emergent-evolution/evidence
python scripts/summarize-evolution.py tracks/2026-10-23-emergent-evolution/evidence
npm run verify
npm run test:soak -- --ticks=36000
node scripts/benchmark-demography.mjs ../Genetics-baseline .
PLAYWRIGHT_MODULE=/absolute/path/to/playwright BROWSER_EXECUTABLE=/absolute/path/to/chromium node scripts/verify-evolution-browser.cjs
```

The browser tool starts a bounded Vite server, observes seed 42 in both modes at 0/60/180 seconds, saves actual screenshots and copied predator state, checks read-only rendering, desktop/touch-width distributions, species/trait controls and reset. It uses test-only app-handle injection, not a production global. Playwright/Chromium are external tools, not application dependencies. Recordings are paused deterministic playback, not a frame-rate certification. `benchmark-demography.mjs` alternates source order, includes warmup, compares equal 80/240/480-actor workloads and asserts equal pre-birth actor hashes. This is shared-host Node throughput, not physical-phone FPS.

Regenerate figures and benchmarks before the final summarizer call: it validates the complete canonical matrix and identical founders, then refreshes artifact checksums. Original recordings rely on their pinned source commit plus the separately audited fingerprints; newer recorder versions also embed a starting source fingerprint and reject source changes during recording. Interrupted recorders may leave an empty `.lock` directory; remove that lock only after verifying the corresponding recorder has stopped.

## Continuation safeguards

`investigate-evolution.mjs` now exports `recordEvolution` for full-engine fixtures. Its activity, distribution and progress periods are 1, 30 and 600 simulation seconds, derived from configured TPS; records include sampling metadata and snapshot seconds. Birth/maturity/death detection remains every tick.

The original matrix summarizer authenticates clean source fingerprints against pinned audit values. Historical files without inline fingerprints are accepted only when their exact compressed bytes match the original PR commit's SHA-256 catalog; this narrow exception is not available to new or edited recordings. The historical artifact contents are preserved. `python -m unittest discover -s tests -p 'test_*.py'` exercises rejection paths and is now run in CI.

`natural-evolution.mjs --out=...json.gz --seed=1 --habitat=forest --seconds=1200` runs a documented constructed habitat with the complete simulation engine. `--transfer=...json.gz` initializes new organisms from living descendant genomes of that source; positions, sex assignment, initial age and reserves are newly standardized, memories are fresh. It refuses missing source species. No automatic transfer or ecological intervention occurs in gameplay.

## Full-engine ecological continuation

Read [the continuation report](continuation.md) before interpreting these fixtures. Ordinary worlds and constructed ecology are separate evidence levels. `natural-evolution.mjs` supports `--root`, `--water=edge`, `--polymorphism=alertness`, `--remove-predators=1`, `--transfer` and `--mode=blended`; all interventions are initial-only and recorded. Missing donor species abort rather than receiving replacement genomes. The CLI exclusively claims output with a lock and refuses overwrite. `runner-v1.mjs.txt` archives an intermediate runner; another immutable version is in the source bundle. Their byte hashes are audited.

`analyze-natural-evolution.py <continuation-directory>` verifies the full registered matrix, clean source fingerprints against Git objects, pinned configuration, runner versions, transfer source hashes and matched founders. It writes a compact `analysis.json` and compressed per-run details in `analysis-runs.json.gz`. `--partial` is only for exploration. Mature-child fitness uses the configured effective-age reproductive threshold; descendant careers at the horizon remain right-censored. Founder selection versus matched mature-child response separates reproductive weighting from transmission/mate contribution; it does not identify mutation alone. Neutral markers are descriptive controls, not an automatic adaptation test.

Reproduce alternating equal-actor profiles after other simulation jobs finish:

```sh
node scripts/benchmark-demography.mjs --allow-behavior-change /path/to/baseline /path/to/final > /tmp/profile.jsonl
node scripts/profile-evolution.mjs /tmp/hot-paths.json /path/to/baseline /path/to/final
```

The flag preserves equal actor-count checks while permitting intentional behavioral trajectories to differ. It does not remove the original default hash-equality assertion for inheritance-only comparisons. Three alternating trials at each 80/240/480 actor workload are archived. Instrumented stage timing and bounded-history JSON size are supplementary diagnostics, not physical heap or mobile FPS certification.

The optional browser runner accepts `EVOLUTION_BROWSER_ROOT`, `EVOLUTION_BROWSER_MODES`, `EVOLUTION_BROWSER_TIMES`, `EVOLUTION_BROWSER_OUT` and `EVOLUTION_BROWSER_QUICK`, alongside the external Playwright/executable paths. Normal-run observations use one-second traces of the first founder per species, 0/60/180-second screenshots and desktop/390-pixel UI/reset checks. Paused/manual-tick screenshots do not measure render FPS. Browser source fingerprints and version are recorded.
