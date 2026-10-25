# Tech Stack

Target:

- Shareable browser sim hosted on GitHub Pages.

Code:

- JavaScript-first (ES modules).
- Optional later: JSDoc + // @ts-check for lightweight type safety.

Build:

- Vite (fast dev + build pipeline suitable for GitHub Pages).

Testing:

- Vitest for fast unit tests and smoke tests.
- Prefer small deterministic tests with fixed seeds.

Rendering:

- 2D rendering with touch-first camera controls (drag-to-pan, pinch-to-zoom).
- Renderer must be separated from sim logic and run as a read-only post-tick step.

Sim performance:

- Measure bottlenecks first. Authoritative simulation/herding is currently synchronous. A future worker migration must preserve tick boundaries, deterministic result application and per-world state ownership.

Determinism:

- Required: same seed + same config => same outcomes.

Audit verification: `npm run test:soak` uses Node built-ins, with no added package dependency. It runs default-config seeds 1, 42 and 1337 for 18,000 ticks each; `-- --ticks=N` adjusts its length. Browser smoke verification used temporary external tooling, not a new production/test dependency.

Track 11 adds no dependencies. `node scripts/verify-track11.mjs --mode=maps --ticks=0` analyzes 32 seeded maps; `--mode=full|no-camouflage|no-preference|neither --ticks=N --seeds=1,42,1337` runs repeatable comparisons. Map mode accepts `--baseline=/path/to/checkout`. Optional `scripts/verify-track11-browser.cjs` uses an externally available Playwright module/Chromium via `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE`, starts Vite itself, and captures desktop/mobile evidence. `TRACK11_RESULTS` can supply a full-mode JSONL result for measured descendant graph captures; no synthetic evolution is implied.

Pre-Track 12 diagnostics use the existing Node/Vite/Vitest stack, Node gzip for recorded state, and a browser-side temporal canvas viewer. Optional external Playwright/Chromium run interaction/performance captures; Python/matplotlib renders trajectory comparison figures. No new npm production/build dependency is required. See tracks/2026-10-20-pre-track12-foundation/tooling.md.

Predator ecology diagnostics retain Node built-ins and the existing test/build stack. Python/matplotlib is optional for static research figures; standard-library Python compacts archived trait telemetry. Optional external Playwright/Chromium checks actual rendering and touch-sized controls. No production/npm dependency is added. See tracks/2026-10-21-predator-ecology/tooling.md for pinned-baseline and variant reproduction commands.

World-generation diagnostics use Node built-ins, the existing Vite/Vitest toolchain and optional externally supplied Playwright/Chromium. Python atlas/trajectory helpers are optional. No new runtime/npm dependency. See tracks/2026-10-21-world-generation/evidence.md for reproduction and qualification, including the resolved publication-time outage and recovered browser artifacts.

PR #145 review regressions add jsdom 24 as a development-only dependency so persistent inspector nodes, focus, scroll state and family lifecycle are exercised by `npm run verify`. Optional external Playwright still covers actual held mouse/touch input across animation frames. `scripts/benchmark-life-story.mjs` is a Node observer-only scaling probe; it makes no full-engine/mobile performance claim.

## Optional creature-art development tools

The deployed application remains JavaScript/Canvas2D/Vite with no new npm runtime dependency.
Rebuilding the checked-in procedural geometry uses .NET 8 and the MIT-licensed upstream
Core under `tools/creature-baker/`. Ordinary `npm ci`, verification, Pages builds and
runtime do not require .NET. Browser evidence scripts accept an externally installed
Playwright/Chromium via environment variables; these are not production dependencies.
