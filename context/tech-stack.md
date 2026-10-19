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

- If needed, run simulation in a Web Worker to keep UI responsive on mobile.

Determinism:

- Required: same seed + same config => same outcomes.

Audit verification: `npm run test:soak` uses Node built-ins, with no added package dependency. It runs default-config seeds 1, 42 and 1337 for 18,000 ticks each; `-- --ticks=N` adjusts its length. Browser smoke verification used temporary external tooling, not a new production/test dependency.
