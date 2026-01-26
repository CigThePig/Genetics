# Blueprint — Renderer Perf Micro-optimizations

## Overview

Update the renderer to cache viewport dimensions/background gradients and convert terrain passes into cached layer blits for faster per-frame rendering.

## Files

- src/render/renderer-enhanced.js
  - Cache viewport width/height in renderer state.
  - Add a gradient cache helper keyed by size.
  - Add terrain cache layers for base/detail/grass and helpers to rebuild/update them.
- src/ui/index.js
  - Extend render timer ordering with terrain cache build/update timers.

## Data/State

- Add cached viewportWidth/viewportHeight in createRenderer closure scope.
- Add cached background gradient + last gradient size for reuse.
- Add a terrain cache object with offscreen canvases and metadata (tile size, world ref, last grass update).

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
  - Refresh grass layer on a short interval (~100ms).

## Risks

- Incorrect cache invalidation on resize could cause stretched visuals.
- Terrain cache invalidation misses could cause stale visuals.

## Verification

- Manual: verify resizing updates render scale and gradient appearance matches prior behavior.
- Manual: verify terrain layers render consistently and grass refreshes at intervals.
- Optional: npm test to ensure baseline checks still pass.
