# Reproducing the investigation

No new npm runtime or test dependency is added. Commands run from the repository root. Pin the baseline, rather than following future main:

```sh
git worktree add --detach ../Genetics-baseline 4fab12610d42b03dc9dc9570cbb1b93a7dbb220e
npm ci
node scripts/investigate-ecology.mjs --root=../Genetics-baseline --ticks=36000 --seeds=1,42,1337
node scripts/investigate-ecology.mjs --root=../Genetics-baseline --ticks=72000 --seeds=1,2,3,7,19,42,73,101,1337,2026
node scripts/investigate-ecology.mjs --ticks=72000 --seeds=1,2,3,7,19,42,73,101,1337,2026 --progress=true
node scripts/investigate-ecology.mjs --ticks=144000 --seeds=1 --progress=true
node scripts/controlled-ecology.mjs ../Genetics-baseline
node scripts/controlled-ecology.mjs .
node scripts/check-founder-cohorts.mjs ../Genetics-baseline
npm run verify
npm run test:soak -- --ticks=36000
```

The observer writes one JSON object per completed seed to stdout; redirect to JSONL. `--progress=true` writes sparse progress to stderr. Use separate processes/output files to parallelize independent seeds when CPU/memory allow. Reported research timings include observation and concurrent workload; use the dedicated benchmark after other jobs finish.

Controlled flags:

```sh
node scripts/investigate-ecology.mjs --root=../Genetics-baseline --ticks=36000 --seeds=1,42,1337 '--config={"creatureCount":88,"creaturePredatorCount":16}'
node scripts/investigate-ecology.mjs --root=../Genetics-baseline --ticks=72000 --seeds=42 --founder-ages=0.65
node scripts/investigate-ecology.mjs --ticks=72000 --seeds=42 --only=triangle
node scripts/investigate-ecology.mjs --ticks=72000 --seeds=42 --only=octagon
node scripts/investigate-ecology.mjs --ticks=72000 --seeds=42 --no-prey=true
node scripts/investigate-ecology.mjs --root=../Genetics-baseline --ticks=36000 --seeds=42 '--config={"colourMatePreferenceEnabled":false}'
node scripts/investigate-ecology.mjs --root=../Genetics-baseline --ticks=36000 --seeds=42 '--config={"colourCamouflageEnabled":false}'
```

The 16-predator test retains 72 herbivores by raising the total to 88, although changed spawn/RNG draws still prevent trajectory-level causal attribution. `--only` removes the other predator species after normal initialization, preserving the remaining founders/map; it does not replace them. `--no-prey` removes herbivores; emergency plant alternatives remain finite living resources. Founder-age experiments use an independent seeded age stream (`seed + 7919`) after normal initialization to preserve original phenotypes/positions and authoritative RNG state. These are diagnostic overrides, not production policies.

`variant-*.patch` preserves experimental source changes against the pinned baseline. Apply the selected patch to a fresh detached worktree with `git apply /absolute/path/to/variant-NAME.patch`, then supply that worktree as `--root`. `variant-contact.patch` is the later contact-only version including reachability; early `contact-memory.jsonl` precedes that check and is not final evidence. Final comparisons must use `final-*.jsonl`, not intermediate `contact-final-*` or `interaction-*` files. The resource-recovery pilot uses the same 0.95 resolver fallback as the subsequently explicit production default.

`summarize-ecology.py` requires Python/matplotlib for an optional static figure; it validates all ten paired outputs, derives equal-horizon births by population conservation, retains every seed, and writes `comparison.json`, `paired-results.md` and population figures. Peak population/generation values are ten-second samples, not claimed per-tick maxima. Death events give exact extinction times once the species has disappeared. Raw observation files retain full horizon, conditions and timing.

Browser checks use optional externally supplied Playwright/Chromium:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright BROWSER_EXECUTABLE=/absolute/path/to/chromium node scripts/verify-ecology-browser.cjs
node scripts/benchmark-ecology.mjs ../Genetics-baseline .
```

The driver inspects actual default worlds at successive times, a labelled observed-contact fixture, read-only rendering and mobile controls. Screenshots are lightweight optional evidence; no video/export is required. Research scripts do not enter the production bundle. Run browser scripts separately from resource-intensive batches for meaningful performance observations.

Archived raw outputs use `.jsonl.gz`; for example `gzip -dc evidence/final-1.jsonl.gz` from the track directory reads the forty-minute run. `compact-ecology.py` preserves counters/events/hashes, retains individual predator traits, and replaces redundant herbivore trait records with initial/final species distributions. `summarize-ecology.py` reads either archived gzip or fresh JSONL. `performance.jsonl` remains directly readable. The archived controls named `*-release` use the final full aging-stage fixture; earlier controlled snapshots are explicitly exploratory and are not the final ecological claims.

## PR #139 review corrections

The original long-run archives and `evidence/provenance.json` describe reviewed commit `480f599`, before the three Codex corrections. See [review.md](review.md) for the correction protocol. `evidence/review-provenance.json` records corrected source fingerprints, and `evidence/review-soak.log` records the fresh three-seed 36,000-tick checks. Do not apply the earlier full-state hashes or ten-seed population results to the corrected source.
