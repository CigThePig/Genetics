# Reproducing behaviour evidence

## Headless scenarios

```sh
npm ci
npm run verify
npm run test:soak -- --ticks=36000
node scripts/verify-behaviour.mjs --ticks=3600 --out=/tmp/behaviour
node scripts/verify-behaviour.mjs --scenarios=default --ticks=36000 --frame-every=120 --out=/tmp/long
node scripts/verify-behaviour.mjs --source=/path/to/b9afecd-checkout --ticks=3600 --out=/tmp/baseline
node scripts/verify-behaviour.mjs --scenarios=default --seeds=42 --ticks=3600 --population=240 --width=180 --height=240 --scarcity=.3 --out=/tmp/stress
```

`--seeds=1,42,1337` is the default. `--scenarios` accepts default, solitary, peaceful, travel, rejoin, search, divided, approach, pursuit, water, multiple, recovery. Each scenario has the same seed and explicit initial conditions on both implementations. The baseline source is commit **b9afecd**, including review fixes after the historical Track 11 measurements. Historical report numbers consequently need not match this fresh baseline.

Controlled fixtures use an 80 × 80 plains world, zero basal energy/water drain, no mating, colour camouflage disabled, and specified initial cohorts. They isolate movement without silently becoming thirst searches. Sprint stamina costs, actual steering, feeding, perception, intent, chase and catch rules still execute. Travel removes local food; divided/water add a water barrier with an opening. Approach starts with a remembered destination and a three-second initial herd pause. Recovery removes the predator at tick 900 to test alarm expiration. These are explicit fixtures, never default ecosystem rules. Default and stress worlds retain ordinary survival, regional generation, inherited colour and mating.

The runner reads positions every tick and writes path length, final net displacement, unique **4 × 4 tile cells**, turning/stationary tick counts and intent occupancy per animal. Net displacement is from first to last live observation; a dead animal's trajectory ends at death. Counts are not survival-adjusted ecological rates. `goalChanges` uses new locomotion serials when available and target changes on legacy creatures, so it is diagnostic, **not a like-for-like goal-completion comparison**. Full-state/summary SHA-256 establishes replay; timing is deliberately excluded from that hash. Tick timings exclude trajectory aggregation. Ordinary simulation execution does not run the recorder.

Motion files are gzip-compressed JSON. Controlled recordings sample every 30 ticks (0.5 s); long recordings every 120 ticks (2 s). The production simulation still ticks at 60 Hz. Playback interpolation only interpolates recorded coordinates for display; it does not reconstruct unrecorded decisions or claim frame-exact replay.

## Temporal viewer and browser checks

```sh
npm run dev
# Open /Genetics/scripts/behaviour-playback.html
# Add ?long=1 to view ten-minute default recordings.
PLAYWRIGHT_MODULE=/path/to/playwright \
BROWSER_EXECUTABLE=/path/to/chromium \
node scripts/verify-behaviour-browser.cjs
python scripts/plot-behaviour.py
```

The optional browser runner starts Vite on 127.0.0.1:5188. The repository keeps its existing npm dependency set; Playwright and a browser are external development tools. The trajectory plotter optionally requires Python/matplotlib. Neither enters the shipped bundle. Do not modify imported source or the viewer while the runner is active: Vite HMR destroys its execution context. Missing browser binaries/download access are environment limitations, not simulation failures.

The viewer compares baseline/final motion at normal or accelerated speed, with heading markers, recent trails, destination lines and alarm rings. It supports seeking and all three seeds. Full recordings and quantitative exports remain available for inspection beyond the selected images.

The runner uses test-only bootstrap interception to inspect actual app handles; production has no added debug global. It checks read-only rendering, creature explanations, narrow-screen controls and scenario playback, and exports browser tick/render timings. Software rendering and a narrow viewport are not physical-phone performance measurements. Generated data are excluded from formatting checks to avoid parsing giant machine-generated traces; source, tests and handwritten reports remain checked.

Some large media were omitted from this PR at the user's request. Regenerate a final ten-minute viewer record with `node scripts/verify-behaviour.mjs --scenarios=default --ticks=36000 --frame-every=120 --out=tracks/2026-10-20-pre-track12-foundation/evidence/final-long`. Regenerate controlled records before the full browser runner if starting from a checkout without generated evidence. Videos optionally use `python scripts/render-behaviour-clips.py` (Pillow and ffmpeg).
