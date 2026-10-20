# Track 11 — Implementation and verification evidence

This report describes the implementation on the feature branch, based on main merge `d43a35b` (tree `c46758c`). Baseline: 120 tests and standard verify pass after `npm ci`. PRs #135/#136 and their review dispositions were checked; their pursuit, alert, pregnancy and lifecycle fixes are retained. New generation and additional inherited loci intentionally change seeded trajectories relative to main. Equal **new** seed/config/tick sequences replay identically.

## Seven phases delivered

| Phase             | Result                                                                                                                                                                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Regions        | Jittered stratified sites, weighted primary biomes, domain-warped borders, small-component cleanup, local lakes/connected short streams, land-path water analysis. Default world is 120 × 160, with 12 regional sites.                                   |
| 2. Appearance     | Deep cool forest, light open plains, warm dry sand, slate rock and blue water. Shared substrate/grass/stress colour sampling and flat biome classification view.                                                                                         |
| 3. Ecology        | Habitat-aware vegetation capacity, bush placement/regeneration and safe connected vegetated spawn sites. Existing movement/friction, resource searches and migration remain connected through broad land corridors. Runtime dietary rules are preserved. |
| 4. Inheritance    | Body H/S/L, preferred hue, choosiness and discrimination for all four shapes, broad founding variation, circular mixing/wrapping mutation, saved paternal colour and generation.                                                                         |
| 5. Detection      | One contextual model for prey acquisition, chase retention, both direct-threat engines and mate acquisition. Motion cues, inherited senses, close-range floor and tracked-target hysteresis.                                                             |
| 6. Mating         | Soft reciprocal hue preference competes with distance; neutral achromatic partners; consistent eligibility/ranking and conception commitments, including distant or nonreciprocal commitments.                                                           |
| 7. Observation/QA | Swatches, habitat/exposure and mate explanations; 12-bin circular distributions; founding snapshot plus 120 bounded periodic samples; causal scenarios, replay, multi-seed runs and desktop/mobile browser captures.                                     |

Default population remains the existing 80 actors: 36 squares, 4 triangles, 36 circles and 4 octagons. No forced regional adaptation, hue target, population recolouring, diet redesign, new species or asynchronous simulation work was added.

## Map analysis: 32 seeds (1–32)

Each range below includes all seeds. Boundaries count unlike horizontal/vertical tile neighbours, including shores. Component sizes are four-connected. Drinking distances follow land paths; they are not straight-line estimates.

| Measurement                          | Main baseline                  | Track 11                       |
| ------------------------------------ | ------------------------------ | ------------------------------ |
| Generation, ms                       | 48.80–139.73 (median 72.30)    | 11.05–147.95 (median 27.20)    |
| Boundary density                     | 24.24–25.91 (median 25.20)%    | 5.30–6.21 (median 5.90)%       |
| Primary land in components ≥50 cells | 78.12–82.77 (median 80.27)%    | 99.78–100.00 (median 100.00)%  |
| Largest connected land fraction      | 98.20–99.99 (median 99.82)%    | 99.99–100.00 (median 100.00)%  |
| Water coverage                       | 16.20–21.38 (median 17.88)%    | 7.48–9.84 (median 8.55)%       |
| Land with reachable drinking water   | 100.00–100.00 (median 100.00)% | 100.00–100.00 (median 100.00)% |
| 95th-percentile land steps to water  | 11.00–14.00 (median 13.00)     | 24.00–28.00 (median 25.00)     |

All primary biomes retain substantial interiors; automated tests require each to exceed 3% of land and a component of 300 cells on default maps. Maps vary in biome prevalence/layout; no two seed count signatures in the test batch match. Tests also cover 1 × 1, 2 × 3, 8 × 8, reversed aspect and narrow worlds. Tiny terrain grids are supported defensively; ecological viability is evaluated on normal worlds, not claimed for all-water one-cell grids.

The water coverage reduction and longer drinking distances are intentional consequences of replacing fragmented corridors with local catchments. Spawn checks require connected vegetated land and reachable water within a world-relative distance. Generation is hierarchical regional zoning with catchments, **not** an erosion, watershed or physically draining river simulation.

## Controlled causal and boundary evidence

- Identical observers/targets on forest versus sand reverse the contrast advantage. Actual acquisition → movement → chase → combat scenarios leave matched stationary prey alive without acquisition and catch contrasting prey; swapping habitat reverses this. The controlled catch fixture disables hunt-phase pacing to isolate detection; separate existing tests retain the charging-only guard.
- Close encounters remain visible. Motion and stronger colour discrimination increase exposure; inherited perception changes effective range. Editing a base default does not retroactively alter an existing animal's inherited senses.
- Predator acquisition, simple and complex direct threats agree between indexed and linear paths. Coincident actors are detected without undefined flee directions. Social warnings remain propagated information, not independent visual sightings.
- Chase tests preserve the last-known position during concealment and conclude loss only after the configured grace period; tracked targets receive a visibility margin.
- Preference changes candidate ranking; zero choosiness is opportunistic, and scarce nonpreferred partners remain eligible. Black/white/grey partners produce neutral hue information rather than matching every preference.
- Seeking and conception use the same policy. Tests cover a nearer substitute, a distant commitment, a rival commitment, death/ineligibility, pregnancy, saved posthumous paternal hue and prevention of same-tick reconception after birth.
- Both hue loci cross 0/1 correctly. Exact antipodes use a deterministic positive half-turn from the first parent. Invalid/missing values normalize safely. Saturation/lightness and the other direct colour loci remain bounded. A six-generation controlled lineage retains variable inherited colour; this is a mechanism test, not natural-selection evidence.
- Circular histograms correctly keep 0.99 and 0.01 near red; directionless/empty circular means are null. History capacity is tested past its bound while retaining the founding snapshot. Direct colour loci cannot be silently configured as ignored multiplicative ranges.

## Simulation verification

Commands used on final rules:

```sh
npm ci
npm run verify
npm run test:soak -- --ticks=36000
node scripts/verify-track11.mjs --mode=maps --ticks=0
node scripts/verify-track11.mjs --mode=maps --ticks=0 --baseline=/path/to/main-checkout
node scripts/verify-track11.mjs --mode=full --ticks=18000
node scripts/verify-track11.mjs --mode=no-camouflage --ticks=18000
node scripts/verify-track11.mjs --mode=no-preference --ticks=18000
node scripts/verify-track11.mjs --mode=full --ticks=18000 --seeds=1
```

Standard verification passes 158 tests in 14 files, ESLint, repository formatting and Vite build. Existing tests remain in the suite. The old threshold-metadata water assertion now checks the regional generator's equivalent coverage behavior. Focused replay tests exercise both herd modes with reproduction and reset/interleaved instances. An independent full 18,000-tick seed-1 run exactly reproduces the full-state/summary hash:

`2dfed124ae60b76cb30a88054a6cb4d68d8689b88ec5fd55e256284e73a1ee7e`

### Ten simulated minutes: 36,000 ticks × three seeds

The standard soak checks finite/nonnegative meters, bounded positions, unique live IDs and exact birth/death population accounting **every tick**.

| Seed | Baseline population / births / kills | Track 11 population / births / kills | Track 11 square / triangle / circle / octagon | Deaths in first minute |
| ---- | ------------------------------------ | ------------------------------------ | --------------------------------------------- | ---------------------- |
| 1    | 178 / 183 / 10                       | 217 / 217 / 0                        | 106 / 5 / 104 / 2                             | 0                      |
| 42   | 201 / 204 / 5                        | 208 / 208 / 0                        | 104 / 1 / 100 / 3                             | 0                      |
| 1337 | 191 / 194 / 10                       | 223 / 221 / 0                        | 100 / 7 / 112 / 4                             | 0                      |

| Seed | Final creature + summary SHA-256                                   |
| ---- | ------------------------------------------------------------------ |
| 1    | `3e6fb8ec89d650686e29ee83129c816a661c63b8ad3fe4675f44a695876fee67` |
| 42   | `067c528ea735c946a8492165b640c614c8e497cbfdbc34d8aec727ca9dd3f6fc` |
| 1337 | `837057a6fac8e9b0ac59230ae3ce542d88827896221819735acef5626f8fadac` |

### Five-minute paired configuration batches

Each mode uses the same three seeds; all runs check colour-trait bounds, finite meters, IDs and bounded history periodically. Different decisions can change later RNG consumption, so these are whole-trajectory comparisons, not statistically isolated effect estimates.

| Seed | Mode          | Final population | Births | Chases | Kills | Highest observed generation |
| ---- | ------------- | ---------------- | ------ | ------ | ----- | --------------------------- |
| 1    | full          | 151              | 71     | 4      | 0     | 2                           |
| 42   | full          | 151              | 71     | 0      | 0     | 2                           |
| 1337 | full          | 155              | 75     | 0      | 0     | 2                           |
| 1    | no-camouflage | 143              | 63     | 15     | 0     | 2                           |
| 42   | no-camouflage | 155              | 75     | 5      | 0     | 2                           |
| 1337 | no-camouflage | 156              | 76     | 0      | 0     | 2                           |
| 1    | no-preference | 155              | 75     | 8      | 0     | 2                           |
| 42   | no-preference | 152              | 72     | 2      | 0     | 2                           |
| 1337 | no-preference | 155              | 75     | 0      | 0     | 2                           |

The changed partner rankings, births, hunt acquisition and resulting distributions demonstrate that the flags affect actual trajectories. Causal controlled scenarios establish mechanism direction. These three-seed samples **do not establish statistical significance, long-term habitat adaptation or stable regional divergence**.

## Browser and performance evidence

The real Vite app was run in Chromium at 1280 × 900 and 390 × 844. A test-only intercepted bootstrap exposes app handles to the runner; production has no debug global. The runner toggles normal/biome view through the config UI, changes initial colour variation and rebuilds, renders three seeds in both views, asserts complete simulation state is unchanged by diagnostic rendering, inspects all four shapes, confirms actual mate targets and a movement-driven forest→sand crossing, and checks mobile panel bounds. No page errors occurred.

Inspector/boundary images use explicitly constructed controlled cohorts through the real genetics/AI/render/UI modules, not claims about spontaneous population organization. Graph images use the founding population and the measured 18,000-tick descendant snapshot from the final full-mode run. They are not fabricated evolutionary trajectories. Some emoji glyphs are absent in the headless font set; text, controls and colour data are readable.

Reproduce the captures with an externally available Playwright/Chromium (no new project dependency):

```sh
PLAYWRIGHT_MODULE=/path/to/playwright \
BROWSER_EXECUTABLE=/path/to/chromium \
TRACK11_RESULTS=/path/to/full-mode-results.jsonl \
node scripts/verify-track11-browser.cjs
```

Headless software-rendered measurements below use 120 frames per viewport/population, one sim tick per frame and the normal sliced cache path. Values are medians in milliseconds. Baseline and new worlds differ in resource/search workload, and the shared runner had concurrent simulation work; treat these as indicative totals, not an isolated colour-function benchmark or physical-phone FPS claim. Raw p95 measurements are retained in the JSON evidence.

| Viewport and population | Render baseline → new | Tick baseline → new | Frame interval baseline → new |
| ----------------------- | --------------------- | ------------------- | ----------------------------- |
| 1280 × 900, 80 actors   | 15.1 → 15.1           | 6.2 → 6.2           | 26.5 → 26.6                   |
| 1280 × 900, 240 actors  | 15.1 → 15.6           | 15.5 → 17.4         | 37.8 → 39.6                   |
| 390 × 844, 80 actors    | 8.3 → 7.6             | 4.0 → 5.5           | 16.7 → 16.7                   |
| 390 × 844, 240 actors   | 8.6 → 8.9             | 14.4 → 17.1         | 26.6 → 29.9                   |

There is measurable overhead at higher populations; this is a tuning/performance follow-up, not a promise of 60 FPS on every phone. Static region/access/RGB fields add about 0.35 MiB of typed arrays at default dimensions. The existing three full-map canvas layers remain the dominant image allocations. Observed five-minute colour-history serialization is 89,197–103,239 bytes for 31 samples; history is capped at 120 plus the founding snapshot. No full heap-growth claim is inferred from serialized byte size.

## Visual record

- [Seed 1 normal](evidence/world-1-normal.jpg) / [classification](evidence/world-1-biomes.jpg)
- [Seed 42 normal](evidence/world-42-normal.jpg) / [classification](evidence/world-42-biomes.jpg)
- [Seed 1337 normal](evidence/world-1337-normal.jpg) / [classification](evidence/world-1337-biomes.jpg)
- [Inherited colours and desktop inspector](evidence/colour-inspector-desktop.jpg)
- [Actual boundary crossing, all four shapes](evidence/colour-boundary-crossing.jpg)
- [Desktop distributions](evidence/colour-graphs-desktop.jpg)
- [Mobile inspector](evidence/colour-inspector-mobile.jpg) / [distributions](evidence/colour-graphs-mobile.jpg)
- [Raw map, soak, ablation, replay and baseline performance data](evidence/measurements.json)
- [Browser assertions and current frame timings](evidence/browser-results.json)

## Limits and remaining ecological work

Predation is sparse in the regional default worlds, including camouflage-disabled comparisons. The baseline itself also has very small predator populations and loses octagons on seed 42 by ten minutes. The controlled hunting cases demonstrate a real colour-dependent survival effect; the default soaks must not be presented as proof of strong ongoing predation selection. No arbitrary population correction, biome-directed recolouring or dietary rewrite masks this limitation. Track 13 should investigate the existing fallback-foraging/hunger economy, migration/contact rates, larger populations and multi-hour balance.

The colour model is a cheap weighted display-RGB/luminance approximation, not calibrated animal vision. Decorative edge blends, bush/berry sprites, highlights and the bounded grass-cache delay can differ locally from its averaged background. Water is guaranteed locally through bounded catchments rather than a full hydrological model. Longer-run population balance, physical-device profiling and adaptive regional divergence remain unproven.

All seven implementation phases are complete. No merge or deployment is performed. Hosted CI/review status is separate from these local results.
