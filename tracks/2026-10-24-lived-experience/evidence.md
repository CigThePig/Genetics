# Animals with a past: implementation and evidence

## What the last PR made possible

Merged PR #144 preserves inherited alternatives and gives vigilance a real ecological cost. Its evidence explicitly does not establish sustained natural adaptation or resolve the subjective experience of watching the world. This continuation adds individual learned history and makes factual lives visible.

An animal can remember a dangerous place, choose a different roaming route, have children, die, and leave living relatives that the observer can follow. Names are field labels, not invented personality. No rescue, assigned fitness, forced births or habitat-directed inheritance is added.

## Implemented

- At most three copied personal danger sites; 45-second default retention, fading strength, zero-disable editor control. Only visible predators within the animal's accepted escape state teach a site. Social alarms alone cannot teach one.
- Reachable discretionary routes are ranked by remembered segment exposure. All-risky routes remain usable. Water/food/mating and social reunion retain authority; experienced danger invalidates an old exploration goal. Memories stay individual and are not inherited.
- A field notebook in the inspector: stable observer name, generation, distance travelled, flight episodes, offspring count, parent IDs, living-family buttons and twelve recent factual milestones.
- Exact death causes from the death system and 128 recent copied memorials. A living-child button continues camera following after a parent's death. Posthumous births update retained parental records.
- World-time event timestamps survive TPS changes; reset replaces all records. Simulation observation is separate from rendering and consumes no randomness.

## Verification

`npm run verify` passed all 320 pre-existing tests and the first six new tests (326 total), lint, formatting and production build. Two additional targeted cases then passed with the complete eight-test new suite: all-danger route fallback, bounded milestones and TPS edits. Final lint/format checks include the added tooling and documentation. No production source changed after full verification.

Three 3,600-tick comparisons against merged `48297bf`, with place memory disabled, match all ecological creature fields, metrics and runtime RNG outputs exactly after removing only the new passive story/experience fields. Repeated observation and inspector rendering cannot change ecological state. The raw [passive checks](evidence/passive.jsonl) and reusable runner preserve this result.

Real Chromium 153 at 1280×900 and 390×844 verified selection, passive inspector reads, authoritative injury memorial, living-child camera follow, 44px family tap targets, no horizontal card overflow, and reset clearing. Zero page errors. The death/child interaction uses an explicit lifecycle fixture; screenshots show ordinary default-world inspection at 120 ticks. This is viewport emulation, not physical-phone certification. [Browser results](evidence/browser/results.json).

## Ordinary ecology: six 36,000-tick runs

Three predefined seeds, paired memory off/on, 120×160 default world, 80 founders, 60 TPS: **216,000 total ticks**, ten simulated minutes per world. Every tick checks finite positions/meters, bounds, population accounting, three-site/twelve-event/128-memorial limits. All six runs passed. These are descriptive trajectories, not an estimate of long-run equilibrium or proof of adaptive evolution.

| Seed | Births off → on | Predation deaths off → on | Final square/circle/triangle/octagon off → on | Cautious actor-second samples on |
| ---- | --------------- | ------------------------- | --------------------------------------------- | -------------------------------- |
| 1    | 168 → 182       | 27 → 24                   | 86/63/3/4 → 86/73/7/2                         | 4235                             |
| 42   | 166 → 157       | 31 → 25                   | 57/86/4/4 → 63/78/3/4                         | 3603                             |
| 1337 | 151 → 173       | 26 → 36                   | 70/62/4/2 → 67/75/6/10                        | 4209                             |

The consequences differ by world: seed 42 has fewer predation deaths and fewer births, while seed 1337 has more of both and more surviving predators. This is not a universal survival improvement. Controlled tests establish that remembered danger changes route choice; later ecological differences also include changed RNG consumption and cascading interactions. These endpoint pairs cannot isolate every causal pathway.

“Cautious samples” count once per simulated second per living animal when a discretionary goal was chosen after encountering remembered exposure, while actually wandering/grazing and not fleeing. They are not unique animals, successful evasions, or route length saved. World lifetime counters and hashes are in the six raw JSONL rows. Elapsed times were measured during concurrent runs with tests/browser work and must not be used as comparative performance benchmarks.

## Provenance and reproduction

Production source was unchanged throughout the runs and matches published source commit `116942249cf222805de509d13761425d1c59762c` (tree `3b90e3cdf2f306cd476a4070fc7c25c2e209684a`). Runs began in the local working tree before that identical tree was published. The manifest supplies SHA-256 hashes of every source file and each evidence artifact; it is an archive checksum, not independent attestation of execution. Protocol defaults are archived; only seed and `creatureDangerMemorySeconds` vary between the ordinary treatments. Node 24.22.1, Linux x64.

```sh
npm ci
npm run verify
node scripts/verify-lived-experience.mjs 1 36000
node scripts/verify-lived-experience.mjs 42 36000
node scripts/verify-lived-experience.mjs 1337 36000
git worktree add --detach /tmp/genetics-baseline 48297bf
node scripts/verify-lived-passive.mjs /tmp/genetics-baseline
PLAYWRIGHT_MODULE=/path/to/playwright BROWSER_EXECUTABLE=/path/to/chromium node scripts/verify-lived-experience-browser.cjs
```

Playwright and Chromium are external validation tools, not repository dependencies. The usual browser download failed in this environment; Chromium was obtained through the `@sparticuz/chromium` package and its binary used for the successful run.

## Limits and next questions

This makes acquired history consequential and observable. It does not prove that the original evolutionary vision is achieved. Only herbivores using the existing herd escape system learn these danger sites; predators retain their existing pack/search behavior. Social following can outweigh place caution. The notebook is bounded, not a complete genealogy: old memorials and old milestones are evicted, and family buttons show up to eight living direct relatives. No multi-generation selection assay, new full-engine performance benchmark, physical mobile test or automatic dynasty continuation is claimed.

![Mobile field notebook](evidence/browser/mobile.png)

## PR #145 review follow-up (2026-10-24)

All four review findings are addressed:

- Route departure discounts require a nonnegative initial distance derivative relative to each site. Along a straight segment this ensures clearance never decreases. The reported (0,0) → (18,0), danger (1,0) counterexample now scores 1, versus about 0.714 moving away to (-6,0). Tangent and on-site departure remain possible.
- Reinforced sites move to the newest observation position before bounded eviction. A/B/C/A/D retains C/A/D, with copied positions and the existing three-site/time limits unchanged.
- The inspector owns a persistent story card per selected life/status. Keyed family buttons remain connected while relatives survive; the milestone list remains the same scrollable node and only replaces its entries when events change, retaining scroll offset. Numeric inspector details continue refreshing separately. Selection, death, expired memorials and reset replace/clear the appropriate card.
- Three jsdom UI regressions run in the normal Verify test job; they check node identity, focus, event updates, scroll state, living/memorial family follow, relatives arriving/dying, and clear/expired-record behavior. Two added simulation regressions cover the route counterexample and reinforced eviction.

Actual browser checks in Chromium 153 held mouse/touch input over six animation frames while the app tick/frame loop ran. Desktop 1280×900 and mobile-sized 390×844 each passed living and memorial family follow, retained scroll and list/button identity. The existing passive-inspector, exact-death, 44px target, overflow and reset checks also passed with zero page errors. This is browser-emulated touch, not a physical phone. Reproduce with external Playwright/Chromium via `PLAYWRIGHT_MODULE`, `BROWSER_EXECUTABLE` and `EVIDENCE_OUT=tracks/2026-10-24-lived-experience/evidence/review-fixes/browser node scripts/verify-lived-experience-browser.cjs`.

[Browser results](evidence/review-fixes/browser/results.json) retain the four input cases. Original evidence above remains a historical snapshot.

The review's allocation concern was a performance risk rather than a confirmed defect. `node --expose-gc scripts/benchmark-life-story.mjs` measured 20,000 steady-state observations at each of 80/320/640 animals. Median batch means were approximately 0.0066/0.0261/0.0522 ms per call; p95 batch means were 0.0096/0.0313/0.0720 ms. At 120 calls/sec the median observer-only estimate is 0.79/3.14/6.26 ms of CPU per second. Post-GC retained-heap deltas did not increase in this sample; these are noisy retained-heap measurements, not allocation-rate or GC-pause measurements. No observer hot-path restructuring was justified by this narrow probe. Birth/death bursts, full-engine mobile GC, sustained 2× playback and physical phones remain outside this measurement. [Raw probe](evidence/review-fixes/observer-scaling.json).

Final local verification: `npm run verify` passed all 333 tests in 27 files, lint, formatting and production build. `npm run test:soak -- --ticks=1200` passed seeds 1, 42 and 1337 ([raw smoke results](evidence/review-fixes/soak.jsonl)); these short runs check state stability, not long-term balance. Hosted CI for the follow-up commit is separate.
