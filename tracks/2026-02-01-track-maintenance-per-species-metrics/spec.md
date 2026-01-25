# Maintenance Track — Performance Profiler Panel

Goal:

- Add a touch-friendly performance profiler panel and fix the FPS overlay duplication/"--" bug.

Scope:

- Remove the duplicate FPS overlay from the UI and rely solely on metrics-owned overlay.
- Add a perf sampler module and registry for tick/render timing.
- Instrument sim tick and renderer draw calls with perf timers.
- Add a Performance panel tied to the FPS button with touch toggles and live updates.
- Keep simulation behavior, tick order, and dependencies unchanged.

Acceptance:

- Exactly one `.fps-overlay` exists at runtime, managed by metrics.
- FPS overlay reliably shows numbers after repeated toggle off/on.
- Performance panel opens via the FPS button and updates at ~4 Hz.
- Profiler toggles enable/disable tick and render timers without changing sim behavior.
- npm run verify passes.

Risks:

- Timer wrappers could introduce overhead or reorder ticks if misapplied.
- UI might show stale values if snapshotting is incorrect.

Verification:

- npm run verify
- Manual: verify FPS overlay and Performance panel behaviors per checklist.
