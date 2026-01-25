# Maintenance Track — Per-Species Metrics Expansion

Goal:

- Add per-species metrics counters and UI groupings for reproduction, deaths, chase, hunting, and genetics.

Scope:

- Extend metrics state with per-species counters alongside existing global metrics.
- Increment per-species counters at reproduction, death, chase, combat, and genetics mutation sources.
- Expose per-species metrics as flat summary keys for the UI.
- Group metrics panel rows by species for relevant sections.

Acceptance:

- state.metrics includes per-species counters for relevant categories without removing existing keys.
- sim.getSummary() exposes flat per-species keys with 0 defaults when missing.
- UI metrics panel renders grouped subsections for Squares/Triangles/Circles/Octagons alongside global metrics.
- Tests pass.

Risks:

- Missing reset paths for per-tick metrics could show stale values.
- UI group ordering could mismatch summary key names.

Verification:

- npm test
- Manual: observe grouped metrics updating during a short sim run.
