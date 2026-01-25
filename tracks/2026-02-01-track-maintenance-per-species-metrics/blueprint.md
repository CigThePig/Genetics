# Maintenance Track — Blueprint

Purpose:

- Add a performance profiler panel and fix FPS overlay ownership while preserving sim determinism and tick order.

Systems touched:

- Metrics overlay and profiler API.
- New perf sampler + registry modules.
- Sim tick and renderer timing wrappers.
- UI performance panel and toggles.
- Styles for touch-friendly controls (minimal).

Files & responsibilities:

- src/metrics/perf-registry.js
  - Global registry for the active perf sampler (avoid circular imports).
- src/metrics/perf.js
  - Perf sampler with named timers, windowed rollups, and group gating.
- src/metrics/index.js
  - Own the single FPS overlay, expose perf controls and snapshots.
- src/sim/sim.js
  - Wrap tick steps with perf timers (no tick order changes).
- src/render/renderer-enhanced.js
  - Wrap draw calls with perf timers (no rendering order changes).
- src/ui/index.js
  - Remove duplicate FPS overlay and add Performance panel + toggles.
- src/styles.css
  - Minimal styling for perf panel controls if needed.
- context/repo-map.md
  - Add new perf modules.

Risks & mitigations:

- Overlay duplication persists → remove UI-created overlay and use metrics only.
- Perf sampling overhead → keep start/end minimal and gate by group.
- Panel update load → throttle to 250ms intervals.
