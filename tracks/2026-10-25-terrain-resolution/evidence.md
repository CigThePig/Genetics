# Terrain resolution evidence

Baseline main: `bac974a8953469d8707e52144bf79e3e473b3ad3`, including the merged creature art.

Normal views now use **16×16 logical art pixels per simulation tile**, compared with one solid pixel before. This matches the nominal 48-pixel creature canvas across three tiles. Grass blades, leaf litter, sand grains, rock facets, water ripples, wet margins and pixel foliage share that finer visual language. World dimensions, biome boundaries, water collision, resource values, camouflage samples and all simulation source remain unchanged.

## Verification

- `npm run verify`: 360 JavaScript tests / 30 files, provenance, ESLint, formatting and production build.
- Existing Python research-report suite: 24 tests, with the same immutable-source import used by CI.
- New coverage: deterministic texture, bounded composed colour, partial chunks and five habitat styles, viewport cache admission/reuse/reset, grass-independent reuse, actual terrain invalidation and bounded foliage/berry depletion.
- Actual Chromium captures inspected for seeds 1, 42 and 1337 at overview (.27), normal (1) and close (3) zoom, plus a 390×844 viewport. Zero page errors; the harness confirms rendering does not mutate actors.
- `src/sim/` has no diff against the baseline. Pure raster tests also compare complete world JSON before/after. No new ecological balancing or long-soak claim is made for this graphics-only change.

## Performance

Headless Chromium 153, software graphics, 1440×960. Each live row is one short ~4.2-second trial of the actual app at 80 animals, with the camera observing a founder group. These are observations, not hardware certification or repeated statistical estimates.

| Speed | Before FPS / TPS | After FPS / TPS |
| ----- | ---------------- | --------------- |
| 1×    | 59.4 / 59.9      | 59.3 / 59.8     |
| 2×    | 60.0 / 119.8     | 60.0 / 119.8    |

Twelve paired renderer workloads cover 120×160, 180×240 and 240×320 worlds at four zooms. Each has ten warm-up and eighty timed synchronous renders, plus a cold render and a forced colour flush after 30 simulation ticks. These microbenchmarks are render timings, not FPS/TPS.

| World   | Zoom | Before warm mean (ms) | After warm mean (ms) | After cold (ms) | After colour flush (ms) |
| ------- | ---- | --------------------- | -------------------- | --------------- | ----------------------- |
| 120×160 | 0.27 | 4.845                 | 2.619                | 20.4            | 4.9                     |
| 120×160 | 0.5  | 4.339                 | 3.095                | 52.5            | 4.7                     |
| 120×160 | 1    | 0.243                 | 0.068                | 54.1            | 2.5                     |
| 120×160 | 3    | 0.013                 | 0.019                | 0.1             | 1.4                     |
| 180×240 | 0.27 | 3.973                 | 2.011                | 9.5             | 6.3                     |
| 180×240 | 0.5  | 0.325                 | 0.176                | 52.7            | 3.0                     |
| 180×240 | 1    | 0.065                 | 0.055                | 0.1             | 2.8                     |
| 180×240 | 3    | 0.020                 | 0.022                | 17.4            | 2.8                     |
| 240×320 | 0.27 | 4.207                 | 2.388                | 11.5            | 8.0                     |
| 240×320 | 0.5  | 0.197                 | 0.178                | 64.5            | 5.2                     |
| 240×320 | 1    | 0.086                 | 0.047                | 42.0            | 5.7                     |
| 240×320 | 3    | 0.021                 | 0.018                | 0.1             | 4.7                     |

The detailed canvas LRU is capped at **12 MiB RGBA**, independent of map size; the measured maximum in this matrix was 10.5 MiB. The bush atlas has at most 240 32×32 images (960 KiB). Existing overview storage remains eight pixel-data bytes per cell. Temporary upload buffers, metadata, browser canvas overhead and the main display canvas are additional.

The initial opaque approach rebuilt fine art when grass changed and produced expensive colour flushes. It was replaced before publication with cached transparent texture over the original live colour raster. Final live runs generated the same 96 terrain chunks at both 1× and 2×: no fine-art regeneration on grass changes. Black/white texture opacity is at most 18/255 (about 7%), bounding displayed RGB differences to 18/255 per channel for any underlying colour. It introduces no independent biome colour model.

First views still generate their visible chunks synchronously and can hitch: the largest measured cold render was about 65 ms. Lower-resolution admission (8/4 pixels per tile) reserves room for two visible working sets; extreme views that cannot fit use the original overview. Warm-loop measurements include outliers; raw p95/p99 remain in the JSON. No physical-phone, CPU-throttled or extended-session performance guarantee is claimed.

[Baseline raw results](evidence/before-browser.json) · [Final raw results](evidence/after-browser.json) · [Project verification](evidence/verify.txt) · [Python checks](evidence/python.txt).

## Actual artwork

| View              | Before                               | After                               |
| ----------------- | ------------------------------------ | ----------------------------------- |
| Seed 42, normal   | [Image](evidence/before-42-1.png)    | [Image](evidence/after-42-1.png)    |
| Seed 42, close    | [Image](evidence/before-42-3.png)    | [Image](evidence/after-42-3.png)    |
| Seed 1, normal    | [Image](evidence/before-1-1.png)     | [Image](evidence/after-1-1.png)     |
| Seed 1337, normal | [Image](evidence/before-1337-1.png)  | [Image](evidence/after-1337-1.png)  |
| Overview          | [Image](evidence/before-42-0.27.png) | [Image](evidence/after-42-0.27.png) |
| Narrow screen     | [Image](evidence/before-mobile.png)  | [Image](evidence/after-mobile.png)  |

Existing tile-shaped geographic boundaries are intentional: this changes art resolution, not map topology. Detailed texture remains cosmetic; the existing biome-debug view retains exact cell colours.

Reproduce with `npm ci && npm run verify`, then run:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright-core/index.mjs \
BROWSER_EXECUTABLE=/path/to/chromium \
node scripts/verify-terrain-resolution-browser.mjs
```

Use `--baseline` from a clean baseline worktree and `TERRAIN_EVIDENCE_DIR` pointing to this evidence folder for paired output. Browser dependencies are external to the app.

## Publication

Published as [PR #148](https://github.com/CigThePig/Genetics/pull/148), open and unmerged. The implementation tree `a3d846435a714505b5080a9067562d7242152022` matched the locally staged, verified files exactly. The follow-up commit records closeout documentation only; hosted CI and automated-review status are maintained in the PR description.
