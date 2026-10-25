# Verification and visual evidence

Baseline: Genetics main `bc7c30ef8ddf3ff63b24e06f34ad47936cec8a41`.
Upstream: `a2207c4bd6f1be51d426684cf58f11668def7579`.
Measurements below are observations in this Linux executor, not physical-device certification.

## Automated verification

- `npm run verify`: **354 tests / 29 files**, source/license integrity, ESLint, Prettier and both production Vite entrypoints.
- Unmodified upstream Core: **17/17 tests**, three random seeds per family, including deterministic goldens, frame-rate independence, planted feet, turning, pose bounds and extreme anatomy. [Text](evidence/upstream-tests.txt) · [JSON](evidence/upstream-tests.json).
- Regenerating the final compiled anatomy a second time produced byte-identical output ([hash record](evidence/compile.json)). Tests check all four matching endpoint topologies, finite coordinates, all six clips, stable inherited identity, mutation extremes and image envelopes. There is no golden image lock that prevents legitimate art refinement.
- Existing Python research-report suite: **24/24 tests**, after importing the immutable experiment-source bundle exactly as CI does. [Log](evidence/python-tests.txt).
- `git diff --check` passes. [Full verification log](evidence/verify.txt).
- The deployment build includes `index.html`, `creature-lab.html` and the original MIT text. Existing GitHub Pages workflow is unchanged. No deployment was performed.

## Long ecological replay

Three **36,000-tick unobserved soaks** (108,000 ticks) pass finite positions/meters, world bounds, IDs and population accounting.
Three further **36,000-tick observed runs** (108,000 ticks) interleave actual procedural rasterization every 600 ticks for every live animal. Actor JSON is checked before/after each observed batch. The final complete creature-plus-summary SHA-256 equals its unobserved counterpart exactly for all three seeds. These are headless rasters, not a claim of 216,000 ticks of GPU/browser rendering.

| Seed | Final square / triangle / circle / octagon | Births | Deaths | Render visits in observed replay | Exact final hash match |
| ---- | ------------------------------------------ | ------ | ------ | -------------------------------- | ---------------------- |
| 1    | 83 / 5 / 70 / 4                            | 175    | 93     | 7586                             | Yes                    |
| 42   | 77 / 5 / 75 / 7                            | 176    | 92     | 7570                             | Yes                    |
| 1337 | 53 / 9 / 59 / 5                            | 146    | 100    | 6859                             | Yes                    |

[Unobserved records](evidence/soaks.txt) · [Observed records](evidence/observed-soaks.json) · [Unchanged authoritative simulation-file hashes](evidence/simulation-source.json).

The final visible-cohort admission fix adds a read-only density input to the presentation cache; the long headless replay's default zero-density path is unchanged. A dedicated 500-actor regression covers that new admission branch. No simulation source, genetic inheritance, colour detection, mate preference, diet, movement or reproductive rule was changed. The trajectories are regression evidence, not a new ecological-balance or evolutionary-success claim.

## Renderer workloads

Chromium 153, headless software graphics, 1440×960 desktop and 390×844 narrow viewport. Both baseline and final use the same runner and main worktree/source imports. The renderer matrix contains **90 combinations**: 1/25/100/250/500 actors, 120×160 / 180×240 / 240×320 worlds, zoom .15/1/3 and stationary/moving snapshots. All cohorts are centred in the viewport; edge actors can be culled at the closest zoom. Ten warm-up renders precede fifty timed synchronous renders. These numbers are renderer timings, not FPS or full-simulation TPS. Motion/turning snapshots update presentation inputs without running ecological decisions.

Normal zoom, 120×160, moving cohort, milliseconds per render:

| Actors | Baseline mean | Final mean | Final p95 | Final p99 | Final cold render |
| ------ | ------------- | ---------- | --------- | --------- | ----------------- |
| 1      | 0.194         | 0.250      | 0.500     | 1.200     | 2.8               |
| 25     | 0.294         | 0.832      | 3.000     | 3.400     | 8.0               |
| 100    | 0.342         | 3.700      | 4.200     | 4.400     | 28.8              |
| 250    | 0.628         | 3.962      | 4.200     | 4.500     | 59.2              |
| 500    | 1.152         | 5.880      | 8.000     | 35.700    | 138.8             |

The art adds real CPU cost. Cold visibility/birth construction is synchronous and can cause a long frame; the worst cold render and all timing tails remain in the raw matrix. Generation has a 3 ms soft subsequent-pose budget, not a hard total-frame cap. Deferred animation may be stale in dense moving cohorts.

The matrix exposed a serious 500-actor close-up cache-thrashing bug (roughly 300 ms repeated frames): one 80-pixel frame per actor could exceed the 12 MiB cache. The fix admits lower raster detail based on the **visible** cohort, reserving room for two current cohorts. A stationary 500-actor second render now generates zero additional frames, covered by a regression. At that density close-up raster detail drops to 48 pixels; the inspector retains its detailed portrait. Narrow screens independently cap world-animal rasters at 48 pixels.

The final cache remained within **12,582,912 bytes** with zero generation failures across the browser matrix. Offscreen/empty-world/reset and independent-instance ownership are also tested. Parsed geometry, temporary arrays, metadata, browser storage overhead and GC add memory beyond the RGBA frame budget. End-of-matrix heap snapshots are descriptive only: collection timing differs, so they do not establish a memory improvement. There is no allocation/GC trace or physical RAM/VRAM measurement.

## Actual live loop

Each row is one approximately 4.2-second observation at 80 animals with an inspector selected and Follow enabled. CPU throttle is Chrome DevTools emulation, **not an actual phone**. A single short trial per row cannot establish sustained hardware performance; initialization, scheduling, paused-to-running transitions and collection contribute to outliers. FPS uses frame callbacks over the observation duration; p50/p95/p99 are callback intervals.

| View / speed                          | Baseline FPS / TPS | Final FPS / TPS | Final frame p50 / p95 / p99 (ms) |
| ------------------------------------- | ------------------ | --------------- | -------------------------------- |
| Desktop, 1× simulation                | 55.3 / 59.8        | 56.5 / 59.8     | 16.7 / 16.8 / 16.8               |
| Desktop, 2× simulation                | 57.2 / 119.8       | 56.3 / 119.5    | 16.7 / 16.8 / 33.3               |
| 390px, 4× CPU throttle, 1× simulation | 16.1 / 59.3        | 12.3 / 59.1     | 83.3 / 100.0 / 100.1             |
| 390px, 4× CPU throttle, 2× simulation | 4.0 / 94.8         | 3.8 / 92.9      | 283.3 / 366.7 / 366.7            |

Desktop simulation stays close to 60/120 TPS in these samples. **60 FPS is not universally met.** Throttled narrow-screen performance is poor in both versions and can be worse with the art at 1×; 2× is not sustainable at 120 TPS there. This remains a limitation, not a passed target. Physical Android/iOS and extended actual-browser sessions remain unverified.

Observed app-ready time: baseline 727 ms, final 967 ms (one dev-server trial each, not a controlled network/startup study). Production shared art chunk: approximately **1,338 kB minified / 263 kB gzip**, in addition to the approximately 92 kB gzip app chunk. Vite's large-chunk warning is retained rather than hidden. No .NET/Godot/WASM runtime downloads are required by the browser.

[Baseline raw measurements](evidence/baseline-browser.json) · [Final raw measurements](evidence/final-browser.json) · [Browser result log](evidence/browser-run.txt).

## Artistic and interaction review

Actual rendered screenshots were inspected, including uncurated populations, parent/offspring, four-direction/extreme-parameter envelopes, normal gameplay and portraits. Refinements addressed flat shading, similar proportions, tiny overview animals, first-paused-render fallback persistence, incorrect long-tail framing, phone studio legibility and cache admission at high density. Bodies remain stylized and deliberately restrained; visual appeal and recognizability are artistic judgments for the project owner to review.

The same seeded founder genomes are used for before/after screenshots. Inspector/camera controls are exercised through real canvas selection and Follow. A separate touch-enabled 390×844 browser context passes real touch selection, Follow and pinch (zoom 2 → 3.12) without changing authoritative actors. All browser runs reported zero page errors. [Touch record](evidence/touch.json).

| Evidence                       | Images                                                                                                                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before → after normal gameplay | [Before](evidence/before-normal.png) · [After](evidence/after-normal.png)                                                                                                                                      |
| Full-world seed 1              | [Before](evidence/before-1-world.png) · [After](evidence/after-1-world.png)                                                                                                                                    |
| Full-world seed 42             | [Before](evidence/before-42-world.png) · [After](evidence/after-42-world.png)                                                                                                                                  |
| Full-world seed 1337           | [Before](evidence/before-1337-world.png) · [After](evidence/after-1337-world.png)                                                                                                                              |
| Uncurated populations          | [Seed 1](evidence/contact-1.png) · [42](evidence/contact-42.png) · [1337](evidence/contact-1337.png)                                                                                                           |
| Inherited appearance           | [Parents and six offspring](evidence/family.png) · [Trait extremes](evidence/extremes.png)                                                                                                                     |
| Family readability             | [Silhouettes](evidence/silhouettes.png)                                                                                                                                                                        |
| Motor states                   | [Idle](evidence/pose-idle.png) · [Walk](evidence/pose-walk.png) · [Run](evidence/pose-run.png) · [Action](evidence/pose-action.png) · [Rest](evidence/pose-rest.png) · [Hit diagnostic](evidence/pose-hit.png) |
| Habitat backgrounds            | [Forest](evidence/habitat-forest.png) · [Sand](evidence/habitat-sand.png) · [Rock](evidence/habitat-rock.png)                                                                                                  |
| Inspector and mobile           | [Desktop](evidence/inspector-desktop.png) · [Real touch selection](evidence/touch-inspector.png) · [Responsive studio](evidence/lab-mobile.png)                                                                |
| Animation sequence             | [Eight-frame locomotion GIF](evidence/locomotion.gif)                                                                                                                                                          |

The GIF is captured from the actual seekable procedural studio. It is diagnostic locomotion, not footage of an ecological chase. A dedicated natural pursuit/flight recording, physical-phone performance, live nonlethal hit reactions, dynamic browser IK/spring chains and a separate death clip are not claimed. The current lethal capture/death owner is preserved. See [architecture](blueprint.md) for the port's exact scope, omitted source capabilities and maintenance instructions.

## Publication and automated review

[PR #147](https://github.com/CigThePig/Genetics/pull/147) is open and unmerged.
The published implementation tree is byte-identical to the locally staged and verified tree (`0d2ce02fc5d5bfd8a4b6d939bf9180cf215f2169`).
Hosted [Verify run 40212890936](https://github.com/CigThePig/Genetics/actions/runs/40212890936) passed on implementation commit `cbe8e72a5a408b37722de7515a839aae5d69cb40`, including the existing research-source import/report checks.
Codex review of that commit completed on 2026-10-25 with **no findings**. The follow-up commit changes closeout documents only; it does not alter production code or quantitative results.
