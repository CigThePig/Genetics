# Architecture

- `regional-terrain.js`: domain-warped continuous relief/climate and environmentally scored biomes, retaining public grid contracts.
- `hydrology.js`: deterministic cardinal priority flood, depression storage, drainage parent/order and runoff accumulation. Lakes follow real basin geometry; streams follow the drainage tree. Shallow headwaters can remain traversable riparian ground.
- `habitat-colours.js`: shared ecological/rendered colours responding to relief, moisture and local land transitions.
- `terrain-cache.js`: one raster pixel per cell for shared terrain/vegetation colour, bounded time-sliced updates. Geometry/organism sprites remain screen detail. Eliminates full-map 20-pixel tile layers instead of introducing chunk eviction complexity.
- RNG: named stable derived RNG seeds for initial plants, creatures, bushes and runtime. Terrain explicitly accepts world/config and derives geography/climate noise seeds from config.seed (default 1); no terrain RNG is required or consumed. Hydrology consumes no RNG; central seed derivation remains authoritative.
- Diagnostic tools load baseline or current checkout and record identical protocols. Baseline remains pinned to main `971e656`.

Risks: drainage barriers, sparse population in large worlds, climate/colour changes altering selection, grass scans scaling with area. Preserve natural ecological failures; measure before tuning or changing defaults.

Browser comparisons use the production `createAppLoop` timer/RAF driver with real simulation/rendering and no-op panel callbacks, rather than coupling ticks to RAF. Full application UI/clock behavior is checked separately by `verify-world-app.cjs`. Camera movement and cache refresh remain enabled in the engine/render profiles.
