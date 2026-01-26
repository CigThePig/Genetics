# Blueprint — Renderer Perf Micro-optimizations

## Overview

Update the renderer to cache viewport dimensions/background gradients and convert terrain passes into cached layer blits for faster per-frame rendering.

## Files

- src/render/renderer-enhanced.js
  - Cache viewport width/height in renderer state.
  - Add a gradient cache helper keyed by size.
  - Add terrain cache layers for base/detail/grass and helpers to rebuild/update them.
  - Crop terrain cache blits to the viewport to avoid full-surface draws.
  - Throttle grass cache refreshes and key them to a grass dirty counter.
  - Rebuild grass cache incrementally in row slices to avoid frame spikes; add rebuild timers.
- src/sim/world-grid.js
  - Track grassDirtyCounter for grass cache invalidation.
- src/sim/plants/grass.js
  - Increment grassDirtyCounter when grass values change.
- src/sim/plant-generator.js
  - Increment grassDirtyCounter when initial grass seeding changes values.
- src/main.js
  - Add frame.delta and frame.wait perf timers.
- src/ui/index.js
  - Extend frame timer ordering with frame.delta/frame.wait and keep render timers ordered.

## Data/State

- Add cached viewportWidth/viewportHeight in createRenderer closure scope.
- Add cached background gradient + last gradient size for reuse.
- Add a terrain cache object with offscreen canvases and metadata (tile size, world ref, last grass update).
- Track last grass dirty counter and a refresh interval for grass cache updates.
- Track grass rebuild state (active, target dirty counter, next row, start time).
- Track last frame start/total durations for profiling.

## Functions/Responsibilities

- createRenderer()
  - Initialize cached viewport size fields.
- resizeToContainer()
  - Update cached viewport size values when resizing the canvas.
- drawTerrain(), drawCreatures()
  - Use cached viewport dimensions instead of per-frame layout queries.
- getBackgroundGradient(w, h)
  - Return cached gradient if size unchanged, else create and store a new gradient.
- buildBaseTerrainLayer(ctx, world, tileSize)
  - Draw PASS 1 base terrain tiles only.
- buildDetailTerrainLayer(ctx, world, config, tileSize)
  - Draw static overlays for land texture, edge blending, and water foam.
- buildGrassLayer(ctx, world, config, tileSize)
  - Draw grass overlay with subtle highlights.
- ensureTerrainCache(...)
  - Rebuild base/detail/grass layers when world or tile size changes.
- maybeUpdateGrassCache(...)
  - Refresh grass layer on a throttled interval (~250ms) only when grass dirty counter changes.
  - When dirty, incrementally rebuild grass rows with a small time budget per frame and emit rebuild timing.
- add frame.delta + frame.wait timers in the RAF loop (frame start delta + wait gap).

## Risks

- Incorrect cache invalidation on resize could cause stretched visuals.
- Terrain cache invalidation misses could cause stale visuals.

## Verification

- Manual: verify resizing updates render scale and gradient appearance matches prior behavior.
- Manual: verify terrain layers render consistently and grass refreshes at intervals.
- Optional: npm test to ensure baseline checks still pass.
