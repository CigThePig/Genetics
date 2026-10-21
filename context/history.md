# History (append-only)

- 2026-01-19 — Track 0 — Repo Bootstrap (Scaffolding) — Established Vite scaffolding with standard module stubs, Vitest smoke test, npm scripts, and GitHub Pages deployment config; documentation updated to match. Verification: npm run dev (timeout 5s), npm test, npm run build.
- 2026-01-19 — Track 1 — Developer Visibility & Control — Added FPS overlay + toggle, play/pause/step/speed UI shell, seeded RNG module, and determinism smoke test; repo-map validated for new modules. Verification: npm test.
- 2026-01-20 — Track 2 — Canvas + Camera + Inspection Skeleton — Added canvas renderer with touch camera, inspector stub, metrics panel shell, settings persistence, and worker-ready sim stub; wiring updated for new systems. Verification: Manual pan/zoom, tap inspector output, metrics panel visible, settings persist on refresh, app boots without worker.
- 2026-01-21 — Track 3 — World Grid & Terrain Foundations — Added deterministic world grid, blob terrain generation with effects table, terrain rendering, and water/shore corridors with distinct palette. Verification: Manual terrain repeatability by seed, terrain effects lookup, water/shore visibility.
- 2026-01-21 — Track 4 — Plant Economy: Grass, Stress, Bushes, Berries — Added grass regrowth with stress, bush entities with berry pools, and plant metrics for observability. Verification: Manual grass regrowth, stress recovery, and bush/berry metrics updates.
- 2026-01-21 — Track 5 — Plant Economy: Recovery, Rendering, Metrics — Added bush recovery and berry regeneration tied to health, terrain-aware grass/bush seeding, plant rendering, and expanded plant metrics with hotspot validation. Verification: Manual plant recovery/regen observations, plant rendering review, hotspot seed validation, and berry/health metric changes.
- 2026-01-21 — Track 6 — Creature Core: Meters, Stages, Movement — Added creature model with meters, life stage scaling, basal metabolism drains, terrain-friction movement, and thirst/hunger priority inspection. Verification: npm test.
- 2026-01-19 — Track 6.5 — Canon Lock + Species Retrofit — Locked canonical species + ecosystem definitions, added deterministic species assignment and observability (renderer/inspector/metrics), and aligned docs to single canon source. Verification: npm test.
- 2026-01-23 — Track 7 — Survival Actions + Sprinting + Death — Added drink/eat behaviors (circles eat grass), stamina-driven sprinting, death conditions with causes, and population counters surfaced in metrics/UI. Verification: Manual observation of drink/eat/sprint behaviors, population changes, and death cause metrics.
- 2026-01-24 — Track 8 — Food Web + Perception + Memory — Added canonical diet/food properties, digestive efficiency biases, perception + alertness, and memory-driven seek behavior with inspector readouts. Verification: Manual observation of foraging styles and memory entries in inspector.
- 2026-01-25 — Track 9 — Predation + Chase Dynamics — Added deterministic predator target scoring, stamina-gated chase loop with loss rules, and chase observability in metrics/inspector. Verification: npm test; manual observation of chase arcs and target selection logic.
- 2026-01-28 — Track 10 — Reproduction Loop + Basic Genetics — Added deterministic reproduction flow, genome inheritance + trait mapping, mutation with pleiotropy tradeoffs, and genetics/reproduction metrics plus deterministic genetics smoke test. Verification: npm test.
- 2026-01-29 — Track 10.5 — Timebase + Survival + Visibility + Map Scale — Normalized sim timebase with fixed timestep + ticks/sec metrics, tuned survival pacing in seconds, aligned creature rendering/input at ~1-tile size, expanded map to 4× area with density-preserving resources, and increased clustered population spawns. Verification: Not run (closeout only).
- 2026-01-30 — Track 10.6 — Gender + Pregnancy + Birth — Aligned reproduction readiness thresholds with eat/drink thresholds, exposed pregnancies/miscarriages metrics in the UI, and added a guard test to prevent regression. Verification: npm test; manual UI verification pending.
- 2026-02-04 — Maintenance — Smoothed herding offsets and separation tuning, added graze duty-cycle intent/movement for calmer herbivore herds, and exposed movement/herding controls in the config panel. Verification: npm run verify (fails: prettier check reports existing formatting issues); manual sim/UI checks pending.
- 2026-02-04 — Maintenance — Added predator/herbivore spawn anchor separation, long-range herd regroup assist, and graze gating for small herds; exposed new config controls. Verification: npm run verify (fails: prettier check reports existing formatting issues); manual sim checks pending.

## 2026-10-19 — Maintenance: Comprehensive repository audit

Reviewed source and tooling by subsystem. Repaired deterministic isolation, perception freshness, herd-mode selection, behavior integration, feeding/chase lifecycle, conception/birth inheritance and IDs, render invalidation, app/input/storage faults, profiler counters and workflow faults. Extracted oversized simulation/config/render modules with compatible public exports. Added 33 regression tests (59 total) and a reusable three-seed soak command. npm run verify passes; three five-minute simulations, desktop/mobile browser interactions and workflow syntax checks pass. Behavior/RNG consumption changes are documented; long-term balance and planned future systems are not claimed. See repository-audit-2026-10-19.md.

## 2026-10-19 — Maintenance: unfinished phase completion

- Reviewed all 24 prior phase plans and the maintenance roadmap; reconciled the seven plans with open items against current code and evidence.
- Completed config power controls and safe domain validation, isolated the fixed-step clock, documented units, and exposed spawn retry budgets with unchanged defaults.
- Completed simple-mode long-range regroup/post-drink countdown and made threat steering take priority over stale herd forces. Seed trajectories change intentionally; tick order and predator formulas are preserved.
- Added clock, pregnancy, pack/herd, worker-flag parity, spawn compatibility, config-safety and sliced-cache regressions. Three final five-minute seed runs have zero first-minute deaths and all species present. Desktop/mobile browser controls and live resize/profiler checks pass.
- Details and scoped limitations: context/phase-completion-2026-10-19.md. Future Tracks 11–13 remain unplanned roadmap work.

- Completion PR: https://github.com/CigThePig/Genetics/pull/136 (open for review; not merged).

## 2026-10-19 — PR #135/#136 review follow-up

- Verified all five Codex findings from merged PR #135 and both initial findings from PR #136. The active-track closeout was already fixed; repaired the remaining six issues on #136.
- Split app loop/config wiring and hunting transitions into focused modules. Gated catches on charging, normalized behavior meters, aligned partial-config prey defaults, honored direct-threat distance, and invalidated stale regroup caches.
- 116 tests, lint, formatting and build pass. Desktop/mobile browser controls and config rebuild/rate-reset lifecycle checks pass. Final three-seed 3,600-tick smoke passes bounds/finite-state/ID/accounting checks with no deaths.
- Per-finding links, dispositions and validation limits: context/pr-review-followup-2026-10-19.md. No merge/deployment.

## 2026-10-19 — PR #136 newest review and agent guidance refresh

- Fixed repeated distant-threat alert pauses with per-creature assessment memory and closer/returning-danger reassessment in both herd modes. Aligned anchor food radius metadata/import minimum with its runtime clamp.
- Removed standing file-size limits, automatic phase stops and mandatory full track artifacts for small fixes. Reviewed every rule group and synchronized current companion guidance; retained correctness, mobile support, verification and authorization boundaries. Old prompt documents are historical rather than standing instructions.
- Validation: 120 tests, lint, formatting and build pass; targeted Chromium config/import/playback checks pass; three seeded 3,600-tick smoke runs pass finite-meter, bounds, ID and population accounting checks. Initial-minute runs are not long-run balance evidence.
- Review links, rule-by-rule dispositions and current seed hashes: context/review-guidance-refresh-2026-10-19.md.

## 2026-10-19 — Track 11: Regional colour ecology

Completed the explicitly expanded seven-phase Track 11: regional habitats/catchments and map analysis; shared visible habitat colour; resource/spawn integration; circular inherited HSL/preference/choosiness/discrimination; contextual acquisition, pursuit and both threat engines; commitment-safe reciprocal soft mating; inspector, bounded circular histories and diagnostic controls. Existing species, diets, seeded ownership and tick ordering are preserved. Review corrections include birth-tick reconception, neutral achromatic mate perception, trait-first live-default handling, coincident threats, direct-locus config validation and stress/cache invalidation.

`npm ci` and `npm run verify` pass (158 tests, lint, formatting, build). Thirty-two maps pass geographic checks. Three final 36,000-tick soaks retain all species with populations 217 / 208 / 223 and zero first-minute deaths. Nine 18,000-tick flag comparisons plus independent seed-1 full-state replay complete; controlled hunting, choice, inheritance and six-generation cases show causality. Eleven Chromium captures at desktop/mobile sizes and performance comparisons are retained in the track evidence. Predation remains sparse (zero default-soak kills); long-term ecological balance and adaptive divergence are unproven. See the complete evidence report for measured overhead and limits. Feature branch prepared for PR review; no merge/deployment.

## 2026-10-20 — Pre-Track 12 behavioural foundation

Replaced species-wide/force-driven grouping with local membership, individual goals, committed pack search/scouting, finite local alarms, retained terrain routes, arrival braking and survival-driven feeding/hunting. Removed obsolete anchor/complex-force/worker code; retained colour, regional and mating mechanisms. Added controlled scenarios, motion exports/viewer, causal regressions, inspector explanations and combat-readiness notes. Local verify passes 186 tests, lint, formatting and build. Independent 36,000-tick reruns match all three seeds; catches change from 0/0/0 to 26/21/17. Ecological losses and performance limits are documented. Large remaining media omitted at user request to expedite PR submission. No merge/deployment; hosted CI is separate.

## 2026-10-20 — PR #138 Codex review corrections

Addressed all seven findings: configured water in routing/collision/search, centred resource-memory destinations and visit-safe food confidence, complete live herd/pack cleanup, edge-safe escape horizons, per-member prey-sighting deduplication and the active regroup-size threshold. Added 13 regression cases; verified failures against the submitted snapshot and fixes against 199 passing tests, lint, formatting and build. Review-specific soak results are appended to the foundation evidence. No merge/deployment.

## 2026-10-21 — Predator extinction investigation and resource recovery

Investigated corrected main `4fab126` across ten deterministic seeds for at least 72,000 ticks, plus seed 1 for 144,000 ticks on both revisions. Reproduced all three corrected PR #138 hashes. Confirmed premature non-emergency meal/drink interruption and a visible-mate opportunity barrier; implemented resource continuation with emergency interruption, bounded observed mate contacts, actual capped feeding counters and explicit predation attribution. Founder counts, life-history/hunting/nutrition parameters remain unchanged. No Track 12 combat implementation.

At twenty minutes, triangle extinction changes 10/10 → 5/10, octagons 10/10 → 3/10, predator births 11 → 112; wild descendant generations reach four/six. Both herbivore species survive every run, with unfavorable prey/sex-ratio outcomes retained. Only three predator endpoint populations retain both sexes; the forty-minute seed-1 run loses both predators. This improves replacement but does not establish equilibrium. Threshold-only/count/age/colour/competition/scarcity and contact-only experiments are preserved, including failures.

`npm ci`, final `npm run verify` (215 tests, lint, format, build), three 36,000-tick soaks and exact independent final hashes pass. Real Chromium checks cover temporal state, observed-contact movement, finite resource recovery, read-only rendering and mobile controls. Equal-workload 80/240-actor timing, full source provenance, compact archives, figures and commands are in `tracks/2026-10-21-predator-ecology/`. Feature branch prepared for unmerged PR review; no merge/deployment. Hosted CI is separate from local checks.

## 2026-10-21 — PR #139 Codex review corrections

Confirmed and fixed all three findings: available meat residue now completes an existing recovery episode below initiation minimums; eligible mating honors the explicit needs override during recovery; copied contact destinations use a distinct search goal and are discarded after expiry, disable or lost reachability. Updated inspector/config explanations and architecture notes. Fourteen new cases reproduce the causal failures and protect default/ineligible behavior; full verify passes 229 tests, lint, formatting and build. Hosted Verify passes on corrected source `76a6b35`.

Three fresh 36,000-tick soaks pass all invariants, with zero first-minute deaths and final S/T/C/O populations 73/4/60/7, 38/6/61/4 and 53/6/88/4 for seeds 1/42/1337. The original twenty/forty-minute measurements and hashes remain pinned to reviewed `480f599`, not relabeled as corrected results. Full dispositions, commands, source fingerprints and unfavorable outcomes are in the investigation track’s `review.md`. No fresh browser check or long-term-equilibrium claim; no merge/deployment.

## 2026-10-21 — Geographical world generation and map-scale rendering

Replaced assigned regional biome territories and repeated pond/tributary stamps with warped relief, environmental suitability, priority-flood basin storage and strictly downhill accumulated runoff. Shared habitat colours drive a one-pixel-per-cell terrain/vegetation raster, reducing target-size terrain canvas plus CPU buffer storage to 0.6144 MB. Added independent initialization streams, physical founder cohort locality, reused-grid regeneration and immediate paused-cache flushing regressions. No ecological survival guarantees or population increase.

Local and hosted Verify pass 244 tests, lint, formatting and build. Thirty seeds per size, canonical 36,000-tick comparisons and target-size density cases are archived with 120 Node JSON records and four deterministic PNG atlases. Software-browser measurements include 76 completed trials and a 60-second real-app smoke; raw browser archives became inaccessible after the execution environment disconnected, explicitly documented. Default remains 120 × 160 / 80 founders because 240 × 320 misses sustained 120 TPS and the 80-founder large soak loses both predators. See tracks/2026-10-21-world-generation/evidence.md and measurements.md. PR #140 submitted; no merge/deployment.

## 2026-10-21 — PR #140 Codex review corrections and evidence recovery

Confirmed all six findings: reject all-zero biome weights in import/editor/direct generation; retain safe traversable-land founder fallback for valid sand/rock-only worlds; correct water-threshold metadata; skip optional absent motion inputs; fingerprint all source dependencies with commit/dirty metadata; terminate Vite on browser-launch failure. Added eight regression cases, with causal pre-fix spawning/validation failures reproduced. Local verify passes 252 tests, lint, format and build; default full states match the pre-review source through 600 ticks on all canonical seeds.

The execution environment recovered and all 146 original manifest entries verified, restoring raw records for all 76 browser trials, original screenshots/app result and matching diagnostic/aggregation source. Historical six-file checksums remain explicitly partial and measurements stay pinned to their original source. See tracks/2026-10-21-world-generation/review.md for per-finding dispositions and limitations. No merge/deployment.
