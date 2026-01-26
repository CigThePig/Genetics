# Maintenance Track — Renderer Perf Micro-optimizations

Goal:
- Reduce renderer hot-loop work by caching terrain passes into layers, eliminating most per-frame tile iteration while keeping visuals consistent.

Includes:
- Cache viewport width/height in the renderer and update on resize.
- Replace per-frame `getBoundingClientRect()` reads with cached viewport size.
- Cache the background radial gradient and rebuild only when size changes.
- Convert terrain PASS 1–4 into cached layer blits with periodic grass refresh.
- Add perf timers for terrain cache build/update and expose them in the UI ordering.

Acceptance:
- No behavior changes besides performance (water detail can become static).
- No new dependencies.
- Existing perf timers remain and snapshot still works, with new cache timers included.
- Lint/build still passes.

Risks:
- Cached sizes may desync if resize handling misses an update.
- Gradient cache may not update if size tracking is incorrect.
- Terrain cache invalidation may miss updates if world or tile size changes.

Verification:
- Manual: run the app, resize the window, confirm rendering scales correctly and visuals match prior behavior.
- Manual: ensure terrain visuals remain consistent and grass updates periodically.
- Automated: npm test (optional if time allows).
