# Measurements and qualification

Baseline: main `971e65604e4c688274f7a80bb570c4b5d435aee0`, including Track 11, Pre-Track 12 and the corrected predator investigation. Historical six-file checksum across geography, hydrology, orchestration, RNG, grass and spawning (not a complete provenance fingerprint; ecological source is pinned to commit 146745176c7b92ab672df9f84dffe3fa7773c421): `40e8444ae3db2d3142b8195f2e38d932661c9648f1004718c55e1025dcf90507`.

## Browser protocol and limitations

Shared Linux headless Chromium 153 with software SwiftShader rendering; desktop 1280 × 900 at DPR 1, mobile layout 390 × 844 at DPR 2 with touch and a real viewport meta tag. This is mobile emulation, not physical mobile hardware. Production createAppLoop drives independent fixed-step simulation and RAF rendering, real simulation/rendering, camera pan/zoom, and no-op panel callbacks. Full application controls are checked separately.

Ordinary trials used five-second measured windows after warmup, three repetitions per size/rate/view. Values below are medians of the three trial statistics, not pooled percentile estimates. There were 24 baseline, 24 final and 12 intermediate-size ordinary trials. Eight nearby hungry-predator fixture trials and eight 160-founder stress trials also completed, each with one repetition per setting; these single trials are exploratory. Total: 76 completed engine/browser trials. Initial exploratory screenshot timeouts, the early missing viewport/manual-clock approach and interrupted concurrent jobs were excluded.

The execution environment disconnected at publication, then recovered during review follow-up. The complete raw browser results and completion markers are now archived in profile-baseline (24 trials), profile-final (24), profile-intermediate (12), profile-hunting (8) and profile-stress (8). Original browser screenshots and app/results.json were recovered, along with the matching browser runner (population option, 0.55 hungry-fixture energy and completion marker) and summarize-world.py. The table below was transcribed during the outage; raw records and profile-summary.json now provide its audit trail. Do not treat these software-rendered, shared-host numbers as desktop/mobile certification. Repeat on target hardware before increasing defaults. The original manifest verifies all 146 archived files; the old six-file checksum remains labeled historical, while new diagnostics hash all src files and record Git commit/dirty state. See review.md.

Timing windows precede the renderer-only paused-flush correction. Ordinary unpaused paths are unchanged; the full-app check was repeated after that correction. The final source and reconstructed paused-flush regression passed hosted Verify (244 tests), run 39682635929.

## Ordinary browser comparisons

First render and reset include rendering; frame columns measure RAF intervals in milliseconds. These do not imply 60 FPS: ordinary software-host FPS is poor even before this change.

| Source | View          | Size      | Target TPS | FPS  | Actual TPS | Frame p50 | Frame p95 | Frame p99 | First ms | Reset ms |
| ------ | ------------- | --------- | ---------- | ---- | ---------- | --------- | --------- | --------- | -------- | -------- |
| Before | Desktop       | 120 × 160 | 60         | 14   | 59.8       | 22.6      | 270.7     | 331.4     | 107.1    | 135.6    |
| Before | Desktop       | 120 × 160 | 120        | 13.2 | 119.6      | 22.8      | 294.1     | 305.5     | 79.6     | 140      |
| Before | Desktop       | 240 × 320 | 60         | 4.4  | 59.5       | 112.2     | 439.9     | 521.1     | 389.1    | 494.2    |
| Before | Desktop       | 240 × 320 | 120        | 2.4  | 66.2       | 408.8     | 509.5     | 509.5     | 638      | 440.2    |
| Before | Mobile layout | 120 × 160 | 60         | 12.2 | 59.8       | 23.9      | 216.1     | 1677      | 114.1    | 163.5    |
| Before | Mobile layout | 120 × 160 | 120        | 14.2 | 119.6      | 20.4      | 236.1     | 277.7     | 83.1     | 131.7    |
| Before | Mobile layout | 240 × 320 | 60         | 10.6 | 59.8       | 68.5      | 141.2     | 254.9     | 646.4    | 555.6    |
| Before | Mobile layout | 240 × 320 | 120        | 3    | 77.2       | 263.5     | 335.7     | 343.4     | 624      | 381.5    |
| After  | Desktop       | 120 × 160 | 60         | 17   | 59.8       | 19.4      | 166.1     | 232.1     | 6.1      | 80.2     |
| After  | Desktop       | 120 × 160 | 120        | 16.7 | 119.7      | 21.6      | 166.9     | 222.3     | 6.9      | 69.4     |
| After  | Desktop       | 240 × 320 | 60         | 13   | 59.8       | 25.7      | 171.6     | 212.9     | 13       | 263.4    |
| After  | Desktop       | 240 × 320 | 120        | 3.9  | 95.9       | 271.5     | 428.5     | 469.5     | 14.6     | 204.9    |
| After  | Mobile layout | 120 × 160 | 60         | 16.3 | 59.8       | 19.6      | 166.3     | 259.5     | 10.7     | 128.1    |
| After  | Mobile layout | 120 × 160 | 120        | 17.3 | 119.5      | 20.8      | 149.3     | 215.8     | 6.2      | 88.5     |
| After  | Mobile layout | 240 × 320 | 60         | 17.9 | 59.7       | 21.9      | 142.7     | 174.3     | 9.3      | 212      |
| After  | Mobile layout | 240 × 320 | 120        | 3.8  | 93         | 294.2     | 393.9     | 393.9     | 9.8      | 239.4    |
| After  | Desktop       | 180 × 240 | 60         | 16.3 | 59.8       | 20.5      | 146.6     | 172       | 12.7     | 174.2    |
| After  | Desktop       | 180 × 240 | 120        | 15.1 | 119.3      | 64.1      | 174.8     | 233.5     | 11.3     | 151.5    |
| After  | Mobile layout | 180 × 240 | 60         | 17.3 | 59.4       | 18.4      | 142.1     | 192       | 10.7     | 172.4    |
| After  | Mobile layout | 180 × 240 | 120        | 11.9 | 119.3      | 78.7      | 131       | 157.9     | 8.3      | 198.7    |

The improved default-size renderer reduces desktop render-call p95 from 7.8 to 4.5 ms at 60 TPS and 6.6 to 4.2 ms at 120 TPS. At 240 × 320 these are 7.2 to 4.4 ms and 9.7 to 4.3 ms. Tick p95 at 240 × 320 remains 20.5 ms at 60 TPS and 15.9 ms at 120 TPS; full-grid regeneration and behavior remain important costs. Long frames (>50 ms) remain common: final desktop 120 × 160 ordinary trials have median 16.5% / 32.4% at 60/120 TPS; large worlds 41.2% / 100%. Intermediate desktop rates sustain 59.8 / 119.3 TPS, but frame p95 146.6 / 174.8 ms still does not justify a new default.

Hungry-predator exploratory desktop trials at 120 × 160 measured 51.0 FPS / 59.8 TPS with frame p95 36.1 ms at 1×, and 16.1 FPS / 118.8 TPS with p95 215.2 ms at 2×. Large-world trials measured 17.1 FPS / 59.7 TPS and 3.4 FPS / 86.0 TPS. Fixture counters recorded 11 chase starts and three kills at the original size, two kills at the large size. This is an intentionally staged interaction workload, not evidence of natural encounter density.

The 160-founder desktop workload measured 37.6 FPS / 59.7 TPS at original size 1×; 3.7 FPS / 95.3 TPS at 2×. Large size measured 4.2 FPS / 52.3 TPS and 2.5 FPS / 65.2 TPS. Population growth therefore remains a practical scaling limit.

## Allocation and generation

| Size      | Old three RGBA canvases | New canvas + CPU buffer |
| --------- | ----------------------- | ----------------------- |
| 120 × 160 | 92.16 MB                | 0.1536 MB               |
| 180 × 240 | 207.36 MB               | 0.3456 MB               |
| 240 × 320 | 368.64 MB               | 0.6144 MB               |

These are exact pixel-storage calculations, not measured process/GPU resident memory. They exclude the visible viewport, browser duplicates, world arrays and allocator overhead. New geographic Float32 fields and navigation arrays still scale with cell count. Retaining string terrain identities preserves interfaces; no speculative packed-grid rewrite was needed.

Shared-host Node measurements show generation is more expensive: original-size median generation approximately 16.9 ms baseline versus 68.8 ms redesigned; 240 × 320 approximately 109.4 versus 294.7 ms. Baseline large generation used only canonical seeds, whereas redesigned generation used 30; these are illustrative, not a calibrated speed ratio. Raw per-seed trials are archived. Current world initialization medians were about 78.9 / 315.8 ms and reset 81.6 / 311.0 ms at original/large sizes in those runs. The grass direct-cell lookup preserved arithmetic; interleaved 100-pass large-world batches improved roughly 7.3–7.6 to 5.6–6.9 ms per pass on this host. This microbenchmark has no separately archived raw file.

The cache uses a 2 ms row-processing budget, not a guaranteed total upload/frame bound. Completed passes are separated by 250 ms. Dynamic render/cache aggregate timer records were collected and their raw browser archive is now recovered; no unmeasured cache-update percentile is asserted.

## Full application extended smoke

After the paused-flush fix, a real UI run edited dimensions to 240 × 320, rebuilt/reset the world, used 2× speed, paused, and fitted the whole map on the touch-sized viewport. Observed 60-second window: 7,141 ticks, 962 frames, frame p50/p95/p99 50 / 133.4 / 233.3 ms, ending population 93, no page errors, read-only render state unchanged, reset successful. Coarse Chromium JS heap readout was 50.4 MB; this excludes canvas/GPU allocations. Initial load was approximately 1,000 ms. This is a short extended smoke, not hours-long endurance or a memory-leak certification.

## Ecological endpoints

Each endpoint is 36,000 ticks (ten simulated minutes at 60 TPS). Populations are square / triangle / circle / octagon. A surviving singleton is not a viable breeding population. Equal seeds are not equal founder samples after RNG isolation and changed geography.

| Map / source                  | Seed | S / T / C / O   | Births | Kills | Starvation | Dehydration |
| ----------------------------- | ---- | --------------- | ------ | ----- | ---------- | ----------- |
| Baseline 120 × 160            | 1    | 73 / 4 / 60 / 7 | 154    | 22    | 1          | 1           |
| Baseline 120 × 160            | 42   | 38 / 6 / 61 / 4 | 124    | 20    | 8          | 12          |
| Baseline 120 × 160            | 1337 | 53 / 6 / 88 / 4 | 158    | 16    | 6          | 11          |
| Final 120 × 160               | 1    | 75 / 3 / 85 / 3 | 176    | 18    | 0          | 0           |
| Final 120 × 160               | 42   | 71 / 3 / 42 / 1 | 122    | 20    | 0          | 3           |
| Final 120 × 160               | 1337 | 66 / 1 / 64 / 4 | 151    | 29    | 1          | 2           |
| Final 240 × 320, 80 founders  | 42   | 86 / 0 / 89 / 0 | 176    | 6     | 3          | 2           |
| Final 240 × 320, 128 founders | 42   | 87 / 7 / 96 / 4 | 232    | 22    | 21         | 42          |

Final original-size descendant generations reached herbivore generation 3, triangle generations 2 / 1 / 1 and octagon 2 / 1 / 2. Chase starts were 124 / 82 / 106; pregnancies 200 / 149 / 170. This preserves functioning reproduction and predation but does not establish equilibrium. Large 80-founder extinction is retained as an unfavorable result. The large 128-founder case retains breeding predators but raises starvation/dehydration; no population increase is applied automatically.

A baseline-terrain/spawn control with only new RNG orchestration at seed 42 ended 49 / 5 / 61 / 4, 128 births and 27 kills. This demonstrates initialization sensitivity; the aggregate improvements cannot be attributed solely to hydrology. Pre-spawn-fix large and canonical runs and nine 6,000-tick density scenarios are archived separately. Short runs had no births and cannot establish long-term balance.

Legacy baseline and early short-large runners aliased intermediate death-cause dictionaries and mislabeled final vegetation as initial. Archived review copies omit invalid intermediate cause snapshots, retain valid endpoints, and restore initial vegetation from paired zero-tick files; `_reviewCorrections` documents original hashes. Historical files are not silently presented as pristine trajectories.
